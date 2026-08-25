// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  BenchmarkBudgetError,
  BenchmarkCancelledError,
  runBenchmark,
} from "./runner";
import { LIMITS, validateSpec } from "./jobs";

describe("runBenchmark cancellation and budget guards", () => {
  it("rejects immediately with a distinguishable error when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      runBenchmark({ kind: "sorting", algoIds: ["insertion-sort"], types: ["random"], sizes: [10], inputMode: "random" }, { signal: controller.signal })
    ).rejects.toMatchObject({ name: "BenchmarkCancelledError", cancelled: true });
  });

  it("rejects huge jobs on the sync path with a budget error instead of blocking", async () => {
    const err = await runBenchmark({
      kind: "sorting",
      algoIds: ["bubble-sort"],
      types: ["random"],
      sizes: [LIMITS.maxSyncFallbackSize + 1],
      inputMode: "random",
      repeats: 1,
      warmup: 0,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(BenchmarkBudgetError);
    expect(String(err.message)).toMatch(/too large|reduce/i);
  });

  it("resolves small jobs through the synchronous fallback in test environments", async () => {
    const results = await runBenchmark({
      kind: "search-generate",
      algoIds: ["brute-force"],
      scenarios: ["start"],
      sizes: [50],
      pattern: "ab",
      repeats: 1,
      warmup: 0,
    });
    expect(results["brute-force"].start[0].n).toBe(50);
  });

  it("aborting after settle does not reject or throw unhandled errors", async () => {
    const controller = new AbortController();
    const promise = runBenchmark(
      { kind: "sorting", algoIds: ["selection-sort"], types: ["sorted"], sizes: [20], inputMode: "random", repeats: 1, warmup: 0 },
      { signal: controller.signal }
    );
    const onUnhandled = vi.fn();
    process.on("unhandledRejection", onUnhandled);
    controller.abort();
    const results = await promise;
    process.off("unhandledRejection", onUnhandled);
    expect(results["selection-sort"].sorted[0].n).toBe(20);
    expect(onUnhandled).not.toHaveBeenCalled();
  });
});

describe("input limits", () => {
  it("rejects oversized input sizes with actionable messages", () => {
    const message = validateSpec({
      kind: "sorting",
      algoIds: ["insertion-sort"],
      types: ["random"],
      sizes: [LIMITS.maxSizePerPoint + 1],
      inputMode: "random",
    });
    expect(message).toMatch(/exceeds the maximum/i);
  });

  it("rejects runs exceeding the maximum benchmark points", () => {
    const sizes = Array.from({ length: 13 }, (_, i) => i + 1);
    const message = validateSpec({
      kind: "sorting",
      algoIds: ["insertion-sort"],
      types: ["random", "sorted"],
      sizes,
      inputMode: "random",
    });
    expect(message).toMatch(/benchmark points/i);
  });

  it("accepts reasonable default configurations", () => {
    expect(
      validateSpec({
        kind: "sorting",
        algoIds: ["insertion-sort"],
        types: ["random", "sorted"],
        sizes: [50, 100],
        inputMode: "random",
      })
    ).toBeNull();
  });
});
