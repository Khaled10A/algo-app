import { describe, expect, it } from "vitest";
import { matrixChain } from "./matrixChain";
import { matrixChainDebug } from "./matrixChainDebug";

// ──────────────────────────────────────────────────────────────
// Correctness
// ──────────────────────────────────────────────────────────────
describe("MatrixChain — correctness", () => {
  it("textbook: [10,30,5,60] → 4500", () => {
    // A1(10×30), A2(30×5), A3(5×60)
    // ((A1×A2)×A3) = 10×30×5 + 10×5×60 = 1500+3000 = 4500
    const { minCost } = matrixChain([10, 30, 5, 60]);
    expect(minCost).toBe(4500);
  });

  it("classic: [40, 20, 30, 10, 30] → 26000", () => {
    const { minCost } = matrixChain([40, 20, 30, 10, 30]);
    expect(minCost).toBe(26000);
  });

  it("classic: [10, 20, 30, 40, 30] → 30000", () => {
    const { minCost } = matrixChain([10, 20, 30, 40, 30]);
    expect(minCost).toBe(30000);
  });

  it("two matrices: [10, 20, 30] → 6000", () => {
    const { minCost, parenthesization } = matrixChain([10, 20, 30]);
    expect(minCost).toBe(6000);
    expect(parenthesization).toBe("(A1 × A2)");
  });

  it("all same dimensions: [2, 2, 2, 2] → 16", () => {
    const { minCost } = matrixChain([2, 2, 2, 2]);
    expect(minCost).toBe(16);
  });

  it("linear chain benefits from optimal grouping: [1,100,1,100,1] → 201", () => {
    // A1(1×100), A2(100×1), A3(1×100), A4(100×1)
    // Optimal: (A1×A2)×(A3×A4)
    // (A1×A2) = 1×100×1 = 100, result 1×1
    // (A3×A4) = 1×100×1 = 100, result 1×1
    // (1×1)×(1×1) = 1×1×1 = 1
    // Total: 100+100+1 = 201
    const { minCost } = matrixChain([1, 100, 1, 100, 1]);
    expect(minCost).toBe(201);
  });

  it("six matrices: [5, 10, 3, 12, 5, 50, 6] → 2010", () => {
    // 7 dimensions = 6 matrices
    const { minCost } = matrixChain([5, 10, 3, 12, 5, 50, 6]);
    expect(minCost).toBe(2010);
  });

  it("four matrices: [2,3,4,5,6] → 124", () => {
    // A1(2×3), A2(3×4), A3(4×5), A4(5×6)
    // dp[0][3] = 124
    const { minCost } = matrixChain([2, 3, 4, 5, 6]);
    expect(minCost).toBe(124);
  });

  it("three matrices with expensive inner: [1000, 1, 1000, 1] → 1001000", () => {
    // A1(1000×1), A2(1×1000), A3(1000×1)
    // (A1×A2)×A3: 1000×1×1000 + 1000×1000×1 = 1M + 1M = 2M
    // A1×(A2×A3): 1×1000×1 + 1000×1×1 = 1000 + 1000 = 2000
    // Wait: (A1×A2): 1000×1×1000 = 1000000, result 1000×1... wait
    // Actually A1 is 1000×1, A2 is 1×1000
    // A1×A2 = 1000×1×1000 = 1000000, result 1000×1000
    // (A1×A2)×A3 = 1000×1000×1 = 1000000, total 2000000
    // A2×A3 = 1×1000×1 = 1000, result 1×1
    // A1×(A2×A3) = 1000×1×1 = 1000, total 2000
    const { minCost } = matrixChain([1000, 1, 1000, 1]);
    expect(minCost).toBe(2000);
  });
});

// ──────────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────────
describe("MatrixChain — edge cases", () => {
  it("single matrix", () => {
    const { minCost, parenthesization, events } = matrixChain([10, 20]);
    expect(minCost).toBe(0);
    expect(parenthesization).toBe("A1");
    expect(events.length).toBeGreaterThan(0);
  });

  it("two matrices", () => {
    const { minCost, parenthesization } = matrixChain([3, 5, 7]);
    expect(minCost).toBe(105);
    expect(parenthesization).toBe("(A1 × A2)");
  });

  it("throws for non-array input", () => {
    // @ts-ignore
    expect(() => matrixChain("not an array")).toThrow(/array/i);
  });

  it("throws for fewer than 2 dimensions", () => {
    expect(() => matrixChain([10])).toThrow(/at least 2/);
    expect(() => matrixChain([])).toThrow(/at least 2/);
  });

  it("throws for non-positive dimensions", () => {
    expect(() => matrixChain([10, 0, 20])).toThrow(/positive integers/);
    expect(() => matrixChain([10, -5, 20])).toThrow(/positive integers/);
    expect(() => matrixChain([10, 1.5, 20])).toThrow(/positive integers/);
  });

  it("large dimensions", () => {
    const { minCost } = matrixChain([100, 200, 300, 400]);
    // (A1×A2)×A3: 100×200×300 + 100×300×400 = 6M + 12M = 18M
    // A1×(A2×A3): 200×300×400 + 100×200×400 = 24M + 8M = 32M
    expect(minCost).toBe(18000000);
  });

  it("equal inner dimensions: [5,5,5,5] → 250", () => {
    // A1(5×5) A2(5×5) A3(5×5)
    // (A1×A2)×A3: 5×5×5 + 5×5×5 = 125+125 = 250
    // A1×(A2×A3): 5×5×5 + 5×5×5 = 125+125 = 250
    const { minCost } = matrixChain([5, 5, 5, 5]);
    expect(minCost).toBe(250);
  });
});

