import { executeSpec, isWithinSyncBudget } from "./jobs";

export class BenchmarkCancelledError extends Error {
  constructor() {
    super("Benchmark cancelled");
    this.name = "BenchmarkCancelledError";
    this.cancelled = true;
  }
}

export class BenchmarkTimeoutError extends Error {
  constructor(timeoutMs) {
    super(
      `Benchmark stopped after ${Math.round(timeoutMs / 1000)}s — likely too much work for these input sizes. Reduce the sizes and try again.`,
    );
    this.name = "BenchmarkTimeoutError";
    this.timeout = true;
  }
}

export class BenchmarkBudgetError extends Error {
  constructor(message) {
    super(message);
    this.name = "BenchmarkBudgetError";
  }
}

const WORKERS_ENABLED =
  typeof Worker !== "undefined" && import.meta.env?.MODE !== "test";

function tryCreateWorker() {
  try {
    return new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
  } catch {
    return null;
  }
}

/**
 * Runs a benchmark spec off the main thread.
 *
 * - opts.signal (AbortSignal) cancels the run; rejection carries
 *   BenchmarkCancelledError so callers can distinguish cancellation
 *   from genuine failures.
 * - opts.timeoutMs is a watchdog against pathological jobs; the worker
 *   is terminated cleanly on expiry.
 * - If the worker itself fails to load/run AND the job is small enough,
 *   the existing synchronous engine is used as a graceful fallback so a
 *   broken worker degrades instead of disabling benchmarks entirely.
 */
export function runBenchmark(spec, { signal, timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new BenchmarkCancelledError());
      return;
    }

    let worker = tryCreateWorker();
    let settled = false;
    let timer = null;

    const cleanup = () => {
      if (timer != null) clearTimeout(timer);
      timer = null;
      signal?.removeEventListener("abort", onAbort);
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    const finishResolve = (value) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const finishReject = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    function onAbort() {
      finishReject(new BenchmarkCancelledError());
    }

    signal?.addEventListener("abort", onAbort, { once: true });

    if (!worker) {
      if (!isWithinSyncBudget(spec)) {
        finishReject(
          new BenchmarkBudgetError(
            "Background benchmarking is unavailable in this environment and these inputs are too large to run safely on the main thread. Reduce the input sizes.",
          ),
        );
        return;
      }
      try {
        finishResolve(executeSpec(spec));
      } catch (err) {
        finishReject(err);
      }
      return;
    }

    timer = setTimeout(() => {
      finishReject(new BenchmarkTimeoutError(timeoutMs));
    }, timeoutMs);

    worker.onmessage = (event) => {
      const data = event.data || {};
      if (data.ok) finishResolve(data.results);
      else finishReject(new Error(data.error || "Benchmark failed"));
    };

    worker.onerror = (event) => {
      event.preventDefault?.();
      if (isWithinSyncBudget(spec)) {
        try {
          finishResolve(executeSpec(spec));
          return;
        } catch {}
      }
      finishReject(
        new Error(event.message || "Benchmark worker failed unexpectedly"),
      );
    };

    worker.postMessage(spec);
  });
}
