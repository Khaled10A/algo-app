import { executeSpec } from './jobs';

const WORKERS_ENABLED =
  typeof Worker !== "undefined" && import.meta.env?.MODE !== "test";

function createWorker() {
  if (!WORKERS_ENABLED) return null;
  try {
    return new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }
}

/**
 * Runs a benchmark spec off the main thread when Web Workers are
 * available; falls back to synchronous execution (same engine code
 * path) otherwise, e.g. in test environments.
 */
export function runBenchmark(spec) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const worker = createWorker();

    if (!worker) {
      try {
        resolve(executeSpec(spec));
      } catch (err) {
        reject(err);
      }
      return;
    }

    const finish = (fn) => (payload) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      fn(payload);
    };

    worker.onmessage = finish((event) => {
      const data = event.data;
      if (data.ok) resolve(data.results);
      else reject(new Error(data.error));
    });

    worker.onerror = finish((event) => {
      event.preventDefault?.();
      reject(new Error(event.message || "Benchmark worker failed"));
    });

    worker.postMessage(spec);
  });
}
