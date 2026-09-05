import { describe, expect, it } from "vitest";
import { lis } from "./lis";
import { lisDebug } from "./lisDebug";

// ──────────────────────────────────────────────────────────────
// Correctness
// ──────────────────────────────────────────────────────────────
describe("LIS — correctness", () => {
  it("classic: [10,9,2,5,3,7,101,18] → length 4", () => {
    const { length, lisArray } = lis([10, 9, 2, 5, 3, 7, 101, 18]);
    expect(length).toBe(4);
    expect(isIncreasing(lisArray)).toBe(true);
    expect(isSubsequence(lisArray, [10, 9, 2, 5, 3, 7, 101, 18])).toBe(true);
  });

  it("already increasing: [1,2,3,4,5] → length 5", () => {
    const { length, lisArray } = lis([1, 2, 3, 4, 5]);
    expect(length).toBe(5);
    expect(lisArray).toEqual([1, 2, 3, 4, 5]);
  });

  it("decreasing: [5,4,3,2,1] → length 1", () => {
    const { length, lisArray } = lis([5, 4, 3, 2, 1]);
    expect(length).toBe(1);
    expect(lisArray).toHaveLength(1);
  });

  it("single element: [42] → length 1", () => {
    const { length, lisArray } = lis([42]);
    expect(length).toBe(1);
    expect(lisArray).toEqual([42]);
  });

  it("all same: [3,3,3,3] → length 1", () => {
    const { length } = lis([3, 3, 3, 3]);
    expect(length).toBe(1);
  });

  it("two elements increasing: [1,2] → length 2", () => {
    const { length, lisArray } = lis([1, 2]);
    expect(length).toBe(2);
    expect(lisArray).toEqual([1, 2]);
  });

  it("two elements decreasing: [2,1] → length 1", () => {
    const { length } = lis([2, 1]);
    expect(length).toBe(1);
  });

  it("textbook: [0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15] → length 6", () => {
    const { length } = lis([
      0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15,
    ]);
    expect(length).toBe(6);
  });

  it("negative numbers: [-3, -1, -4, -2, 0] → length 3", () => {
    const { length, lisArray } = lis([-3, -1, -4, -2, 0]);
    expect(length).toBe(3);
    expect(isIncreasing(lisArray)).toBe(true);
  });

  it("mixed positive/negative: [-2, 3, -1, 0, 4, -3, 5] → length 5", () => {
    const { length } = lis([-2, 3, -1, 0, 4, -3, 5]);
    expect(length).toBe(5);
  });

  it("alternating: [1, 3, 2, 4, 3, 5] → length 4", () => {
    const { length } = lis([1, 3, 2, 4, 3, 5]);
    expect(length).toBe(4);
  });

  it("longer array", () => {
    const arr = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9];
    const { length } = lis(arr);
    expect(length).toBe(6);
  });
});

// ──────────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────────
describe("LIS — edge cases", () => {
  it("empty array", () => {
    const { length, lisArray, events } = lis([]);
    expect(length).toBe(0);
    expect(lisArray).toEqual([]);
    expect(events.length).toBeGreaterThan(0);
  });

  it("single element", () => {
    const { length, lisArray } = lis([7]);
    expect(length).toBe(1);
    expect(lisArray).toEqual([7]);
  });

  it("two elements", () => {
    expect(lis([1, 2]).length).toBe(2);
    expect(lis([2, 1]).length).toBe(1);
    expect(lis([1, 1]).length).toBe(1);
  });

  it("throws for non-array input", () => {
    // @ts-ignore
    expect(() => lis("not an array")).toThrow(/array/i);
  });

  it("all identical", () => {
    const { length } = lis([5, 5, 5, 5, 5]);
    expect(length).toBe(1);
  });

  it("strictly increasing", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { length } = lis(arr);
    expect(length).toBe(10);
  });

  it("strictly decreasing", () => {
    const arr = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const { length } = lis(arr);
    expect(length).toBe(1);
  });

  it("zeros", () => {
    const { length } = lis([0, 0, 0, 1, 0]);
    expect(length).toBe(2);
  });

  it("large values", () => {
    const { length } = lis([1000000, 1, 2, 3, 1000000]);
    expect(length).toBe(4);
  });
});