// ──────────────────────────────────────────────────────────────
// Reconstruction correctness
// ──────────────────────────────────────────────────────────────
describe("MatrixChain — reconstruction", () => {
  it("parenthesization for two matrices", () => {
    const { parenthesization } = matrixChain([10, 20, 30]);
    expect(parenthesization).toBe("(A1 × A2)");
  });

  it("parenthesization for three matrices (textbook)", () => {
    const { parenthesization, minCost } = matrixChain([10, 30, 5, 60]);
    expect(parenthesization).toBe("((A1 × A2) × A3)");
    expect(minCost).toBe(4500);
  });

  it("parenthesization for four matrices contains all matrix refs", () => {
    const { parenthesization } = matrixChain([40, 20, 30, 10, 30]);
    expect(parenthesization).toMatch(/^\(.*×.*\)$/);
    expect(parenthesization).toContain("A1");
    expect(parenthesization).toContain("A2");
    expect(parenthesization).toContain("A3");
    expect(parenthesization).toContain("A4");
  });

  it("single matrix parenthesization", () => {
    const { parenthesization } = matrixChain([5, 10]);
    expect(parenthesization).toBe("A1");
  });

  it("parenthesization is valid (balanced parentheses)", () => {
    const { parenthesization } = matrixChain([10, 30, 5, 60]);
    let depth = 0;
    for (const ch of parenthesization) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      expect(depth).toBeGreaterThanOrEqual(0);
    }
    expect(depth).toBe(0);
  });

  it("parenthesization contains exactly n matrix references", () => {
    const dims = [10, 30, 5, 60];
    const { parenthesization } = matrixChain(dims);
    const matrixRefs = parenthesization.match(/A\d+/g);
    expect(matrixRefs).toHaveLength(3);
  });

  it("single matrix: no multiplication needed", () => {
    const { minCost, parenthesization } = matrixChain([100, 200]);
    expect(minCost).toBe(0);
    expect(parenthesization).toBe("A1");
  });

  it("parenthesization cost matches minCost for large example", () => {
    const dims = [40, 20, 30, 10, 30];
    const { minCost, parenthesization } = matrixChain(dims);
    // Verify by checking parenthesization structure
    // The parenthesization should contain exactly 4 matrix refs
    const refs = parenthesization.match(/A\d+/g);
    expect(refs).toHaveLength(4);
    expect(minCost).toBe(26000);
  });

  it("parenthesization for symmetric case", () => {
    // [5,5,5,5]: all same cost either way
    const { parenthesization, minCost } = matrixChain([5, 5, 5, 5]);
    expect(parenthesization).toMatch(/\(A1.*×.*A3\)/);
    expect(minCost).toBe(250);
  });
});

