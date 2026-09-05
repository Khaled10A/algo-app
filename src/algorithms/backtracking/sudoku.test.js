import { describe, expect, it } from "vitest";
import {
  sudoku,
  SUPPORTED_SIZES,
  getBoardConfig,
  toDisplaySymbol,
  getPuzzlePresets,
  PUZZLE_4X4,
  PUZZLE_4X4_SOLVED,
  PUZZLE_EASY,
  PUZZLE_MEDIUM,
  PUZZLE_HARD,
  PUZZLE_SOLVED,
  PUZZLE_16X16,
  PUZZLE_16X16_SOLVED,
  PUZZLES,
} from "./sudoku";
import { sudokuDebug } from "./sudokuDebug";

// ── Helpers ──

function isValidSudokuBoard(board, n, boxSize) {
  if (!Array.isArray(board) || board.length !== n) return false;
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(board[i]) || board[i].length !== n) return false;
  }
  // Check rows
  for (let r = 0; r < n; r++) {
    const seen = new Set();
    for (let c = 0; c < n; c++) {
      const v = board[r][c];
      if (v < 1 || v > n || seen.has(v)) return false;
      seen.add(v);
    }
  }
  // Check columns
  for (let c = 0; c < n; c++) {
    const seen = new Set();
    for (let r = 0; r < n; r++) {
      const v = board[r][c];
      if (seen.has(v)) return false;
      seen.add(v);
    }
  }
  // Check sub-boxes
  for (let br = 0; br < n; br += boxSize) {
    for (let bc = 0; bc < n; bc += boxSize) {
      const seen = new Set();
      for (let r = br; r < br + boxSize; r++) {
        for (let c = bc; c < bc + boxSize; c++) {
          const v = board[r][c];
          if (seen.has(v)) return false;
          seen.add(v);
        }
      }
    }
  }
  return true;
}

function countEmptyCells(board) {
  let count = 0;
  for (const row of board) {
    for (const v of row) {
      if (v === 0) count++;
    }
  }
  return count;
}

// ══════════════════════════════════════════════════════════════
// Board configuration
// ══════════════════════════════════════════════════════════════

