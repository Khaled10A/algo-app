import { describe, expect, it } from "vitest";
import { fibonacciMemo } from "./fibonacciMemo";
import { fibonacciTab } from "./fibonacciTab";
import { fibonacciMemoDebug } from "./fibonacciMemoDebug";
import { fibonacciTabDebug } from "./fibonacciTabDebug";

// ──────────────────────────────────────────────────────────────
// Correctness
// ──────────────────────────────────────────────────────────────
describe("Fibonacci — correctness", () => {
  const cases = [
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 3],
    [5, 5],
    [6, 8],
    [7, 13],
    [10, 55],
    [20, 6765],
    [30, 832040],
  ];

  it.each(cases)("fibMemo(%i) = %i", (n, expected) => {
    expect(fibonacciMemo(n).result).toBe(expected);
  });

  it.each(cases)("fibTab(%i) = %i", (n, expected) => {
    expect(fibonacciTab(n).result).toBe(expected);
  });

  it("memoization and tabulation produce identical results for all inputs", () => {
    for (let n = 0; n <= 20; n++) {
      expect(fibonacciMemo(n).result).toBe(fibonacciTab(n).result);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────────
describe("Fibonacci — edge cases", () => {
  it("fib(0) returns 0", () => {
    expect(fibonacciMemo(0).result).toBe(0);
    expect(fibonacciTab(0).result).toBe(0);
  });

  it("fib(1) returns 1", () => {
    expect(fibonacciMemo(1).result).toBe(1);
    expect(fibonacciTab(1).result).toBe(1);
  });

  it("fib(2) returns 1", () => {
    expect(fibonacciMemo(2).result).toBe(1);
    expect(fibonacciTab(2).result).toBe(1);
  });

  it("rejects negative numbers", () => {
    expect(() => fibonacciMemo(-1)).toThrow(/not defined/i);
    expect(() => fibonacciTab(-1)).toThrow(/not defined/i);
  });

  it("rejects inputs > 30", () => {
    expect(() => fibonacciMemo(31)).toThrow(/too large/i);
    expect(() => fibonacciTab(31)).toThrow(/too large/i);
  });
});

// ──────────────────────────────────────────────────────────────
// Event determinism
// ──────────────────────────────────────────────────────────────
describe("Fibonacci — event determinism", () => {
  it("memoization produces identical event sequences", () => {
    const r1 = fibonacciMemo(5);
    const r2 = fibonacciMemo(5);
    expect(r1.events).toEqual(r2.events);
  });

  it("tabulation produces identical event sequences", () => {
    const r1 = fibonacciTab(5);
    const r2 = fibonacciTab(5);
    expect(r1.events).toEqual(r2.events);
  });
});

// ──────────────────────────────────────────────────────────────
// Memoization — cache hit verification
// ──────────────────────────────────────────────────────────────
describe("Fibonacci Memoization — cache hits", () => {
  it("reuses cached values (compare-cell events for cache hits)", () => {
    const { events } = fibonacciMemo(5);
    const compareEvents = events.filter((e) => e.type === "compare-cell");
    // F(5) should hit cache for F(2) and F(3) at minimum
    expect(compareEvents.length).toBeGreaterThanOrEqual(2);
  });

  it("all compare-cell events have cached=true", () => {
    const { events } = fibonacciMemo(10);
    const compareEvents = events.filter((e) => e.type === "compare-cell");
    for (const e of compareEvents) {
      expect(e.vars.cached).toBe("true");
    }
  });

  it("computes exactly n-1 new values (skipping base cases)", () => {
    const { events } = fibonacciMemo(10);
    const computeEvents = events.filter(
      (e) => e.type === "compute-cell" && e.value != null,
    );
    // F(0) and F(1) are base cases (skip-cell), F(2)..F(10) are computed
    expect(computeEvents).toHaveLength(9);
  });

  it("each completed compute-cell has a non-null value", () => {
    const { events } = fibonacciMemo(8);
    const computeEvents = events.filter(
      (e) => e.type === "compute-cell" && e.value != null,
    );
    for (const e of computeEvents) {
      expect(typeof e.value).toBe("number");
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Tabulation — sequence verification
// ──────────────────────────────────────────────────────────────
describe("Fibonacci Tabulation — sequence", () => {
  it("fills cells in left-to-right order", () => {
    const { events } = fibonacciTab(5);
    const computeEvents = events.filter((e) => e.type === "compute-cell");
    const cellIndices = computeEvents.map((e) => e.cell[1]);
    expect(cellIndices).toEqual([2, 3, 4, 5]);
  });

  it("each compute-cell depends on the two previous cells", () => {
    const { events } = fibonacciTab(8);
    const computeEvents = events.filter((e) => e.type === "compute-cell");
    for (const e of computeEvents) {
      const i = e.cell[1];
      expect(e.dependencies).toEqual([
        [0, i - 1],
        [0, i - 2],
      ]);
    }
  });

  it("always emits 2 skip-cell events for base cases", () => {
    const { events } = fibonacciTab(10);
    const skipEvents = events.filter((e) => e.type === "skip-cell");
    expect(skipEvents).toHaveLength(2);
    expect(skipEvents[0].cell).toEqual([0, 0]);
    expect(skipEvents[0].value).toBe(0);
    expect(skipEvents[1].cell).toEqual([0, 1]);
    expect(skipEvents[1].value).toBe(1);
  });

  it("total events = init + 2 base + (n-1) * 2 (compare+compute) + complete", () => {
    const n = 10;
    const { events } = fibonacciTab(n);
    // init + 2 skip + 9*(compare+compute) + 1 complete = 22
    expect(events).toHaveLength(1 + 2 + (n - 1) * 2 + 1);
  });
});

// ──────────────────────────────────────────────────────────────
// Debug snapshot contracts
// ──────────────────────────────────────────────────────────────
describe("Fibonacci — debug snapshot contracts", () => {
  const algos = [
    ["fibMemo", fibonacciMemoDebug],
    ["fibTab", fibonacciTabDebug],
  ];

  it.each(algos)("%s produces valid snapshots", (_name, debug) => {
    const steps = debug(8);
    expect(steps.length).toBeGreaterThan(0);

    for (const s of steps) {
      // Required debug fields
      expect(typeof s.activeLine).toBe("number");
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(typeof s.log).toBe("string");
      expect(s.log.length).toBeGreaterThan(0);
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack.length).toBeGreaterThan(0);

      // DP-specific fields
      expect(Array.isArray(s.table)).toBe(true);
      expect(Array.isArray(s.rowLabels)).toBe(true);
      expect(Array.isArray(s.colLabels)).toBe(true);
      expect(typeof s.phase).toBe("string");
      expect(typeof s.complete).toBe("boolean");
    }
  });

  it.each(algos)("%s last snapshot has complete=true", (_name, debug) => {
    const steps = debug(5);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.log).toMatch(/Done|F\(\d+\)/i);
  });

  it.each(algos)("%s last snapshot has the correct answer", (_name, debug) => {
    const steps = debug(10);
    const last = steps[steps.length - 1];
    expect(last.answer).toBe("55");
  });

  it.each(algos)("%s table has correct dimensions", (_name, debug) => {
    const steps = debug(7);
    const first = steps[0];
    // 1 row, n+1 columns
    expect(first.table).toHaveLength(1);
    expect(first.table[0]).toHaveLength(8);
    expect(first.colLabels).toHaveLength(8);
  });

  it.each(algos)("%s handles n=0 edge case", (_name, debug) => {
    const steps = debug(0);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("0");
  });

  it.each(algos)("%s handles n=1 edge case", (_name, debug) => {
    const steps = debug(1);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("1");
  });

  it.each(algos)("%s steps are immutable", (_name, debug) => {
    const steps = debug(5);
    const s0 = steps[0];
    const s1 = steps[1];
    // Mutating step 0 should not affect step 1
    s0.table[0][0].value = 999;
    expect(s1.table[0][0].value).not.toBe(999);
  });
});

// ──────────────────────────────────────────────────────────────
// Memoization vs Tabulation — visual difference
// ──────────────────────────────────────────────────────────────
describe("Fibonacci — memo vs tab visual difference", () => {
  it("memoization has more total events than tabulation (recursive calls)", () => {
    const memoEvents = fibonacciMemo(10).events;
    const tabEvents = fibonacciTab(10).events;
    // Memoization has extra events for recursive calls and cache hits
    expect(memoEvents.length).toBeGreaterThan(tabEvents.length);
  });

  it("memoization emits compute-cell with null before computing (shows pending state)", () => {
    const { events } = fibonacciMemo(5);
    const nullComputes = events.filter(
      (e) => e.type === "compute-cell" && e.value === null,
    );
    // At least some compute-cell events should show null (pending state)
    expect(nullComputes.length).toBeGreaterThan(0);
  });

  it("tabulation never emits compute-cell with null (always immediate)", () => {
    const { events } = fibonacciTab(10);
    const nullComputes = events.filter(
      (e) => e.type === "compute-cell" && e.value === null,
    );
    expect(nullComputes).toHaveLength(0);
  });

  it("both produce the same final table state", () => {
    const memoSteps = fibonacciMemoDebug(10);
    const tabSteps = fibonacciTabDebug(10);

    const memoFinal = memoSteps[memoSteps.length - 1];
    const tabFinal = tabSteps[tabSteps.length - 1];

    // Same table values
    const memoValues = memoFinal.table[0].map((c) => c.value);
    const tabValues = tabFinal.table[0].map((c) => c.value);
    expect(memoValues).toEqual(tabValues);
  });


});