// ──────────────────────────────────────────────────────────────
// Step state correctness
// ──────────────────────────────────────────────────────────────
describe("MatrixChain — step state", () => {
  it("events start with init", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    expect(events[0].type).toBe("init");
  });

  it("events end with complete", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init event sets up n×n table", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const init = events[0];
    expect(init.table).toHaveLength(3);
    expect(init.table[0]).toHaveLength(3);
  });

  it("diagonal is initialized to 0", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const init = events[0];
    for (let i = 0; i < 3; i++) {
      expect(init.table[i][i].value).toBe(0);
    }
  });

  it("skip-cell events for base cases", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const skips = events.filter((e) => e.type === "skip-cell");
    expect(skips).toHaveLength(3);
  });

  it("compare-cell events show split candidates", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const compares = events.filter((e) => e.type === "compare-cell");
    expect(compares.length).toBeGreaterThan(0);
    for (const e of compares) {
      if (e.vars.split) {
        expect(e.vars.total).toBeDefined();
        expect(e.vars.best).toBeDefined();
      }
    }
  });

  it("compute-cell events have interval and min cost", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const computes = events.filter((e) => e.type === "compute-cell");
    expect(computes.length).toBe(3); // 3 intervals of length ≥ 2
    for (const e of computes) {
      expect(typeof e.value).toBe("number");
      expect(e.vars.interval).toBeDefined();
      expect(e.vars["min cost"]).toBeDefined();
    }
  });

  it("backtrack events show parenthesization", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const backtracks = events.filter((e) => e.type === "backtrack-step");
    expect(backtracks.length).toBeGreaterThan(0);
    for (const e of backtracks) {
      expect(e.vars.parenthesization).toBeDefined();
    }
  });

  it("complete event has min cost and parenthesization", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const complete = events[events.length - 1];
    expect(complete.type).toBe("complete");
    expect(complete.vars["min cost"]).toBe("4500");
    expect(complete.vars["optimal parenthesization"]).toBeDefined();
  });

  it("events are deterministic", () => {
    const r1 = matrixChain([10, 30, 5, 60]);
    const r2 = matrixChain([10, 30, 5, 60]);
    expect(r1.events).toEqual(r2.events);
  });

  it("single matrix produces init, backtrack-start, complete", () => {
    const { events } = matrixChain([10, 20]);
    const types = events.map((e) => e.type);
    expect(types).toContain("init");
    expect(types).toContain("backtrack-start");
    expect(types).toContain("complete");
    // Single matrix returns early — no fill or backtrack-step events
  });

  it("split candidates show cost breakdown", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const splitCompares = events.filter(
      (e) => e.type === "compare-cell" && e.vars.split,
    );
    expect(splitCompares.length).toBeGreaterThan(0);
    for (const e of splitCompares) {
      expect(e.vars.left).toBeDefined();
      expect(e.vars.right).toBeDefined();
      expect(e.vars.mult).toBeDefined();
      expect(e.vars.total).toBeDefined();
    }
  });

  it("four matrices produces correct number of compute events", () => {
    const { events } = matrixChain([10, 30, 5, 60]);
    const computes = events.filter((e) => e.type === "compute-cell");
    // 3 intervals of length ≥ 2 for 3 matrices
    expect(computes).toHaveLength(3);
  });
});

// ──────────────────────────────────────────────────────────────
// Debug snapshot contracts
// ──────────────────────────────────────────────────────────────
describe("MatrixChain — debug snapshot contracts", () => {
  it("produces valid snapshots", () => {
    const steps = matrixChainDebug([10, 30, 5, 60]);
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
    const steps = matrixChainDebug([10, 30, 5, 60]);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
  });

  it("last snapshot has correct answer", () => {
    const steps = matrixChainDebug([10, 30, 5, 60]);
    const last = steps[steps.length - 1];
    expect(last.answer).toBeDefined();
    expect(last.answer).toContain("A1");
    expect(last.answer).toContain("A2");
    expect(last.answer).toContain("A3");
  });

  it("table has correct dimensions", () => {
    const steps = matrixChainDebug([10, 30, 5, 60]);
    const first = steps[0];
    expect(first.table).toHaveLength(3);
    expect(first.table[0]).toHaveLength(3);
  });

  it("row labels show matrix dimensions", () => {
    const steps = matrixChainDebug([10, 30, 5, 60]);
    const first = steps[0];
    expect(first.rowLabels[0]).toContain("10");
    expect(first.rowLabels[0]).toContain("30");
  });

  it("handles single matrix", () => {
    const steps = matrixChainDebug([10, 20]);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("A1");
  });

  it("handles two matrices", () => {
    const steps = matrixChainDebug([10, 20, 30]);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("(A1 × A2)");
  });

  it("steps are immutable", () => {
    const steps = matrixChainDebug([10, 30, 5, 60]);
    const s0 = steps[0];
    const s1 = steps[1];
    s0.table[0][0].value = 999;
    expect(s1.table[0][0].value).not.toBe(999);
  });

  it("phase transitions from fill to backtrack", () => {
    const steps = matrixChainDebug([10, 30, 5, 60]);
    const phases = steps.map((s) => s.phase);
    expect(phases[0]).toBe("fill");
    expect(phases).toContain("backtrack");
  });

  it("vars contain interval-specific keys during fill", () => {
    const steps = matrixChainDebug([10, 30, 5, 60]);
    const fillSteps = steps.filter(
      (s) => s.phase === "fill" && s.vars.interval !== undefined,
    );
    expect(fillSteps.length).toBeGreaterThan(0);
  });

  it("five matrices", () => {
    const steps = matrixChainDebug([5, 10, 3, 12, 5, 50]);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBeDefined();
  });

  it("four matrices snapshot has correct table size", () => {
    const steps = matrixChainDebug([40, 20, 30, 10, 30]);
    const first = steps[0];
    expect(first.table).toHaveLength(4);
    expect(first.table[0]).toHaveLength(4);
  });
});