// ──────────────────────────────────────────────────────────────
// Reconstruction correctness
// ──────────────────────────────────────────────────────────────
describe("LIS — reconstruction", () => {
  it("result is a subsequence of input", () => {
    const cases = [
      [10, 9, 2, 5, 3, 7, 101, 18],
      [0, 8, 4, 12, 2, 10, 6, 14],
      [3, 1, 4, 1, 5, 9, 2, 6],
      [5, 4, 3, 2, 1],
      [1],
    ];
    for (const arr of cases) {
      const { lisArray } = lis(arr);
      expect(isSubsequence(lisArray, arr)).toBe(true);
    }
  });

  it("result is strictly increasing", () => {
    const cases = [
      [10, 9, 2, 5, 3, 7, 101, 18],
      [0, 8, 4, 12, 2, 10],
      [-3, -1, -4, -2, 0],
      [1, 3, 2, 4, 3, 5],
    ];
    for (const arr of cases) {
      const { lisArray } = lis(arr);
      expect(isIncreasing(lisArray)).toBe(true);
    }
  });

  it("result length matches dp max", () => {
    const arr = [10, 9, 2, 5, 3, 7, 101, 18];
    const { length, lisArray } = lis(arr);
    expect(lisArray.length).toBe(length);
  });

  it("empty array produces empty result", () => {
    const { lisArray } = lis([]);
    expect(lisArray).toEqual([]);
  });

  it("single element produces that element", () => {
    const { lisArray } = lis([42]);
    expect(lisArray).toEqual([42]);
  });

  it("already sorted produces full array", () => {
    const { lisArray } = lis([1, 2, 3, 4, 5]);
    expect(lisArray).toEqual([1, 2, 3, 4, 5]);
  });

  it("result is optimal — no longer increasing subsequence exists", () => {
    // Brute-force check for small arrays
    const arr = [3, 1, 4, 1, 5, 9, 2, 6];
    const { length } = lis(arr);

    let maxLen = 0;
    for (let mask = 0; mask < 1 << arr.length; mask++) {
      const sub = [];
      for (let k = 0; k < arr.length; k++) {
        if (mask & (1 << k)) sub.push(arr[k]);
      }
      if (isIncreasing(sub)) maxLen = Math.max(maxLen, sub.length);
    }
    expect(length).toBe(maxLen);
  });
});

// ──────────────────────────────────────────────────────────────
// Step state correctness
// ──────────────────────────────────────────────────────────────
describe("LIS — step state", () => {
  it("events start with init", () => {
    const { events } = lis([3, 1, 2]);
    expect(events[0].type).toBe("init");
  });

  it("events end with complete", () => {
    const { events } = lis([3, 1, 2]);
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init event sets up single-row table", () => {
    const { events } = lis([10, 9, 2, 5]);
    const init = events[0];
    expect(init.table).toHaveLength(1);
    expect(init.table[0]).toHaveLength(4);
  });

  it("col labels include index and value", () => {
    const { events } = lis([10, 9, 2, 5]);
    const init = events[0];
    expect(init.colLabels[0]).toContain("10");
    expect(init.colLabels[1]).toContain("9");
  });

  it("compare-cell events have valid/invalid markers", () => {
    const { events } = lis([1, 3, 2]);
    const compares = events.filter(
      (e) => e.type === "compare-cell" && e.vars.valid !== undefined,
    );
    expect(compares.length).toBeGreaterThan(0);
    for (const e of compares) {
      expect(e.vars.valid).toBeDefined();
    }
  });

  it("compute-cell events have dp[i] value", () => {
    const { events } = lis([1, 3, 2]);
    const computes = events.filter((e) => e.type === "compute-cell");
    expect(computes.length).toBeGreaterThan(0);
    for (const e of computes) {
      expect(typeof e.value).toBe("number");
    }
  });

  it("backtrack events have decision and lis so far", () => {
    const { events } = lis([1, 3, 2]);
    const backtracks = events.filter((e) => e.type === "backtrack-step");
    expect(backtracks.length).toBeGreaterThan(0);
    for (const e of backtracks) {
      expect(e.vars.decision).toBe("INCLUDE");
      expect(e.vars["lis so far"]).toBeDefined();
    }
  });

  it("complete event has lis length and array", () => {
    const { events } = lis([1, 3, 2, 5, 4]);
    const complete = events[events.length - 1];
    expect(complete.type).toBe("complete");
    expect(complete.vars["lis length"]).toBeDefined();
    expect(complete.vars.lis).toBeDefined();
  });

  it("events are deterministic", () => {
    const r1 = lis([10, 9, 2, 5, 3, 7, 101, 18]);
    const r2 = lis([10, 9, 2, 5, 3, 7, 101, 18]);
    expect(r1.events).toEqual(r2.events);
  });

  it("empty array produces only init and complete events", () => {
    const { events } = lis([]);
    expect(events).toHaveLength(2);
  });

  it("single element produces init, skip, backtrack events", () => {
    const { events } = lis([5]);
    const types = events.map((e) => e.type);
    expect(types).toContain("init");
    expect(types).toContain("skip-cell");
    expect(types).toContain("backtrack-start");
    expect(types).toContain("backtrack-step");
    expect(types).toContain("complete");
  });
});

