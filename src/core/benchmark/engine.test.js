import { describe, expect, it, vi } from "vitest";
import { measure, median, runBenchmarkJob } from "./engine";
import { executeSpec, validateSpec } from "./jobs";

describe("median", () => {
  it("picks the middle value for odd counts", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages the middle pair for even counts", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("returns 0 for empty input", () => {
    expect(median([])).toBe(0);
  });
});

describe("measure", () => {
  it("runs setup once per warmup + repeat and excludes setup from timing", () => {
    const setup = vi.fn(() => [[5, 2, 9]]);
    const fn = vi.fn((arr) => ({ comparisons: arr.length }));

    measure(fn, { setup, warmup: 2, repeats: 4 });

    expect(setup).toHaveBeenCalledTimes(6);
    expect(fn).toHaveBeenCalledTimes(6);
  });

  it("aggregates with the median of repeats", () => {
    let i = 0;
    const stamps = [0, 10, 0, 30, 0, 50];
    const clock = () => stamps[Math.min(i++, stamps.length - 1)];
    const { time } = measure(() => ({}), { setup: () => [], warmup: 1, repeats: 3, now: clock });
    expect(time).toBe(30);
  });

  it("captures operation counters from a measured run", () => {
    const { output } = measure(() => ({ comparisons: 42 }), { setup: () => [], repeats: 3 });
    expect(output.comparisons).toBe(42);
  });
});

describe("runBenchmarkJob", () => {
  it("shares one prepared input across algorithms per (scenario, size)", () => {
    const seen = [];
    const makeInput = vi.fn(() => {
      const arr = [3, 1, 2];
      seen.push(arr);
      return [arr];
    });
    const inputsPerAlgo = [];

    runBenchmarkJob({
      algos: [
        { id: "a", run: (arr) => { inputsPerAlgo.push(arr); return { comparisons: 1 }; } },
        { id: "b", run: (arr) => { inputsPerAlgo.push(arr); return { comparisons: 2 }; } },
      ],
      scenarios: [{ key: "random", makeInput }],
      sizes: [3],
      warmup: 0,
      repeats: 1,
    });

    expect(makeInput).toHaveBeenCalledTimes(1);
    expect(inputsPerAlgo[0]).toBe(inputsPerAlgo[1]);
  });

  it("normalizes points with n, median time and comparisons", () => {
    const results = runBenchmarkJob({
      algos: [{ id: "x", run: (arr) => ({ comparisons: 7 }) }],
      scenarios: [{ key: "sorted", makeInput: () => [[4, 1, 2, 3]] }],
      sizes: [4],
      warmup: 1,
      repeats: 2,
    });
    expect(results.x.sorted).toHaveLength(1);
    expect(results.x.sorted[0]).toMatchObject({ n: 4, comparisons: 7 });
    expect(typeof results.x.sorted[0].time).toBe("number");
  });

  it("collects matches when the scenario requests them", () => {
    const results = runBenchmarkJob({
      algos: [{ id: "s", run: (text) => ({ matches: [0], comparisons: text.length }) }],
      scenarios: [{ key: "file", collect: "matches", makeInput: () => ["abab"] }],
      sizes: [4],
      warmup: 0,
      repeats: 1,
    });
    expect(results.s.file[0].matches).toEqual([0]);
  });
});

describe("executeSpec (regression: single execution per algorithm)", () => {
  it("search-file produces consistent time/comparisons/matches from one run", () => {
    const results = executeSpec({
      kind: "search-file",
      algoIds: ["brute-force", "horspool", "kmp"],
      pattern: "aa",
      text: "aaaa",
      repeats: 2,
    });
    for (const id of ["brute-force", "horspool", "kmp"]) {
      expect(results[id].file).toHaveLength(1);
      const point = results[id].file[0];
      expect(point.n).toBe(4);
      expect(point.matches).toEqual([0, 1, 2]);
      expect(point.comparisons).toBeGreaterThan(0);
    }
  });

  it("sorting spec honors custom arrays and selected types", () => {
    const results = executeSpec({
      kind: "sorting",
      algoIds: ["insertion-sort"],
      types: ["random", "sorted"],
      inputMode: "custom",
      customArrayStr: "3,1,2",
      repeats: 1,
    });
    expect(results["insertion-sort"].random[0].n).toBe(3);
    expect(results["insertion-sort"].sorted[0].comparisons).toBeGreaterThan(0);
  });

  it("validateSpec rejects empty selections without throwing", () => {
    expect(validateSpec({ kind: "sorting", algoIds: [], types: [], sizes: [] })).toBeTruthy();
    expect(validateSpec({ kind: "search-generate", pattern: "", algoIds: [] })).toBeTruthy();
    expect(
      validateSpec({ kind: "search-generate", pattern: "x", algoIds: ["kmp"], sizes: [10], scenarios: ["start"] })
    ).toBeNull();
  });
});