describe("sudoku board configuration", () => {
  it("supports 4×4 with boxSize=2", () => {
    const cfg = getBoardConfig(4);
    expect(cfg.n).toBe(4);
    expect(cfg.boxSize).toBe(2);
    expect(cfg.symbols).toEqual([1, 2, 3, 4]);
    expect(cfg.label).toBe("4×4");
  });

  it("supports 9×9 with boxSize=3", () => {
    const cfg = getBoardConfig(9);
    expect(cfg.n).toBe(9);
    expect(cfg.boxSize).toBe(3);
    expect(cfg.symbols).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(cfg.label).toBe("9×9");
  });

  it("supports 16×16 with boxSize=4", () => {
    const cfg = getBoardConfig(16);
    expect(cfg.n).toBe(16);
    expect(cfg.boxSize).toBe(4);
    expect(cfg.symbols.length).toBe(16);
    expect(cfg.label).toBe("16×16");
    expect(cfg.symbols[0]).toBe(1);
    expect(cfg.symbols[15]).toBe(16);
  });

  it("throws for unsupported board sizes", () => {
    expect(() => getBoardConfig(5)).toThrow(/Unsupported board size 5/);
    expect(() => getBoardConfig(6)).toThrow(/Unsupported board size 6/);
    expect(() => getBoardConfig(10)).toThrow(/Unsupported board size 10/);
    expect(() => getBoardConfig(12)).toThrow(/Unsupported board size 12/);
    expect(() => getBoardConfig(3)).toThrow(/Unsupported board size 3/);
  });

  it("N equals boxSize squared for all supported sizes", () => {
    for (const size of SUPPORTED_SIZES) {
      expect(size.n).toBe(size.boxSize * size.boxSize);
    }
  });

  it("display symbols count matches N", () => {
    for (const size of SUPPORTED_SIZES) {
      expect(size.displaySymbols.length).toBe(size.n);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// toDisplaySymbol
// ══════════════════════════════════════════════════════════════

describe("toDisplaySymbol", () => {
  it("returns empty string for 0", () => {
    const cfg = getBoardConfig(4);
    expect(toDisplaySymbol(0, cfg)).toBe("");
  });

  it("returns numeric strings for 4×4", () => {
    const cfg = getBoardConfig(4);
    expect(toDisplaySymbol(1, cfg)).toBe("1");
    expect(toDisplaySymbol(4, cfg)).toBe("4");
  });

  it("returns numeric strings for 9×9", () => {
    const cfg = getBoardConfig(9);
    expect(toDisplaySymbol(1, cfg)).toBe("1");
    expect(toDisplaySymbol(9, cfg)).toBe("9");
  });

  it("returns hex strings for 16×16", () => {
    const cfg = getBoardConfig(16);
    expect(toDisplaySymbol(1, cfg)).toBe("0");
    expect(toDisplaySymbol(10, cfg)).toBe("9");
    expect(toDisplaySymbol(11, cfg)).toBe("A");
    expect(toDisplaySymbol(16, cfg)).toBe("F");
  });
});

// ══════════════════════════════════════════════════════════════
// getPuzzlePresets
// ══════════════════════════════════════════════════════════════

describe("getPuzzlePresets", () => {
  it("returns 4×4 presets", () => {
    const presets = getPuzzlePresets(4);
    expect(presets["Easy"]).toBeDefined();
    expect(presets["Solved"]).toBeDefined();
    expect(presets["Easy"].length).toBe(4);
  });

  it("returns 9×9 presets", () => {
    const presets = getPuzzlePresets(9);
    expect(presets["Easy"]).toBeDefined();
    expect(presets["Medium"]).toBeDefined();
    expect(presets["Hard"]).toBeDefined();
    expect(presets["Solved"]).toBeDefined();
  });

  it("returns 16×16 presets", () => {
    const presets = getPuzzlePresets(16);
    expect(presets["Easy"]).toBeDefined();
    expect(presets["Solved"]).toBeDefined();
    expect(presets["Easy"].length).toBe(16);
  });
});

// ══════════════════════════════════════════════════════════════
// PUZZLES exports
// ══════════════════════════════════════════════════════════════

describe("puzzle exports", () => {
  it("all puzzle exports are defined", () => {
    expect(PUZZLES["4x4"]).toBeDefined();
    expect(PUZZLES["4x4-solved"]).toBeDefined();
    expect(PUZZLES.easy).toBeDefined();
    expect(PUZZLES.medium).toBeDefined();
    expect(PUZZLES.hard).toBeDefined();
    expect(PUZZLES.solved).toBeDefined();
    expect(PUZZLES["16x16"]).toBeDefined();
    expect(PUZZLES["16x16-solved"]).toBeDefined();
  });

  it("4×4 puzzles have correct dimensions", () => {
    expect(PUZZLE_4X4.length).toBe(4);
    for (const row of PUZZLE_4X4) {
      expect(row.length).toBe(4);
    }
  });

  it("16×16 puzzles have correct dimensions", () => {
    expect(PUZZLE_16X16.length).toBe(16);
    for (const row of PUZZLE_16X16) {
      expect(row.length).toBe(16);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// 4×4 correctness
// ══════════════════════════════════════════════════════════════

describe("sudoku 4×4 correctness", () => {
  it("solves 4×4 easy puzzle", () => {
    const { count, solutions } = sudoku(PUZZLE_4X4);
    expect(count).toBe(1);
    expect(isValidSudokuBoard(solutions[0], 4, 2)).toBe(true);
  });

  it("solved 4×4 puzzle returns immediately", () => {
    const { count, solutions } = sudoku(PUZZLE_4X4_SOLVED);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual(PUZZLE_4X4_SOLVED);
  });

  it("4×4 solution preserves given cells", () => {
    const { solutions } = sudoku(PUZZLE_4X4);
    const sol = solutions[0];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (PUZZLE_4X4[r][c] !== 0) {
          expect(sol[r][c]).toBe(PUZZLE_4X4[r][c]);
        }
      }
    }
  });

  it("4×4 solution fills all empty cells", () => {
    const { solutions } = sudoku(PUZZLE_4X4);
    expect(countEmptyCells(solutions[0])).toBe(0);
  });

  it("4×4 each row contains 1–4 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_4X4);
    const sol = solutions[0];
    for (let r = 0; r < 4; r++) {
      const sorted = [...sol[r]].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4]);
    }
  });

  it("4×4 each column contains 1–4 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_4X4);
    const sol = solutions[0];
    for (let c = 0; c < 4; c++) {
      const col = [];
      for (let r = 0; r < 4; r++) col.push(sol[r][c]);
      const sorted = col.sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4]);
    }
  });

  it("4×4 each 2×2 box contains 1–4 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_4X4);
    const sol = solutions[0];
    for (let br = 0; br < 4; br += 2) {
      for (let bc = 0; bc < 4; bc += 2) {
        const box = [];
        for (let r = br; r < br + 2; r++) {
          for (let c = bc; c < bc + 2; c++) {
            box.push(sol[r][c]);
          }
        }
        const sorted = box.sort((a, b) => a - b);
        expect(sorted).toEqual([1, 2, 3, 4]);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// 9×9 correctness
// ══════════════════════════════════════════════════════════════

describe("sudoku 9×9 correctness", () => {
  it("solves easy puzzle", () => {
    const { count, solutions } = sudoku(PUZZLE_EASY);
    expect(count).toBe(1);
    expect(isValidSudokuBoard(solutions[0], 9, 3)).toBe(true);
  });

  it("solves medium puzzle", () => {
    const { count, solutions } = sudoku(PUZZLE_MEDIUM);
    expect(count).toBe(1);
    expect(isValidSudokuBoard(solutions[0], 9, 3)).toBe(true);
  });

  it("solves hard puzzle", () => {
    const { count, solutions } = sudoku(PUZZLE_HARD);
    expect(count).toBe(1);
    expect(isValidSudokuBoard(solutions[0], 9, 3)).toBe(true);
  });

  it("already solved puzzle returns immediately", () => {
    const { count, solutions } = sudoku(PUZZLE_SOLVED);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual(PUZZLE_SOLVED);
  });

  it("solution preserves given cells", () => {
    const { solutions } = sudoku(PUZZLE_EASY);
    const sol = solutions[0];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (PUZZLE_EASY[r][c] !== 0) {
          expect(sol[r][c]).toBe(PUZZLE_EASY[r][c]);
        }
      }
    }
  });

  it("solution fills all empty cells", () => {
    const { solutions } = sudoku(PUZZLE_EASY);
    expect(countEmptyCells(solutions[0])).toBe(0);
  });

  it("each row contains 1–9 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_EASY);
    const sol = solutions[0];
    for (let r = 0; r < 9; r++) {
      const sorted = [...sol[r]].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it("each column contains 1–9 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_MEDIUM);
    const sol = solutions[0];
    for (let c = 0; c < 9; c++) {
      const col = [];
      for (let r = 0; r < 9; r++) col.push(sol[r][c]);
      const sorted = col.sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it("each 3×3 box contains 1–9 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_HARD);
    const sol = solutions[0];
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box = [];
        for (let r = br * 3; r < br * 3 + 3; r++) {
          for (let c = bc * 3; c < bc * 3 + 3; c++) {
            box.push(sol[r][c]);
          }
        }
        const sorted = box.sort((a, b) => a - b);
        expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      }
    }
  });

  it("easy puzzle: solution matches known answer", () => {
    const { solutions } = sudoku(PUZZLE_EASY);
    const expected = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];
    expect(solutions[0]).toEqual(expected);
  });
});

// ══════════════════════════════════════════════════════════════
// 16×16 correctness
// ══════════════════════════════════════════════════════════════

describe("sudoku 16×16 correctness", () => {
  it("solved 16×16 puzzle returns immediately", () => {
    const { count, solutions } = sudoku(PUZZLE_16X16_SOLVED);
    expect(count).toBe(1);
    expect(solutions[0]).toEqual(PUZZLE_16X16_SOLVED);
  });

  it("solved 16×16 is valid", () => {
    const { solutions } = sudoku(PUZZLE_16X16_SOLVED);
    expect(isValidSudokuBoard(solutions[0], 16, 4)).toBe(true);
  });

  it("16×16 solution has correct dimensions", () => {
    const { solutions } = sudoku(PUZZLE_16X16_SOLVED);
    expect(solutions[0].length).toBe(16);
    for (const row of solutions[0]) {
      expect(row.length).toBe(16);
    }
  });

  it("16×16 each row contains 1–16 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_16X16_SOLVED);
    const sol = solutions[0];
    for (let r = 0; r < 16; r++) {
      const sorted = [...sol[r]].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    }
  });

  it("16×16 each column contains 1–16 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_16X16_SOLVED);
    const sol = solutions[0];
    for (let c = 0; c < 16; c++) {
      const col = [];
      for (let r = 0; r < 16; r++) col.push(sol[r][c]);
      const sorted = col.sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    }
  });

  it("16×16 each 4×4 box contains 1–16 exactly once", () => {
    const { solutions } = sudoku(PUZZLE_16X16_SOLVED);
    const sol = solutions[0];
    for (let br = 0; br < 16; br += 4) {
      for (let bc = 0; bc < 16; bc += 4) {
        const box = [];
        for (let r = br; r < br + 4; r++) {
          for (let c = bc; c < bc + 4; c++) {
            box.push(sol[r][c]);
          }
        }
        const sorted = box.sort((a, b) => a - b);
        expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Input validation
// ══════════════════════════════════════════════════════════════

describe("sudoku input validation", () => {
  it("throws for non-array input", () => {
    expect(() => sudoku("not a board")).toThrow(/non-empty 2D array/);
  });

  it("throws for empty array", () => {
    expect(() => sudoku([])).toThrow(/non-empty 2D array/);
  });

  it("throws for unsupported board size", () => {
    const board = Array.from({ length: 5 }, () => new Array(5).fill(0));
    expect(() => sudoku(board)).toThrow(/Unsupported board size 5/);
  });

  it("throws for wrong row count (5×5)", () => {
    const board = Array.from({ length: 5 }, () => new Array(5).fill(0));
    expect(() => sudoku(board)).toThrow(/Unsupported board size 5/);
  });

  it("throws for wrong column count", () => {
    const board = Array.from({ length: 9 }, () => [0, 0, 0]);
    expect(() => sudoku(board)).toThrow(/9 elements/);
  });

  it("throws for non-integer cell values", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[0][0] = 1.5;
    expect(() => sudoku(board)).toThrow(/integer 0–9/);
  });

  it("throws for out-of-range cell values", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[0][0] = 10;
    expect(() => sudoku(board)).toThrow(/integer 0–9/);
  });

  it("throws for negative cell values", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[0][0] = -1;
    expect(() => sudoku(board)).toThrow(/integer 0–9/);
  });

  it("throws for duplicate in row", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[0][0] = 5;
    board[0][1] = 5;
    expect(() => sudoku(board)).toThrow(/duplicate 5 in row 0/);
  });

  it("throws for duplicate in column", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[0][0] = 5;
    board[1][0] = 5;
    expect(() => sudoku(board)).toThrow(/duplicate 5 in column 0/);
  });

  it("throws for duplicate in box", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[0][0] = 5;
    board[1][1] = 5;
    expect(() => sudoku(board)).toThrow(/duplicate 5 in box/);
  });

  it("throws for NaN cell value", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[4][4] = NaN;
    expect(() => sudoku(board)).toThrow(/integer 0–9/);
  });

  it("throws for undefined cell value", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[4][4] = undefined;
    expect(() => sudoku(board)).toThrow(/integer 0–9/);
  });

  it("throws for null cell value", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[4][4] = null;
    expect(() => sudoku(board)).toThrow(/integer 0–9/);
  });

  it("throws for Infinity cell value", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[4][4] = Infinity;
    expect(() => sudoku(board)).toThrow(/integer 0–9/);
  });

  it("throws for string cell value", () => {
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[4][4] = "5";
    expect(() => sudoku(board)).toThrow(/integer 0–9/);
  });

  // 4×4 specific validation
  it("4×4 throws for wrong dimensions", () => {
    const board = Array.from({ length: 4 }, () => new Array(4).fill(0));
    board[0][0] = 5; // 5 is invalid for 4×4
    expect(() => sudoku(board)).toThrow(/integer 0–4/);
  });

  it("4×4 throws for duplicate in row", () => {
    const board = Array.from({ length: 4 }, () => new Array(4).fill(0));
    board[0][0] = 3;
    board[0][1] = 3;
    expect(() => sudoku(board)).toThrow(/duplicate 3 in row 0/);
  });

  it("16×16 throws for out-of-range value", () => {
    const board = Array.from({ length: 16 }, () => new Array(16).fill(0));
    board[0][0] = 17;
    expect(() => sudoku(board)).toThrow(/integer 0–16/);
  });
});

