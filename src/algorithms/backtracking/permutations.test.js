import { describe, expect, it } from "vitest";
import { permutations } from "./permutations";
import { permutationsDebug } from "./permutationsDebug";

// ── Helpers ──

function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function isPermutation(sol, arr) {
  if (sol.length !== arr.length) return false;
  const sortedSol = [...sol].sort((a, b) => a - b);
  const sortedArr = [...arr].sort((a, b) => a - b);
  return JSON.stringify(sortedSol) === JSON.stringify(sortedArr);
}

function allSolutionsArePermutations(solutions, arr) {
  return solutions.every((sol) => isPermutation(sol, arr));
}

function allSolutionsDistinct(solutions) {
  const strs = solutions.map(JSON.stringify);
  return new Set(strs).size === strs.length;
}

// ══════════════════════════════════════════════════════════════
// Algorithm correctness
// ══════════════════════════════════════════════════════════════

describe("permutations correctness", () => {
  it("empty array — one solution (empty)", () => {
    const { count, solutions } = permutations([]);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([]);
  });

  it("single element — one solution", () => {
    const { count, solutions } = permutations([42]);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([42]);
  });

  it("[1,2] — 2! = 2 solutions", () => {
    const { count, solutions } = permutations([1, 2]);
    expect(count).toBe(2);
    const strs = solutions.map(JSON.stringify);
    expect(strs).toContain(JSON.stringify([1, 2]));
    expect(strs).toContain(JSON.stringify([2, 1]));
  });

  it("[1,2,3] — 3! = 6 solutions", () => {
    const { count, solutions } = permutations([1, 2, 3]);
    expect(count).toBe(6);
    expect(allSolutionsArePermutations(solutions, [1, 2, 3])).toBe(true);
    expect(allSolutionsDistinct(solutions)).toBe(true);
  });

  it("[1,2,3,4] — 4! = 24 solutions", () => {
    const { count } = permutations([1, 2, 3, 4]);
    expect(count).toBe(24);
  });

  it("[1,2,3,4,5] — 5! = 120 solutions", () => {
    const { count } = permutations([1, 2, 3, 4, 5]);
    expect(count).toBe(120);
  });

  it("all solutions are valid permutations", () => {
    const arr = [10, 20, 30, 40];
    const { solutions } = permutations(arr);
    for (const sol of solutions) {
      expect(isPermutation(sol, arr)).toBe(true);
    }
  });

  it("all solutions are distinct", () => {
    const arr = [10, 20, 30, 40];
    const { solutions } = permutations(arr);
    expect(allSolutionsDistinct(solutions)).toBe(true);
  });

  it("expected count matches factorial", () => {
    for (let n = 0; n <= 6; n++) {
      const arr = Array.from({ length: n }, (_, i) => i + 1);
      const { count } = permutations(arr);
      expect(count).toBe(factorial(n));
    }
  });

  it("preserves element values exactly", () => {
    const arr = [7, 3, 9, 1];
    const { solutions } = permutations(arr);
    for (const sol of solutions) {
      expect(sol.length).toBe(arr.length);
      const sortedSol = [...sol].sort((a, b) => a - b);
      const sortedArr = [...arr].sort((a, b) => a - b);
      expect(sortedSol).toEqual(sortedArr);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════

describe("permutations edge cases", () => {
  it("throws for non-array input", () => {
    expect(() => permutations("hello")).toThrow(/array/i);
  });

  it("throws for null input", () => {
    expect(() => permutations(null)).toThrow(/array/i);
  });

  it("throws for undefined input", () => {
    expect(() => permutations(undefined)).toThrow(/array/i);
  });

  it("handles array with zeros", () => {
    const { count } = permutations([0, 0, 0]);
    // All permutations are [0,0,0] but elements are distinct by index
    // so 3! = 6 permutations
    expect(count).toBe(6);
    // All solutions are [0,0,0]
    const { solutions } = permutations([0, 0, 0]);
    for (const sol of solutions) {
      expect(sol).toEqual([0, 0, 0]);
    }
  });

  it("handles negative values", () => {
    const { count, solutions } = permutations([-1, -2, -3]);
    expect(count).toBe(6);
    expect(allSolutionsArePermutations(solutions, [-1, -2, -3])).toBe(true);
  });

  it("handles mixed positive/negative", () => {
    const { count, solutions } = permutations([-1, 2, -3]);
    expect(count).toBe(6);
    expect(allSolutionsArePermutations(solutions, [-1, 2, -3])).toBe(true);
  });

  it("handles large values", () => {
    const { count } = permutations([100, 200, 300]);
    expect(count).toBe(6);
  });

  it("handles single element", () => {
    const { count, solutions } = permutations([99]);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual([99]);
  });

  it("two-element case orderings", () => {
    const { solutions } = permutations([5, 10]);
    expect(solutions).toHaveLength(2);
    expect(solutions[0]).toEqual([5, 10]);
    expect(solutions[1]).toEqual([10, 5]);
  });
});

// ══════════════════════════════════════════════════════════════
// Event sequence
// ══════════════════════════════════════════════════════════════

describe("permutations event sequence", () => {
  it("first event is init, last is complete", () => {
    const { events } = permutations([1, 2, 3]);
    expect(events[0].type).toBe("init");
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init has input state", () => {
    const { events } = permutations([1, 2]);
    const init = events[0];
    expect(init.state.arr).toEqual([1, 2]);
    expect(init.state.path).toEqual([]);
  });

  it("complete has solution count", () => {
    const { events } = permutations([1, 2]);
    const complete = events[events.length - 1];
    expect(complete.vars.totalSolutions).toBe("2");
  });

  it("choose events have candidate and candidates", () => {
    const { events } = permutations([1, 2]);
    const chooseEvents = events.filter((e) => e.type === "choose");
    expect(chooseEvents.length).toBeGreaterThan(0);
    for (const e of chooseEvents) {
      expect(typeof e.candidate).toBe("number");
      expect(Array.isArray(e.candidates)).toBe(true);
    }
  });

  it("solution events have solution array", () => {
    const { events } = permutations([1, 2, 3]);
    const solEvents = events.filter((e) => e.type === "solution");
    expect(solEvents).toHaveLength(6);
    for (const e of solEvents) {
      expect(Array.isArray(e.solution)).toBe(true);
      expect(e.solution).toHaveLength(3);
    }
  });

  it("backtrack events exist and have removed field", () => {
    const { events } = permutations([1, 2]);
    const btEvents = events.filter((e) => e.type === "backtrack");
    expect(btEvents.length).toBeGreaterThan(0);
    for (const e of btEvents) {
      expect(e.removed).toBeDefined();
    }
  });

  it("enter events have depth", () => {
    const { events } = permutations([1, 2, 3]);
    const enterEvents = events.filter((e) => e.type === "enter");
    for (const e of enterEvents) {
      expect(typeof e.depth).toBe("number");
      expect(e.depth).toBeGreaterThanOrEqual(1);
    }
  });

  it("all events have required fields", () => {
    const { events } = permutations([1, 2]);
    for (const e of events) {
      expect(typeof e.type).toBe("string");
      expect(e.state).toBeDefined();
    }
  });

  it("empty array produces init + solution + complete", () => {
    const { events } = permutations([]);
    const types = events.map((e) => e.type);
    expect(types).toContain("init");
    expect(types).toContain("solution");
    expect(types).toContain("complete");
  });

  it("used array tracks which elements are in path", () => {
    const { events } = permutations([1, 2]);
    // Find a choose event and verify the used state
    const chooseEvents = events.filter((e) => e.type === "choose");
    expect(chooseEvents.length).toBeGreaterThan(0);
    // After choosing, the used array should reflect the choice
    const checkEvents = events.filter((e) => e.type === "constraint-check");
    for (const e of checkEvents) {
      const usedCount = e.state.used.filter(Boolean).length;
      expect(usedCount).toBe(e.state.path.length);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Backtracking
// ══════════════════════════════════════════════════════════════

describe("permutations backtracking", () => {
  it("path is restored after backtrack", () => {
    const { events } = permutations([1, 2, 3]);
    // After each backtrack event, the path length should decrease
    for (let i = 0; i < events.length; i++) {
      if (events[i].type === "backtrack") {
        expect(events[i].state.path.length).toBeLessThanOrEqual(
          events[i].depth - 1,
        );
      }
    }
  });

  it("used array is restored after backtrack", () => {
    const { events } = permutations([1, 2, 3]);
    // Find a backtrack event and verify used is restored
    const btEvents = events.filter((e) => e.type === "backtrack");
    expect(btEvents.length).toBeGreaterThan(0);
    for (const e of btEvents) {
      const usedCount = e.state.used.filter(Boolean).length;
      expect(usedCount).toBe(e.state.path.length);
    }
  });

  it("no solutions case — impossible for permutations", () => {
    // Permutations always has at least one solution (even for empty array)
    const { count } = permutations([]);
    expect(count).toBe(1);
  });

  it("backtrack count matches expected pattern", () => {
    // For [1,2], there should be backtracks after each permutation
    const { events } = permutations([1, 2]);
    const btEvents = events.filter((e) => e.type === "backtrack");
    // 2! = 2 permutations, each needs backtrack
    expect(btEvents.length).toBe(4); // 2 backtracks per leaf + internal
  });
});

// ══════════════════════════════════════════════════════════════
// Solution reconstruction
// ══════════════════════════════════════════════════════════════

describe("permutations solution reconstruction", () => {
  it("each solution has correct length", () => {
    const arr = [1, 2, 3, 4];
    const { solutions } = permutations(arr);
    for (const sol of solutions) {
      expect(sol).toHaveLength(arr.length);
    }
  });

  it("each solution contains all input elements", () => {
    const arr = [2, 4, 6, 8];
    const { solutions } = permutations(arr);
    for (const sol of solutions) {
      const sortedSol = [...sol].sort((a, b) => a - b);
      const sortedArr = [...arr].sort((a, b) => a - b);
      expect(sortedSol).toEqual(sortedArr);
    }
  });

  it("empty array gives single empty solution", () => {
    const { solutions } = permutations([]);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual([]);
  });

  it("single element gives single-element solution", () => {
    const { solutions } = permutations([42]);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual([42]);
  });
});

// ══════════════════════════════════════════════════════════════
// Debug projection
// ══════════════════════════════════════════════════════════════

describe("permutationsDebug", () => {
  it("returns array of steps", () => {
    const steps = permutationsDebug([1, 2, 3]);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("each step has required fields", () => {
    const steps = permutationsDebug([1, 2]);
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
    const steps = permutationsDebug([1, 2, 3]);
    expect(steps[0].log).toContain("Generate all permutations");
    expect(steps[steps.length - 1].complete).toBe(true);
    expect(steps[steps.length - 1].log).toContain("Done");
  });

  it("contains solution steps", () => {
    const steps = permutationsDebug([1, 2]);
    const solutionSteps = steps.filter((s) => s.currentSolution != null);
    expect(solutionSteps).toHaveLength(2);
  });

  it("contains backtrack steps", () => {
    const steps = permutationsDebug([1, 2, 3]);
    const btSteps = steps.filter((s) => s.phase === "backtrack");
    expect(btSteps.length).toBeGreaterThan(0);
  });

  it("state is serialized as summary string", () => {
    const steps = permutationsDebug([1, 2, 3]);
    const stateSteps = steps.filter(
      (s) => s.memory.state && s.memory.state.includes("path="),
    );
    expect(stateSteps.length).toBeGreaterThan(0);
  });

  it("no solution case produces steps (impossible for perms)", () => {
    const steps = permutationsDebug([]);
    const last = steps[steps.length - 1];
    expect(last.vars.totalSolutions).toBe("1");
  });

  it("steps are immutable snapshots", () => {
    const steps = permutationsDebug([1, 2]);
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
    const steps = permutationsDebug([1, 2]);
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(8);
    }
  });

  it("vars show depth", () => {
    const steps = permutationsDebug([1, 2, 3]);
    const stepWithDepth = steps.find((s) => s.vars.depth != null);
    expect(stepWithDepth).toBeDefined();
    expect(typeof stepWithDepth.vars.depth).toBe("string");
  });
});

// ══════════════════════════════════════════════════════════════
// State immutability
// ══════════════════════════════════════════════════════════════

describe("permutations state immutability", () => {
  it("event states are deep-copied", () => {
    const { events } = permutations([1, 2, 3]);
    const state1 = events[0].state;
    const state2 = events[1].state;
    expect(state1).not.toBe(state2);
    // Mutating one should not affect the other
    if (state1.arr) state1.arr[0] = 999;
    if (state2.arr) expect(state2.arr[0]).toBe(1);
  });

  it("solution arrays are deep-copied", () => {
    const { events } = permutations([1, 2]);
    const solEvents = events.filter((e) => e.type === "solution");
    if (solEvents.length >= 2) {
      expect(solEvents[0].solution).not.toBe(solEvents[1].solution);
    }
  });

  it("path in state is deep-copied", () => {
    const { events } = permutations([1, 2, 3]);
    const enterEvents = events.filter((e) => e.type === "enter");
    if (enterEvents.length >= 2) {
      expect(enterEvents[0].state.path).not.toBe(enterEvents[1].state.path);
    }
  });
});
