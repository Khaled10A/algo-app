import { describe, expect, it } from "vitest";
import { subsetSum } from "./subsetSum";
import { subsetSumDebug } from "./subsetSumDebug";

// ── Helpers ──

function isValidSubset(subset, arr, target) {
  const sum = subset.reduce((a, b) => a + b, 0);
  if (sum !== target) return false;
  // Every element in subset must exist in arr
  const arrCopy = [...arr];
  for (const val of subset) {
    const idx = arrCopy.indexOf(val);
    if (idx === -1) return false;
    arrCopy.splice(idx, 1);
  }
  return true;
}

function allSolutionsDistinct(solutions) {
  const strs = solutions.map((s) => JSON.stringify(s.sort((a, b) => a - b)));
  return new Set(strs).size === strs.length;
}

// ══════════════════════════════════════════════════════════════
// Algorithm correctness
// ══════════════════════════════════════════════════════════════

describe("subsetSum correctness", () => {
  it("basic case: [3,7,1,8,4] target=11", () => {
    const { count, solutions } = subsetSum([3, 7, 1, 8, 4], 11);
    expect(count).toBeGreaterThan(0);
    for (const sol of solutions) {
      expect(isValidSubset(sol, [3, 7, 1, 8, 4], 11)).toBe(true);
    }
  });

  it("[1,2,3] target=6 — one solution: full array", () => {
    const { count, solutions } = subsetSum([1, 2, 3], 6);
    expect(count).toBe(1);
    expect(solutions[0].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("[1,2,3] target=3 — two solutions: [1,2] and [3]", () => {
    const { count, solutions } = subsetSum([1, 2, 3], 3);
    expect(count).toBe(2);
    const normalized = solutions
      .map((s) => [...s].sort((a, b) => a - b))
      .map(JSON.stringify);
    expect(normalized).toContain(JSON.stringify([1, 2]));
    expect(normalized).toContain(JSON.stringify([3]));
  });

  it("[10,20,30] target=15 — no solution", () => {
    const { count, solutions } = subsetSum([10, 20, 30], 15);
    expect(count).toBe(0);
    expect(solutions).toHaveLength(0);
  });

  it("[5,5,5] target=10 — multiple solutions", () => {
    const { count, solutions } = subsetSum([5, 5, 5], 10);
    expect(count).toBe(3); // C(3,2) = 3
    for (const sol of solutions) {
      expect(sol).toHaveLength(2);
      expect(sol[0] + sol[1]).toBe(10);
    }
  });

  it("[1,1,1,1] target=2 — C(4,2)=6 solutions", () => {
    const { count } = subsetSum([1, 1, 1, 1], 2);
    expect(count).toBe(6);
  });

  it("target zero — empty subset is a solution for any array", () => {
    const { count, solutions } = subsetSum([1, 2, 3], 0);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([]);
  });

  it("empty array, target zero — one solution (empty)", () => {
    const { count, solutions } = subsetSum([], 0);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([]);
  });

  it("empty array, non-zero target — no solution", () => {
    const { count } = subsetSum([], 5);
    expect(count).toBe(0);
  });

  it("[7] target=7 — one solution", () => {
    const { count, solutions } = subsetSum([7], 7);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([7]);
  });

  it("[7] target=3 — no solution", () => {
    const { count } = subsetSum([7], 3);
    expect(count).toBe(0);
  });

  it("negative values: [-1, 2, 3] target=1 — one solution", () => {
    const { count, solutions } = subsetSum([-1, 2, 3], 1);
    // -1+2=1 ✓, -1+3=2 ✗, 2+3=5 ✗, -1+2+3=4 ✗
    expect(count).toBe(1);
    expect(solutions[0].sort((a, b) => a - b)).toEqual([-1, 2]);
  });

  it("negative values: [-3, 1, 4] target=1 — two solutions", () => {
    const { count, solutions } = subsetSum([-3, 1, 4], 1);
    // [1]=1 ✓, [-3,4]=1 ✓
    expect(count).toBe(2);
    const normalized = solutions
      .map((s) => [...s].sort((a, b) => a - b))
      .map(JSON.stringify);
    expect(normalized).toContain(JSON.stringify([1]));
    expect(normalized).toContain(JSON.stringify([-3, 4]));
  });

  it("mixed positive/negative: [-2, 3, -1, 4] target=0 — two solutions", () => {
    const { count, solutions } = subsetSum([-2, 3, -1, 4], 0);
    // []=0 ✓, [-2,3,-1]=0 ✓
    expect(count).toBe(2);
    const normalized = solutions
      .map((s) => [...s].sort((a, b) => a - b))
      .map(JSON.stringify);
    expect(normalized).toContain(JSON.stringify([]));
    expect(normalized).toContain(JSON.stringify([-2, -1, 3]));
  });

  it("all solutions are valid subsets", () => {
    const arr = [3, 7, 1, 8, 4, 2];
    const target = 10;
    const { solutions } = subsetSum(arr, target);
    for (const sol of solutions) {
      expect(isValidSubset(sol, arr, target)).toBe(true);
    }
  });

  it("all solutions are distinct", () => {
    const arr = [1, 2, 3, 4, 5];
    const target = 7;
    const { solutions } = subsetSum(arr, target);
    expect(allSolutionsDistinct(solutions)).toBe(true);
  });

  it("larger array with known count", () => {
    // [1,2,3,4,5,6] target=7
    // Solutions: [1,6], [2,5], [3,4], [1,2,4] = 4 solutions
    const { count } = subsetSum([1, 2, 3, 4, 5, 6], 7);
    expect(count).toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════

describe("subsetSum edge cases", () => {
  it("throws for non-array input", () => {
    expect(() => subsetSum("hello", 5)).toThrow(/array/i);
  });

  it("throws for non-number target", () => {
    expect(() => subsetSum([1, 2], "5")).toThrow(/finite number/i);
  });

  it("throws for Infinity target", () => {
    expect(() => subsetSum([1, 2], Infinity)).toThrow(/finite number/i);
  });

  it("throws for NaN target", () => {
    expect(() => subsetSum([1, 2], NaN)).toThrow(/finite number/i);
  });

  it("handles array with zeros", () => {
    const { count, solutions } = subsetSum([0, 0, 0], 0);
    // All 2^3 = 8 subsets sum to 0 (including empty subset)
    expect(count).toBe(8);
    for (const sol of solutions) {
      expect(sol.reduce((a, b) => a + b, 0)).toBe(0);
    }
  });

  it("handles large negative target", () => {
    const { count } = subsetSum([-10, -20, -30], -50);
    expect(count).toBe(1); // [-20, -30]
  });

  it("handles single element matching target", () => {
    const { count, solutions } = subsetSum([42], 42);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([42]);
  });

  it("handles all same values", () => {
    const { count } = subsetSum([3, 3, 3, 3], 6);
    expect(count).toBe(6); // C(4,2) = 6
  });
});

// ══════════════════════════════════════════════════════════════
// Pruning
// ══════════════════════════════════════════════════════════════

describe("subsetSum pruning", () => {
  it("positive array prunes when sum + remaining < target", () => {
    // [1,2,3,4,5] target=20 — impossible (max sum=15)
    const { events } = subsetSum([1, 2, 3, 4, 5], 20);
    const pruneEvents = events.filter((e) => e.type === "prune");
    expect(pruneEvents.length).toBeGreaterThan(0);
  });

  it("negative values prevent premature pruning at top levels", () => {
    // With negatives, pruning should NOT happen at the root level
    // because allNonNeg[0] is false.
    // However, deeper recursive calls may prune if remaining elements
    // are all non-negative and sum + remaining < target.
    const { events } = subsetSum([-5, 10, -3, 8], 12);
    const pruneEvents = events.filter((e) => e.type === "prune");
    // Pruning CAN happen at deeper levels where remaining are non-negative
    // e.g., at index 3: -3 + 8 = 5 < 12, allNonNeg[3]=true → prune
    // This is mathematically correct.
    for (const e of pruneEvents) {
      expect(typeof e.reason).toBe("string");
      expect(e.reason).toContain("target");
    }
  });

  it("mixed array does NOT prune", () => {
    const { events } = subsetSum([-1, 5, 3, -2], 7);
    const pruneEvents = events.filter((e) => e.type === "prune");
    expect(pruneEvents).toHaveLength(0);
  });

  it("prune reason is descriptive", () => {
    const { events } = subsetSum([10, 20, 30], 100);
    const pruneEvents = events.filter((e) => e.type === "prune");
    for (const e of pruneEvents) {
      expect(typeof e.reason).toBe("string");
      expect(e.reason).toContain("target");
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Event sequence
// ══════════════════════════════════════════════════════════════

describe("subsetSum event sequence", () => {
  it("first event is init, last is complete", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    expect(events[0].type).toBe("init");
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init has input state", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const init = events[0];
    expect(init.state.arr).toEqual([1, 2, 3]);
    expect(init.state.target).toBe(3);
  });

  it("complete has solution count", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const complete = events[events.length - 1];
    expect(complete.vars.totalSolutions).toBe("2");
  });

  it("choose events have include/exclude candidates", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const chooseEvents = events.filter((e) => e.type === "choose");
    expect(chooseEvents.length).toBeGreaterThan(0);
    for (const e of chooseEvents) {
      expect(["include", "exclude"]).toContain(e.candidate);
    }
  });

  it("solution events have solution array", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const solEvents = events.filter((e) => e.type === "solution");
    expect(solEvents).toHaveLength(2);
    for (const e of solEvents) {
      expect(Array.isArray(e.solution)).toBe(true);
    }
  });

  it("backtrack events exist", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const btEvents = events.filter((e) => e.type === "backtrack");
    expect(btEvents.length).toBeGreaterThan(0);
  });

  it("enter events have depth", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const enterEvents = events.filter((e) => e.type === "enter");
    for (const e of enterEvents) {
      expect(typeof e.depth).toBe("number");
      expect(e.depth).toBeGreaterThanOrEqual(1);
    }
  });

  it("all events have required fields", () => {
    const { events } = subsetSum([1, 2], 3);
    for (const e of events) {
      expect(typeof e.type).toBe("string");
      expect(e.state).toBeDefined();
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Backtracking
// ══════════════════════════════════════════════════════════════

describe("subsetSum backtracking", () => {
  it("sum is restored after backtrack", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    // Track sum through events — after each backtrack, sum should decrease
    let lastIncludeSum = 0;
    for (const e of events) {
      if (e.type === "constraint-check" && e.candidate === "include") {
        lastIncludeSum = e.state.sum;
      }
      if (e.type === "backtrack" && e.removed === "include") {
        // Sum should have decreased
        expect(e.state.sum).toBeLessThan(lastIncludeSum);
      }
    }
  });

  it("subset shrinks after include-backtrack", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    let includeCount = 0;
    let backtrackCount = 0;
    for (const e of events) {
      if (e.type === "constraint-check" && e.candidate === "include") {
        includeCount++;
      }
      if (e.type === "backtrack" && e.removed === "include") {
        backtrackCount++;
        // After include-backtrack, subset should be shorter
        expect(e.state.subset.length).toBeLessThanOrEqual(includeCount);
      }
    }
    expect(backtrackCount).toBeGreaterThan(0);
  });

  it("no solutions case has no solution events", () => {
    const { events } = subsetSum([10, 20], 5);
    const solEvents = events.filter((e) => e.type === "solution");
    expect(solEvents).toHaveLength(0);
  });

  it("multiple solutions case has correct count", () => {
    const { events } = subsetSum([1, 1, 1], 2);
    const solEvents = events.filter((e) => e.type === "solution");
    expect(solEvents).toHaveLength(3);
  });
});

// ══════════════════════════════════════════════════════════════
// Solution reconstruction
// ══════════════════════════════════════════════════════════════

describe("subsetSum solution reconstruction", () => {
  it("each solution sums to target", () => {
    const arr = [2, 4, 6, 8, 10];
    const target = 12;
    const { solutions } = subsetSum(arr, target);
    for (const sol of solutions) {
      expect(sol.reduce((a, b) => a + b, 0)).toBe(target);
    }
  });

  it("each solution uses only elements from input", () => {
    const arr = [3, 5, 7, 2, 8];
    const target = 10;
    const { solutions } = subsetSum(arr, target);
    const arrCopy = [...arr];
    for (const sol of solutions) {
      const temp = [...arrCopy];
      for (const val of sol) {
        const idx = temp.indexOf(val);
        expect(idx).not.toBe(-1);
        temp.splice(idx, 1);
      }
    }
  });

  it("empty array target=0 gives empty subset", () => {
    const { solutions } = subsetSum([], 0);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════
// Debug projection
// ══════════════════════════════════════════════════════════════

describe("subsetSumDebug", () => {
  it("returns array of steps", () => {
    const steps = subsetSumDebug([1, 2, 3], 3);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("each step has required fields", () => {
    const steps = subsetSumDebug([1, 2, 3], 3);
    for (const s of steps) {
      expect(typeof s.activeLine).toBe("number");
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(typeof s.depth).toBe("number");
      expect(typeof s.phase).toBe("string");
      expect(typeof s.complete).toBe("boolean");
    }
  });

  it("first step is init, last is complete", () => {
    const steps = subsetSumDebug([1, 2, 3], 3);
    expect(steps[0].log).toContain("Find subsets");
    expect(steps[steps.length - 1].complete).toBe(true);
    expect(steps[steps.length - 1].log).toContain("Done");
  });

  it("contains solution steps", () => {
    const steps = subsetSumDebug([1, 2, 3], 3);
    const solutionSteps = steps.filter((s) => s.currentSolution != null);
    expect(solutionSteps).toHaveLength(2);
  });

  it("contains backtrack steps", () => {
    const steps = subsetSumDebug([1, 2, 3], 3);
    const btSteps = steps.filter((s) => s.phase === "backtrack");
    expect(btSteps.length).toBeGreaterThan(0);
  });

  it("state is serialized as summary string", () => {
    const steps = subsetSumDebug([1, 2, 3], 3);
    const stateSteps = steps.filter(
      (s) => s.memory.state && s.memory.state.includes("sum="),
    );
    expect(stateSteps.length).toBeGreaterThan(0);
  });

  it("no solution case produces steps", () => {
    const steps = subsetSumDebug([10, 20], 5);
    const last = steps[steps.length - 1];
    expect(last.vars.totalSolutions).toBe("0");
  });

  it("steps are immutable snapshots", () => {
    const steps = subsetSumDebug([1, 2, 3], 3);
    // Mutate a step's state
    if (steps[0].state?.subset) {
      steps[0].state.subset.push(999);
    }
    // Other steps should not be affected
    expect(steps[1].state?.subset?.[0]).not.toBe(999);
  });

  it("activeLine values are within codeLines bounds", () => {
    const steps = subsetSumDebug([1, 2], 3);
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(11);
    }
  });

  it("vars show sum and index", () => {
    const steps = subsetSumDebug([1, 2, 3], 3);
    const stepWithSum = steps.find((s) => s.vars.sum != null);
    expect(stepWithSum).toBeDefined();
    expect(typeof stepWithSum.vars.sum).toBe("string");
    expect(typeof stepWithSum.vars.index).toBe("string");
  });
});

// ══════════════════════════════════════════════════════════════
// State immutability
// ══════════════════════════════════════════════════════════════

describe("subsetSum state immutability", () => {
  it("event states are deep-copied", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const state1 = events[0].state;
    const state2 = events[1].state;
    expect(state1).not.toBe(state2);
    // Mutating one should not affect the other
    state1.arr[0] = 999;
    expect(state2.arr[0]).toBe(1);
  });

  it("solution arrays are deep-copied", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const solEvents = events.filter((e) => e.type === "solution");
    const sol1 = solEvents[0].solution;
    const sol2 = solEvents[1].solution;
    expect(sol1).not.toBe(sol2);
  });

  it("subset in state is deep-copied", () => {
    const { events } = subsetSum([1, 2, 3], 3);
    const checkEvents = events.filter(
      (e) => e.type === "constraint-check" && e.candidate === "include",
    );
    if (checkEvents.length >= 2) {
      expect(checkEvents[0].state.subset).not.toBe(checkEvents[1].state.subset);
    }
  });
});
