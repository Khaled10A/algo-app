import { describe, expect, it } from "vitest";
import { combinations } from "./combinations";
import { combinationsDebug } from "./combinationsDebug";

// ── Helpers ──

function binomial(n, k) {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) {
    r = (r * (n - i)) / (i + 1);
  }
  return r;
}

function isCombination(sol, arr, k) {
  if (sol.length !== k) return false;
  // Every element in sol must exist in arr
  const arrCopy = [...arr];
  for (const val of sol) {
    const idx = arrCopy.indexOf(val);
    if (idx === -1) return false;
    arrCopy.splice(idx, 1);
  }
  // Elements must be in index order (no duplicate orderings)
  for (let i = 1; i < sol.length; i++) {
    const prevIdx = arr.indexOf(sol[i - 1]);
    const currIdx = arr.indexOf(sol[i]);
    if (currIdx <= prevIdx) return false;
  }
  return true;
}

function allSolutionsAreCombinations(solutions, arr, k) {
  return solutions.every((sol) => isCombination(sol, arr, k));
}

function allSolutionsDistinct(solutions) {
  const strs = solutions.map(JSON.stringify);
  return new Set(strs).size === strs.length;
}

// ══════════════════════════════════════════════════════════════
// Algorithm correctness
// ══════════════════════════════════════════════════════════════

describe("combinations correctness", () => {
  it("k=0 — one solution: empty subset", () => {
    const { count, solutions } = combinations([1, 2, 3], 0);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([]);
  });

  it("k=n — one solution: all elements", () => {
    const { count, solutions } = combinations([1, 2, 3], 3);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([1, 2, 3]);
  });

  it("k>n — no solutions", () => {
    const { count, solutions } = combinations([1, 2], 5);
    expect(count).toBe(0);
    expect(solutions).toHaveLength(0);
  });

  it("[1,2,3] k=2 — C(3,2)=3 solutions", () => {
    const { count, solutions } = combinations([1, 2, 3], 2);
    expect(count).toBe(3);
    expect(allSolutionsAreCombinations(solutions, [1, 2, 3], 2)).toBe(true);
    expect(allSolutionsDistinct(solutions)).toBe(true);
    const strs = solutions.map(JSON.stringify);
    expect(strs).toContain(JSON.stringify([1, 2]));
    expect(strs).toContain(JSON.stringify([1, 3]));
    expect(strs).toContain(JSON.stringify([2, 3]));
  });

  it("[1,2,3,4] k=2 — C(4,2)=6 solutions", () => {
    const { count } = combinations([1, 2, 3, 4], 2);
    expect(count).toBe(6);
  });

  it("[1,2,3,4,5] k=3 — C(5,3)=10 solutions", () => {
    const { count } = combinations([1, 2, 3, 4, 5], 3);
    expect(count).toBe(10);
  });

  it("[1,2,3,4,5] k=2 — C(5,2)=10 solutions", () => {
    const { count } = combinations([1, 2, 3, 4, 5], 2);
    expect(count).toBe(10);
  });

  it("expected counts match binomial coefficient", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    for (let k = 0; k <= 6; k++) {
      const { count } = combinations(arr, k);
      expect(count).toBe(binomial(6, k));
    }
  });

  it("all solutions are valid combinations", () => {
    const arr = [1, 2, 3, 4, 5];
    const { solutions } = combinations(arr, 3);
    for (const sol of solutions) {
      expect(isCombination(sol, arr, 3)).toBe(true);
    }
  });

  it("all solutions are distinct", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const { solutions } = combinations(arr, 3);
    expect(allSolutionsDistinct(solutions)).toBe(true);
  });

  it("order does not matter — no duplicate orderings", () => {
    const { solutions } = combinations([1, 2, 3, 4], 2);
    // Each solution should be sorted
    for (const sol of solutions) {
      for (let i = 1; i < sol.length; i++) {
        expect(sol[i]).toBeGreaterThan(sol[i - 1]);
      }
    }
  });

  it("[10,20,30] k=1 — 3 singletons", () => {
    const { count, solutions } = combinations([10, 20, 30], 1);
    expect(count).toBe(3);
    const strs = solutions.map(JSON.stringify);
    expect(strs).toContain(JSON.stringify([10]));
    expect(strs).toContain(JSON.stringify([20]));
    expect(strs).toContain(JSON.stringify([30]));
  });
});

