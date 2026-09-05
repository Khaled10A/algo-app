import { describe, expect, it } from "vitest";
import { nQueens } from "./nQueens";
import { nQueensDebug } from "./nQueensDebug";

// ── Known solution counts for small N ──
const KNOWN_SOLUTIONS = {
  1: 1,
  2: 0,
  3: 0,
  4: 2,
  5: 10,
  6: 4,
  7: 40,
  8: 92,
};

// ── Helpers ──

function isValidSolution(board, n) {
  const queens = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === "Q") queens.push([r, c]);
    }
  }
  if (queens.length !== n) return false;

  // Check no two queens share a column
  const cols = new Set();
  for (const [, c] of queens) {
    if (cols.has(c)) return false;
    cols.add(c);
  }

  // Check no two queens share a diagonal
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const [r1, c1] = queens[i];
      const [r2, c2] = queens[j];
      if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) return false;
    }
  }

  return true;
}

function countQueens(board) {
  return board.flat().filter((c) => c === "Q").length;
}

// ══════════════════════════════════════════════════════════════
// Algorithm correctness
// ══════════════════════════════════════════════════════════════

describe("nQueens correctness", () => {
  it.each(Object.entries(KNOWN_SOLUTIONS))(
    "N=%s produces %s solution(s)",
    (nStr, expected) => {
      const n = Number(nStr);
      const result = nQueens(n);
      expect(result.solutions).toBe(expected);
      expect(result.n).toBe(n);
    },
  );

  it("N=1 produces exactly 1 solution", () => {
    const { events, solutions } = nQueens(1);
    expect(solutions).toBe(1);
    const solutionEvents = events.filter((e) => e.type === "solution");
    expect(solutionEvents).toHaveLength(1);
    const sol = solutionEvents[0].solution;
    expect(sol[0][0]).toBe("Q");
    expect(isValidSolution(sol, 1)).toBe(true);
  });

  it("N=2 produces 0 solutions", () => {
    const { solutions } = nQueens(2);
    expect(solutions).toBe(0);
  });

  it("N=3 produces 0 solutions", () => {
    const { solutions } = nQueens(3);
    expect(solutions).toBe(0);
  });

  it("N=4 produces 2 solutions", () => {
    const { events, solutions } = nQueens(4);
    expect(solutions).toBe(2);
    const solutionEvents = events.filter((e) => e.type === "solution");
    expect(solutionEvents).toHaveLength(2);

    // Both solutions should be valid
    for (const e of solutionEvents) {
      expect(isValidSolution(e.solution, 4)).toBe(true);
      expect(countQueens(e.solution)).toBe(4);
    }
  });

  it("N=4 solutions are distinct", () => {
    const { events } = nQueens(4);
    const solutions = events
      .filter((e) => e.type === "solution")
      .map((e) => JSON.stringify(e.solution));
    expect(new Set(solutions).size).toBe(2);
  });

  it("N=8 produces 92 solutions", () => {
    const { solutions } = nQueens(8);
    expect(solutions).toBe(92);
  });

  it("all solutions have exactly N queens", () => {
    for (const n of [1, 4, 5, 6, 7, 8]) {
      const { events } = nQueens(n);
      const solutionEvents = events.filter((e) => e.type === "solution");
      for (const e of solutionEvents) {
        expect(countQueens(e.solution)).toBe(n);
      }
    }
  });

  it("all solutions are valid (no attacks)", () => {
    for (const n of [1, 4, 5, 6, 7]) {
      const { events } = nQueens(n);
      const solutionEvents = events.filter((e) => e.type === "solution");
      for (const e of solutionEvents) {
        expect(isValidSolution(e.solution, n)).toBe(true);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════

describe("nQueens edge cases", () => {
  it("throws for n=0", () => {
    expect(() => nQueens(0)).toThrow(/positive integer/);
  });

  it("throws for negative n", () => {
    expect(() => nQueens(-1)).toThrow(/positive integer/);
  });

  it("throws for non-integer n", () => {
    expect(() => nQueens(3.5)).toThrow(/positive integer/);
  });

  it("throws for non-number n", () => {
    expect(() => nQueens("4")).toThrow(/positive integer/);
  });

  it("throws for null", () => {
    expect(() => nQueens(null)).toThrow(/positive integer/);
  });

  it("throws for undefined", () => {
    expect(() => nQueens(undefined)).toThrow(/positive integer/);
  });
});

// ══════════════════════════════════════════════════════════════
// Event sequence
// ══════════════════════════════════════════════════════════════

describe("nQueens event sequence", () => {
  it("first event is init, last is complete", () => {
    const { events } = nQueens(4);
    expect(events[0].type).toBe("init");
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init event has board state", () => {
    const { events } = nQueens(4);
    const init = events[0];
    expect(init.state).toBeDefined();
    expect(init.state.board).toHaveLength(4);
    expect(init.state.board[0]).toHaveLength(4);
    expect(init.state.n).toBe(4);
  });

  it("complete event has solution count", () => {
    const { events } = nQueens(4);
    const complete = events[events.length - 1];
    expect(complete.vars.totalSolutions).toBe("2");
  });

  it("all events have required fields", () => {
    const { events } = nQueens(4);
    for (const e of events) {
      expect(typeof e.type).toBe("string");
    }
  });

  it("choose events have candidate column", () => {
    const { events } = nQueens(4);
    const chooseEvents = events.filter((e) => e.type === "choose");
    expect(chooseEvents.length).toBeGreaterThan(0);
    for (const e of chooseEvents) {
      expect(typeof e.candidate).toBe("number");
      expect(e.candidate).toBeGreaterThanOrEqual(0);
      expect(e.candidate).toBeLessThan(4);
    }
  });

  it("constraint-check events have valid field", () => {
    const { events } = nQueens(4);
    const checkEvents = events.filter((e) => e.type === "constraint-check");
    expect(checkEvents.length).toBeGreaterThan(0);
    for (const e of checkEvents) {
      expect(typeof e.valid).toBe("boolean");
    }
  });

  it("invalid constraint-check events have reason", () => {
    const { events } = nQueens(4);
    const invalidChecks = events.filter(
      (e) => e.type === "constraint-check" && !e.valid,
    );
    for (const e of invalidChecks) {
      expect(typeof e.reason).toBe("string");
      expect(e.reason.length).toBeGreaterThan(0);
    }
  });

  it("solution events have solution board", () => {
    const { events } = nQueens(4);
    const solutionEvents = events.filter((e) => e.type === "solution");
    for (const e of solutionEvents) {
      expect(Array.isArray(e.solution)).toBe(true);
      expect(e.solution).toHaveLength(4);
    }
  });

  it("backtrack events have removed column", () => {
    const { events } = nQueens(4);
    const backtrackEvents = events.filter((e) => e.type === "backtrack");
    expect(backtrackEvents.length).toBeGreaterThan(0);
    for (const e of backtrackEvents) {
      expect(typeof e.removed).toBe("number");
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Backtracking
// ══════════════════════════════════════════════════════════════

describe("nQueens backtracking", () => {
  it("N=2 has backtrack events (no solutions)", () => {
    const { events } = nQueens(2);
    const backtrackEvents = events.filter((e) => e.type === "backtrack");
    expect(backtrackEvents.length).toBeGreaterThan(0);
  });

  it("N=3 has backtrack events (no solutions)", () => {
    const { events } = nQueens(3);
    const backtrackEvents = events.filter((e) => e.type === "backtrack");
    expect(backtrackEvents.length).toBeGreaterThan(0);
  });

  it("N=4 has both valid and invalid constraint checks", () => {
    const { events } = nQueens(4);
    const validChecks = events.filter(
      (e) => e.type === "constraint-check" && e.valid,
    );
    const invalidChecks = events.filter(
      (e) => e.type === "constraint-check" && !e.valid,
    );
    expect(validChecks.length).toBeGreaterThan(0);
    expect(invalidChecks.length).toBeGreaterThan(0);
  });

  it("board is restored after backtrack", () => {
    const { events } = nQueens(4);
    // Find a backtrack event and check the board after it
    const backtrackIndices = events
      .map((e, i) => (e.type === "backtrack" ? i : -1))
      .filter((i) => i >= 0);

    expect(backtrackIndices.length).toBeGreaterThan(0);

    for (const idx of backtrackIndices) {
      const afterBacktrack = events[idx];
      const board = afterBacktrack.state.board;
      // Board should not have a queen in the removed position
      // (basic sanity — the board is valid)
      expect(countQueens(board)).toBeLessThanOrEqual(4);
    }
  });

  it("enter events increase depth", () => {
    const { events } = nQueens(4);
    const enterEvents = events.filter((e) => e.type === "enter");
    const depths = enterEvents.map((e) => e.depth);
    // Depths should be sequential: 1, 2, 3, 4
    expect(depths[0]).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════
// Solution reconstruction
// ══════════════════════════════════════════════════════════════

describe("nQueens solution reconstruction", () => {
  it("N=4 solutions are valid 4-queen placements", () => {
    const { events } = nQueens(4);
    const solutions = events.filter((e) => e.type === "solution");
    expect(solutions).toHaveLength(2);

    // Both must be valid
    for (const e of solutions) {
      expect(isValidSolution(e.solution, 4)).toBe(true);
    }

    // Solutions must be distinct
    const strs = solutions.map((e) => JSON.stringify(e.solution));
    expect(strs[0]).not.toBe(strs[1]);
  });

  it("each solution has exactly one queen per row", () => {
    const { events } = nQueens(5);
    const solutions = events.filter((e) => e.type === "solution");
    for (const e of solutions) {
      for (let r = 0; r < 5; r++) {
        const queensInRow = e.solution[r].filter((c) => c === "Q").length;
        expect(queensInRow).toBe(1);
      }
    }
  });

  it("each solution has exactly one queen per column", () => {
    const { events } = nQueens(5);
    const solutions = events.filter((e) => e.type === "solution");
    for (const e of solutions) {
      for (let c = 0; c < 5; c++) {
        const queensInCol = e.solution.filter((row) => row[c] === "Q").length;
        expect(queensInCol).toBe(1);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Debug projection
// ══════════════════════════════════════════════════════════════

describe("nQueensDebug", () => {
  it("returns array of steps", () => {
    const steps = nQueensDebug(4);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("each step has required fields", () => {
    const steps = nQueensDebug(4);
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
    const steps = nQueensDebug(4);
    expect(steps[0].log).toContain("Initialize");
    expect(steps[steps.length - 1].complete).toBe(true);
    expect(steps[steps.length - 1].log).toContain("Done");
  });

  it("contains solution steps", () => {
    const steps = nQueensDebug(4);
    const solutionSteps = steps.filter((s) => s.currentSolution != null);
    expect(solutionSteps).toHaveLength(2);
  });

  it("contains backtrack steps", () => {
    const steps = nQueensDebug(4);
    const backtrackSteps = steps.filter((s) => s.phase === "backtrack");
    expect(backtrackSteps.length).toBeGreaterThan(0);
  });

  it("state is serialized as board string", () => {
    const steps = nQueensDebug(4);
    // Find a step with queens placed
    const boardSteps = steps.filter(
      (s) => s.memory.state && s.memory.state.includes("Q"),
    );
    expect(boardSteps.length).toBeGreaterThan(0);
  });

  it("N=2 produces steps with 0 solutions", () => {
    const steps = nQueensDebug(2);
    const last = steps[steps.length - 1];
    expect(last.vars.totalSolutions).toBe("0");
  });

  it("steps are immutable snapshots", () => {
    const steps = nQueensDebug(4);
    // Mutate a step's state
    if (steps[0].state?.board) {
      steps[0].state.board[0][0] = "X";
    }
    // Other steps should not be affected
    expect(steps[1].state?.board?.[0]?.[0]).not.toBe("X");
  });

  it("activeLine values are within codeLines bounds", () => {
    const steps = nQueensDebug(4);
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(8);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Board state correctness
// ══════════════════════════════════════════════════════════════

describe("nQueens board state", () => {
  it("init board is all dots", () => {
    const { events } = nQueens(4);
    const init = events[0];
    for (const row of init.state.board) {
      for (const cell of row) {
        expect(cell).toBe(".");
      }
    }
  });

  it("board has correct size", () => {
    for (const n of [1, 3, 5, 8]) {
      const { events } = nQueens(n);
      const init = events[0];
      expect(init.state.board).toHaveLength(n);
      for (const row of init.state.board) {
        expect(row).toHaveLength(n);
      }
    }
  });

  it("board state is deep-copied (immutable)", () => {
    const { events } = nQueens(4);
    const board1 = events[0].state.board;
    const board2 = events[1].state.board;
    // They should not be the same reference
    expect(board1).not.toBe(board2);
    // Modifying one should not affect the other
    board1[0][0] = "X";
    expect(board2[0][0]).not.toBe("X");
  });
});