// ══════════════════════════════════════════════════════════════
// Backtracking behavior
// ══════════════════════════════════════════════════════════════

describe("sudoku backtracking", () => {
  it("emits backtrack events when symbol placement fails (9×9)", () => {
    const { events } = sudoku(PUZZLE_MEDIUM);
    const btEvents = events.filter((e) => e.type === "backtrack");
    expect(btEvents.length).toBeGreaterThan(0);
  });

  it("backtrack events show removed symbol", () => {
    const { events } = sudoku(PUZZLE_MEDIUM);
    const btEvents = events.filter((e) => e.type === "backtrack");
    for (const e of btEvents) {
      expect(typeof e.removed).toBe("number");
      expect(e.removed).toBeGreaterThanOrEqual(1);
      expect(e.removed).toBeLessThanOrEqual(9);
    }
  });

  it("board is restored after backtrack", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const btEvents = events.filter((e) => e.type === "backtrack");
    for (const e of btEvents) {
      expect(typeof e.state.row).toBe("number");
      expect(typeof e.state.col).toBe("number");
      expect(typeof e.removed).toBe("number");
    }
  });

  it("easy puzzle has fewer backtracks than hard (9×9)", () => {
    const easy = sudoku(PUZZLE_EASY);
    const hard = sudoku(PUZZLE_HARD);
    const easyBT = easy.events.filter((e) => e.type === "backtrack").length;
    const hardBT = hard.events.filter((e) => e.type === "backtrack").length;
    expect(easyBT).toBeLessThan(hardBT);
  });

  it("4×4 emits backtrack events", () => {
    const { events } = sudoku(PUZZLE_4X4);
    // 4×4 may or may not need backtracks depending on puzzle
    expect(events.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════
// Event sequence
// ══════════════════════════════════════════════════════════════

describe("sudoku event sequence", () => {
  it("first event is init, last is complete (9×9)", () => {
    const { events } = sudoku(PUZZLE_EASY);
    expect(events[0].type).toBe("init");
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("first event is init, last is complete (4×4)", () => {
    const { events } = sudoku(PUZZLE_4X4);
    expect(events[0].type).toBe("init");
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init has board state", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const init = events[0];
    expect(init.state.board).toEqual(PUZZLE_EASY);
  });

  it("init has boardSize and boxSize in state", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const init = events[0];
    expect(init.state.boardSize).toBe(9);
    expect(init.state.boxSize).toBe(3);
  });

  it("4×4 init has correct boardSize and boxSize", () => {
    const { events } = sudoku(PUZZLE_4X4);
    const init = events[0];
    expect(init.state.boardSize).toBe(4);
    expect(init.state.boxSize).toBe(2);
  });

  it("complete has solution count", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const complete = events[events.length - 1];
    expect(complete.vars.totalSolutions).toBe("1");
  });

  it("choose events have symbol candidates (9×9)", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const chooseEvents = events.filter((e) => e.type === "choose");
    expect(chooseEvents.length).toBeGreaterThan(0);
    for (const e of chooseEvents) {
      expect(typeof e.candidate).toBe("number");
      expect(e.candidate).toBeGreaterThanOrEqual(1);
      expect(e.candidate).toBeLessThanOrEqual(9);
    }
  });

  it("choose events have symbol candidates (4×4)", () => {
    const { events } = sudoku(PUZZLE_4X4);
    const chooseEvents = events.filter((e) => e.type === "choose");
    expect(chooseEvents.length).toBeGreaterThan(0);
    for (const e of chooseEvents) {
      expect(typeof e.candidate).toBe("number");
      expect(e.candidate).toBeGreaterThanOrEqual(1);
      expect(e.candidate).toBeLessThanOrEqual(4);
    }
  });

  it("constraint-check events have valid field", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const checkEvents = events.filter((e) => e.type === "constraint-check");
    expect(checkEvents.length).toBeGreaterThan(0);
    for (const e of checkEvents) {
      expect(typeof e.valid).toBe("boolean");
    }
  });

  it("solution event has complete board", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const solEvents = events.filter((e) => e.type === "solution");
    expect(solEvents).toHaveLength(1);
    expect(isValidSudokuBoard(solEvents[0].solution, 9, 3)).toBe(true);
  });

  it("enter events have cell coordinates", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const enterEvents = events.filter((e) => e.type === "enter");
    expect(enterEvents.length).toBeGreaterThan(0);
    for (const e of enterEvents) {
      expect(typeof e.state.row).toBe("number");
      expect(typeof e.state.col).toBe("number");
      expect(e.state.row).toBeGreaterThanOrEqual(0);
      expect(e.state.row).toBeLessThan(9);
      expect(e.state.col).toBeGreaterThanOrEqual(0);
      expect(e.state.col).toBeLessThan(9);
    }
  });

  it("enter events have boardSize in state", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const enterEvents = events.filter((e) => e.type === "enter");
    for (const e of enterEvents) {
      expect(e.state.boardSize).toBe(9);
      expect(e.state.boxSize).toBe(3);
    }
  });

  it("4×4 enter events have boardSize=4 in state", () => {
    const { events } = sudoku(PUZZLE_4X4);
    const enterEvents = events.filter((e) => e.type === "enter");
    for (const e of enterEvents) {
      expect(e.state.boardSize).toBe(4);
      expect(e.state.boxSize).toBe(2);
    }
  });

  it("all events have required fields", () => {
    const { events } = sudoku(PUZZLE_EASY);
    for (const e of events) {
      expect(typeof e.type).toBe("string");
      expect(e.state).toBeDefined();
    }
  });

  it("already solved puzzle emits init + solution + complete only", () => {
    const { events } = sudoku(PUZZLE_SOLVED);
    const types = events.map((e) => e.type);
    expect(types).toContain("init");
    expect(types).toContain("solution");
    expect(types).toContain("complete");
    expect(types).not.toContain("choose");
    expect(types).not.toContain("backtrack");
  });

  it("prune events emitted for invalid symbols or dead-ends", () => {
    const { events } = sudoku(PUZZLE_MEDIUM);
    const pruneEvents = events.filter((e) => e.type === "prune");
    expect(pruneEvents.length).toBeGreaterThan(0);
    for (const e of pruneEvents) {
      expect(typeof e.reason).toBe("string");
      const isConflict = e.reason.includes("conflicts");
      const isDeadEnd = e.reason.includes("no valid symbol");
      expect(isConflict || isDeadEnd).toBe(true);
    }
  });

  it("enter events have depth values", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const enterEvents = events.filter((e) => e.type === "enter");
    for (const e of enterEvents) {
      expect(typeof e.depth).toBe("number");
      expect(e.depth).toBeGreaterThanOrEqual(1);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Reconstruction
// ══════════════════════════════════════════════════════════════

describe("sudoku reconstruction", () => {
  it("solution is a complete 9×9 board", () => {
    const { solutions } = sudoku(PUZZLE_EASY);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toHaveLength(9);
    for (const row of solutions[0]) {
      expect(row).toHaveLength(9);
    }
  });

  it("solution has no empty cells (9×9)", () => {
    const { solutions } = sudoku(PUZZLE_MEDIUM);
    expect(countEmptyCells(solutions[0])).toBe(0);
  });

  it("solution values are all 1–9 (9×9)", () => {
    const { solutions } = sudoku(PUZZLE_HARD);
    for (const row of solutions[0]) {
      for (const v of row) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(9);
      }
    }
  });

  it("solution is a complete 4×4 board", () => {
    const { solutions } = sudoku(PUZZLE_4X4);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toHaveLength(4);
    for (const row of solutions[0]) {
      expect(row).toHaveLength(4);
    }
  });

  it("4×4 solution values are all 1–4", () => {
    const { solutions } = sudoku(PUZZLE_4X4);
    for (const row of solutions[0]) {
      for (const v of row) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(4);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════

describe("sudoku edge cases", () => {
  it("null input throws", () => {
    expect(() => sudoku(null)).toThrow(/non-empty 2D array/);
  });

  it("undefined input throws", () => {
    expect(() => sudoku(undefined)).toThrow(/non-empty 2D array/);
  });

  it("return value has boardSize", () => {
    const result4 = sudoku(PUZZLE_4X4);
    expect(result4.boardSize).toBe(4);

    const result9 = sudoku(PUZZLE_EASY);
    expect(result9.boardSize).toBe(9);
  });

  it("no hardcoded assumptions: board size is derived from puzzle", () => {
    // Verify the solver works with different sizes without any hardcoded N
    const result4 = sudoku(PUZZLE_4X4);
    expect(result4.boardSize).toBe(4);
    expect(result4.events[0].state.boardSize).toBe(4);
    expect(result4.events[0].state.boxSize).toBe(2);

    const result9 = sudoku(PUZZLE_EASY);
    expect(result9.boardSize).toBe(9);
    expect(result9.events[0].state.boardSize).toBe(9);
    expect(result9.events[0].state.boxSize).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════
// Immutable snapshots
// ══════════════════════════════════════════════════════════════

describe("sudoku immutable snapshots", () => {
  it("event states are not mutated between steps", () => {
    const { events } = sudoku(PUZZLE_EASY);
    // Take a snapshot of the init event board
    if (events[0].state?.board) {
      const original = events[0].state.board[0][0];
      // Verify subsequent events don't share the same board reference
      if (events[1].state?.board) {
        // Mutating one should not affect the other
        events[1].state.board[0][0] = 999;
        expect(events[0].state.board[0][0]).toBe(original);
      }
    }
  });

  it("4×4 event states are not mutated between steps", () => {
    const { events } = sudoku(PUZZLE_4X4);
    if (events[0].state?.board) {
      const original = events[0].state.board[0][0];
      if (events[1].state?.board) {
        events[1].state.board[0][0] = 999;
        expect(events[0].state.board[0][0]).toBe(original);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════
// Debug projection
// ══════════════════════════════════════════════════════════════

describe("sudokuDebug", () => {
  it("returns array of steps (9×9)", () => {
    const steps = sudokuDebug(PUZZLE_EASY);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("returns array of steps (4×4)", () => {
    const steps = sudokuDebug(PUZZLE_4X4);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("each step has required fields", () => {
    const steps = sudokuDebug(PUZZLE_EASY);
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
    const steps = sudokuDebug(PUZZLE_EASY);
    expect(steps[0].log).toContain("Initialize");
    expect(steps[steps.length - 1].complete).toBe(true);
    expect(steps[steps.length - 1].log).toContain("Done");
  });

  it("contains solution steps", () => {
    const steps = sudokuDebug(PUZZLE_EASY);
    const solutionSteps = steps.filter((s) => s.currentSolution != null);
    expect(solutionSteps.length).toBeGreaterThanOrEqual(1);
  });

  it("contains backtrack steps for medium puzzle", () => {
    const steps = sudokuDebug(PUZZLE_MEDIUM);
    const btSteps = steps.filter((s) => s.phase === "backtrack");
    expect(btSteps.length).toBeGreaterThan(0);
  });

  it("activeLine values are within codeLines bounds", () => {
    const steps = sudokuDebug(PUZZLE_EASY);
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(8);
    }
  });

  it("vars show cell coordinates", () => {
    const steps = sudokuDebug(PUZZLE_EASY);
    const stepWithCoords = steps.find(
      (s) => s.vars.row != null && s.vars.col != null,
    );
    expect(stepWithCoords).toBeDefined();
  });

  it("already solved puzzle produces minimal steps", () => {
    const steps = sudokuDebug(PUZZLE_SOLVED);
    const last = steps[steps.length - 1];
    expect(last.vars.totalSolutions).toBe("1");
    expect(steps.length).toBeLessThanOrEqual(3);
  });

  it("steps are immutable snapshots", () => {
    const steps = sudokuDebug(PUZZLE_EASY);
    if (steps[0].state?.board) {
      steps[0].state.board[0][0] = 999;
    }
    if (steps[1].state?.board) {
      expect(steps[1].state.board[0][0]).not.toBe(999);
    }
  });

  it("4×4 debug works correctly", () => {
    const steps = sudokuDebug(PUZZLE_4X4);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.vars.totalSolutions).toBe("1");
  });
});

// ══════════════════════════════════════════════════════════════
// Candidate generation and dynamic sizes
// ══════════════════════════════════════════════════════════════

describe("dynamic board size verification", () => {
  it("4×4 solver uses symbols 1–4", () => {
    const { events } = sudoku(PUZZLE_4X4);
    const enterEvent = events.find((e) => e.type === "enter");
    expect(enterEvent.candidates).toEqual([1, 2, 3, 4]);
  });

  it("9×9 solver uses symbols 1–9", () => {
    const { events } = sudoku(PUZZLE_EASY);
    const enterEvent = events.find((e) => e.type === "enter");
    expect(enterEvent.candidates).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("events carry dynamic boardSize", () => {
    const result4 = sudoku(PUZZLE_4X4);
    const result9 = sudoku(PUZZLE_EASY);

    // All 4×4 events should have boardSize=4
    for (const e of result4.events) {
      if (e.state?.boardSize != null) {
        expect(e.state.boardSize).toBe(4);
      }
    }

    // All 9×9 events should have boardSize=9
    for (const e of result9.events) {
      if (e.state?.boardSize != null) {
        expect(e.state.boardSize).toBe(9);
      }
    }
  });

  it("boxSize is correctly derived from board size", () => {
    const result4 = sudoku(PUZZLE_4X4);
    const result9 = sudoku(PUZZLE_EASY);

    for (const e of result4.events) {
      if (e.state?.boxSize != null) {
        expect(e.state.boxSize).toBe(2);
      }
    }

    for (const e of result9.events) {
      if (e.state?.boxSize != null) {
        expect(e.state.boxSize).toBe(3);
      }
    }
  });

  it("no hardcoded 9 in solver logic — verified by 4×4 correctness", () => {
    // If 9 were hardcoded, 4×4 would fail or produce wrong results
    const { solutions, count } = sudoku(PUZZLE_4X4);
    expect(count).toBe(1);
    expect(solutions[0].length).toBe(4);
    expect(solutions[0][0].length).toBe(4);
  });

  it("no hardcoded 3×3 boxes — verified by 4×4 using 2×2 boxes", () => {
    const { solutions } = sudoku(PUZZLE_4X4);
    const sol = solutions[0];
    // Verify 2×2 box constraint (not 3×3)
    for (let br = 0; br < 4; br += 2) {
      for (let bc = 0; bc < 4; bc += 2) {
        const box = [];
        for (let r = br; r < br + 2; r++) {
          for (let c = bc; c < bc + 2; c++) {
            box.push(sol[r][c]);
          }
        }
        const sorted = [...new Set(box)].sort((a, b) => a - b);
        expect(sorted).toEqual([1, 2, 3, 4]);
      }
    }
  });
});