// ══════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════

describe("combinations edge cases", () => {
  it("throws for non-array input", () => {
    expect(() => combinations("hello", 2)).toThrow(/array/i);
  });

  it("throws for non-integer k", () => {
    expect(() => combinations([1, 2], 1.5)).toThrow(/non-negative integer/i);
  });

  it("throws for negative k", () => {
    expect(() => combinations([1, 2], -1)).toThrow(/non-negative integer/i);
  });

  it("throws for string k", () => {
    expect(() => combinations([1, 2], "2")).toThrow(/non-negative integer/i);
  });

  it("throws for NaN k", () => {
    expect(() => combinations([1, 2], NaN)).toThrow(/non-negative integer/i);
  });

  it("empty array, k=0 — one solution", () => {
    const { count, solutions } = combinations([], 0);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([]);
  });

  it("empty array, k>0 — no solutions", () => {
    const { count } = combinations([], 3);
    expect(count).toBe(0);
  });

  it("handles array with zeros", () => {
    const { count, solutions } = combinations([0, 0, 0], 2);
    expect(count).toBe(3);
    for (const sol of solutions) {
      expect(sol).toHaveLength(2);
    }
  });

  it("handles negative values", () => {
    const { count, solutions } = combinations([-1, -2, -3], 2);
    expect(count).toBe(3);
    expect(allSolutionsAreCombinations(solutions, [-1, -2, -3], 2)).toBe(true);
  });

  it("handles mixed positive/negative", () => {
    const { count, solutions } = combinations([-1, 2, -3, 4], 2);
    expect(count).toBe(6);
    expect(
      allSolutionsAreCombinations(solutions, [-1, 2, -3, 4], 2),
    ).toBe(true);
  });

  it("single element, k=1", () => {
    const { count, solutions } = combinations([42], 1);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([42]);
  });

  it("single element, k=0", () => {
    const { count, solutions } = combinations([42], 0);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════
// Event sequence
// ══════════════════════════════════════════════════════════════

describe("combinations event sequence", () => {
  it("first event is init, last is complete", () => {
    const { events } = combinations([1, 2, 3], 2);
    expect(events[0].type).toBe("init");
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init has input state", () => {
    const { events } = combinations([1, 2, 3], 2);
    const init = events[0];
    expect(init.state.arr).toEqual([1, 2, 3]);
    expect(init.state.path).toEqual([]);
  });

  it("complete has solution count", () => {
    const { events } = combinations([1, 2, 3], 2);
    const complete = events[events.length - 1];
    expect(complete.vars.totalSolutions).toBe("3");
  });

  it("choose events have candidate and candidates", () => {
    const { events } = combinations([1, 2, 3], 2);
    const chooseEvents = events.filter((e) => e.type === "choose");
    expect(chooseEvents.length).toBeGreaterThan(0);
    for (const e of chooseEvents) {
      expect(typeof e.candidate).toBe("number");
      expect(Array.isArray(e.candidates)).toBe(true);
    }
  });

  it("solution events have solution array", () => {
    const { events } = combinations([1, 2, 3], 2);
    const solEvents = events.filter((e) => e.type === "solution");
    expect(solEvents).toHaveLength(3);
    for (const e of solEvents) {
      expect(Array.isArray(e.solution)).toBe(true);
      expect(e.solution).toHaveLength(2);
    }
  });

  it("backtrack events exist and have removed field", () => {
    const { events } = combinations([1, 2, 3], 2);
    const btEvents = events.filter((e) => e.type === "backtrack");
    expect(btEvents.length).toBeGreaterThan(0);
    for (const e of btEvents) {
      expect(e.removed).toBeDefined();
    }
  });

  it("enter events have depth", () => {
    const { events } = combinations([1, 2, 3, 4], 2);
    const enterEvents = events.filter((e) => e.type === "enter");
    for (const e of enterEvents) {
      expect(typeof e.depth).toBe("number");
      expect(e.depth).toBeGreaterThanOrEqual(1);
    }
  });

  it("all events have required fields", () => {
    const { events } = combinations([1, 2], 1);
    for (const e of events) {
      expect(typeof e.type).toBe("string");
      expect(e.state).toBeDefined();
    }
  });

  it("k>n produces init + complete (no solutions)", () => {
    const { events } = combinations([1, 2], 5);
    const types = events.map((e) => e.type);
    expect(types).toContain("init");
    expect(types).toContain("complete");
    expect(types).not.toContain("solution");
  });

  it("k=0 produces init + solution + complete", () => {
    const { events } = combinations([1, 2, 3], 0);
    const types = events.map((e) => e.type);
    expect(types).toContain("init");
    expect(types).toContain("solution");
    expect(types).toContain("complete");
  });

  it("start index ensures increasing order", () => {
    const { events } = combinations([1, 2, 3, 4], 2);
    // Each solution should be in increasing order
    const solEvents = events.filter((e) => e.type === "solution");
    for (const e of solEvents) {
      for (let i = 1; i < e.solution.length; i++) {
        expect(e.solution[i]).toBeGreaterThan(e.solution[i - 1]);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Backtracking
// ══════════════════════════════════════════════════════════════

describe("combinations backtracking", () => {
  it("path is restored after backtrack", () => {
    const { events } = combinations([1, 2, 3, 4], 2);
    for (let i = 0; i < events.length; i++) {
      if (events[i].type === "backtrack") {
        // Path should be shorter after backtrack
        expect(events[i].state.path.length).toBeLessThanOrEqual(
          events[i].depth - 1,
        );
      }
    }
  });

  it("no solutions case has no solution events", () => {
    const { events } = combinations([1, 2], 5);
    const solEvents = events.filter((e) => e.type === "solution");
    expect(solEvents).toHaveLength(0);
  });

  it("multiple solutions case has correct count", () => {
    const { events } = combinations([1, 2, 3, 4, 5], 2);
    const solEvents = events.filter((e) => e.type === "solution");
    expect(solEvents).toHaveLength(10);
  });

  it("backtrack events restore path state", () => {
    const { events } = combinations([1, 2, 3], 2);
    // Find choose events followed by backtrack events
    for (let i = 0; i < events.length; i++) {
      if (events[i].type === "backtrack") {
        // The path after backtrack should be shorter than before
        expect(events[i].state.path.length).toBeLessThanOrEqual(2);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Solution reconstruction
// ══════════════════════════════════════════════════════════════

describe("combinations solution reconstruction", () => {
  it("each solution has correct length", () => {
    const arr = [1, 2, 3, 4, 5];
    const k = 3;
    const { solutions } = combinations(arr, k);
    for (const sol of solutions) {
      expect(sol).toHaveLength(k);
    }
  });

  it("each solution uses only elements from input", () => {
    const arr = [2, 4, 6, 8, 10];
    const k = 3;
    const { solutions } = combinations(arr, k);
    for (const sol of solutions) {
      const arrCopy = [...arr];
      for (const val of sol) {
        const idx = arrCopy.indexOf(val);
        expect(idx).not.toBe(-1);
        arrCopy.splice(idx, 1);
      }
    }
  });

  it("empty array k=0 gives empty subset", () => {
    const { solutions } = combinations([], 0);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual([]);
  });

  it("solutions are in index order (no duplicate orderings)", () => {
    const arr = [30, 10, 40, 50, 90];
    const { solutions } = combinations(arr, 3);
    for (const sol of solutions) {
      for (let i = 1; i < sol.length; i++) {
        const prevIdx = arr.indexOf(sol[i - 1]);
        const currIdx = arr.indexOf(sol[i]);
        expect(currIdx).toBeGreaterThan(prevIdx);
      }
    }
  });

  it("known combinations match manual enumeration", () => {
    // [A, B, C, D] k=2
    const arr = [1, 2, 3, 4];
    const { solutions } = combinations(arr, 2);
    const expected = [
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
      [3, 4],
    ];
    const strs = solutions.map(JSON.stringify);
    const expectedStrs = expected.map(JSON.stringify);
    for (const exp of expectedStrs) {
      expect(strs).toContain(exp);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Debug projection
// ══════════════════════════════════════════════════════════════

describe("combinationsDebug", () => {
  it("returns array of steps", () => {
    const steps = combinationsDebug([1, 2, 3], 2);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("each step has required fields", () => {
    const steps = combinationsDebug([1, 2, 3], 2);
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
    const steps = combinationsDebug([1, 2, 3], 2);
    expect(steps[0].log).toContain("Generate all C");
    expect(steps[steps.length - 1].complete).toBe(true);
    expect(steps[steps.length - 1].log).toContain("Done");
  });

  it("contains solution steps", () => {
    const steps = combinationsDebug([1, 2, 3], 2);
    const solutionSteps = steps.filter((s) => s.currentSolution != null);
    expect(solutionSteps).toHaveLength(3);
  });

  it("contains backtrack steps", () => {
    const steps = combinationsDebug([1, 2, 3, 4], 2);
    const btSteps = steps.filter((s) => s.phase === "backtrack");
    expect(btSteps.length).toBeGreaterThan(0);
  });

  it("state is serialized as summary string", () => {
    const steps = combinationsDebug([1, 2, 3], 2);
    const stateSteps = steps.filter(
      (s) => s.memory.state && s.memory.state.includes("comb="),
    );
    expect(stateSteps.length).toBeGreaterThan(0);
  });

  it("k>n case produces steps", () => {
    const steps = combinationsDebug([1, 2], 5);
    const last = steps[steps.length - 1];
    expect(last.vars.totalSolutions).toBe("0");
  });

  it("k=0 case produces steps", () => {
    const steps = combinationsDebug([1, 2, 3], 0);
    const last = steps[steps.length - 1];
    expect(last.vars.totalSolutions).toBe("1");
  });

  it("steps are immutable snapshots", () => {
    const steps = combinationsDebug([1, 2, 3], 2);
    // Mutate a step's state
    if (steps[0].state?.path) {
      steps[0].state.path.push(999);
    }
    // Other steps should not be affected
    if (steps[1].state?.path) {
      expect(steps[1].state.path).not.toContain(999);
    }
  });

  it("activeLine values are within codeLines bounds", () => {
    const steps = combinationsDebug([1, 2, 3], 2);
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(8);
    }
  });

  it("vars show depth and start", () => {
    const steps = combinationsDebug([1, 2, 3, 4], 2);
    const stepWithStart = steps.find((s) => s.vars.start != null);
    expect(stepWithStart).toBeDefined();
    expect(typeof stepWithStart.vars.start).toBe("string");
  });
});

// ══════════════════════════════════════════════════════════════
// State immutability
// ══════════════════════════════════════════════════════════════

describe("combinations state immutability", () => {
  it("event states are deep-copied", () => {
    const { events } = combinations([1, 2, 3], 2);
    const state1 = events[0].state;
    const state2 = events[1].state;
    expect(state1).not.toBe(state2);
    // Mutating one should not affect the other
    if (state1.arr) state1.arr[0] = 999;
    if (state2.arr) expect(state2.arr[0]).toBe(1);
  });

  it("solution arrays are deep-copied", () => {
    const { events } = combinations([1, 2, 3], 2);
    const solEvents = events.filter((e) => e.type === "solution");
    if (solEvents.length >= 2) {
      expect(solEvents[0].solution).not.toBe(solEvents[1].solution);
    }
  });

  it("path in state is deep-copied", () => {
    const { events } = combinations([1, 2, 3, 4], 2);
    const enterEvents = events.filter((e) => e.type === "enter");
    if (enterEvents.length >= 2) {
      expect(enterEvents[0].state.path).not.toBe(enterEvents[1].state.path);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Combinations-specific: no duplicate orderings
// ══════════════════════════════════════════════════════════════

describe("combinations ordering invariant", () => {
  it("never produces [2,1] when [1,2] exists", () => {
    const { solutions } = combinations([1, 2, 3, 4], 2);
    const strs = solutions.map(JSON.stringify);
    // [2,1] should never appear
    expect(strs).not.toContain(JSON.stringify([2, 1]));
    // [1,2] should appear
    expect(strs).toContain(JSON.stringify([1, 2]));
  });

  it("all solutions are in index order (no duplicate orderings)", () => {
    const arr = [50, 10, 40, 90, 20];
    const { solutions } = combinations(arr, 3);
    for (const sol of solutions) {
      for (let i = 1; i < sol.length; i++) {
        const prevIdx = arr.indexOf(sol[i - 1]);
        const currIdx = arr.indexOf(sol[i]);
        expect(currIdx).toBeGreaterThan(prevIdx);
      }
    }
  });

  it("C(n,k) == C(n,n-k) for all k", () => {
    const arr = [1, 2, 3, 4, 5];
    for (let k = 0; k <= 5; k++) {
      const { count } = combinations(arr, k);
      const { count: countCompl } = combinations(arr, 5 - k);
      expect(count).toBe(countCompl);
    }
  });
});