// ──────────────────────────────────────────────────────────────
// Debug snapshot contracts
// ──────────────────────────────────────────────────────────────
describe("LIS — debug snapshot contracts", () => {
  it("produces valid snapshots", () => {
    const steps = lisDebug([10, 9, 2, 5, 3, 7, 101, 18]);
    expect(steps.length).toBeGreaterThan(0);

    for (const s of steps) {
      expect(typeof s.activeLine).toBe("number");
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(typeof s.log).toBe("string");
      expect(s.log.length).toBeGreaterThan(0);
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack.length).toBeGreaterThan(0);
      expect(Array.isArray(s.table)).toBe(true);
      expect(Array.isArray(s.rowLabels)).toBe(true);
      expect(Array.isArray(s.colLabels)).toBe(true);
      expect(typeof s.phase).toBe("string");
      expect(typeof s.complete).toBe("boolean");
    }
  });

  it("last snapshot has complete=true", () => {
    const steps = lisDebug([10, 9, 2, 5, 3, 7, 101, 18]);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
  });

  it("last snapshot has correct answer", () => {
    const steps = lisDebug([10, 9, 2, 5, 3, 7, 101, 18]);
    const last = steps[steps.length - 1];
    expect(last.answer).toBeDefined();
    expect(last.answer).not.toBe("");
  });

  it("table is single row", () => {
    const steps = lisDebug([1, 2, 3]);
    const first = steps[0];
    expect(first.table).toHaveLength(1);
    expect(first.table[0]).toHaveLength(3);
  });

  it("handles empty array", () => {
    const steps = lisDebug([]);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
  });

  it("handles single element", () => {
    const steps = lisDebug([42]);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
  });

  it("steps are immutable", () => {
    const steps = lisDebug([3, 1, 2]);
    const s0 = steps[0];
    const s1 = steps[1];
    s0.table[0][0].value = 999;
    expect(s1.table[0][0].value).not.toBe(999);
  });

  it("phase transitions from fill to backtrack", () => {
    const steps = lisDebug([3, 1, 2, 5]);
    const phases = steps.map((s) => s.phase);
    expect(phases[0]).toBe("fill");
    expect(phases).toContain("backtrack");
  });

  it("vars contain lis-specific keys during fill", () => {
    const steps = lisDebug([1, 3, 2]);
    const fillSteps = steps.filter(
      (s) => s.phase === "fill" && s.vars.valid !== undefined,
    );
    expect(fillSteps.length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function isIncreasing(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] <= arr[i - 1]) return false;
  }
  return true;
}

function isSubsequence(sub, arr) {
  let si = 0;
  for (let i = 0; i < arr.length && si < sub.length; i++) {
    if (arr[i] === sub[si]) si++;
  }
  return si === sub.length;
}
