import { createEventCollector } from "../../core/execution/events";

// ── Supported board sizes ──────────────────────────────────────

/**
 * Supported Sudoku board sizes.
 * Each entry defines the full board dimension N, sub-box size (boxSize),
 * and the valid symbol set. N = boxSize × boxSize.
 */
export const SUPPORTED_SIZES = [
  {
    n: 4,
    boxSize: 2,
    symbols: [1, 2, 3, 4],
    label: "4×4",
    displaySymbols: ["1", "2", "3", "4"],
  },
  {
    n: 9,
    boxSize: 3,
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    label: "9×9",
    displaySymbols: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  {
    n: 16,
    boxSize: 4,
    symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    label: "16×16",
    displaySymbols: [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ],
  },
];

/**
 * Get board config for a given N.
 * @param {number} n – board dimension (must be a supported size)
 * @returns {Object} board config
 */
export function getBoardConfig(n) {
  const cfg = SUPPORTED_SIZES.find((s) => s.n === n);
  if (!cfg) {
    throw new Error(
      `Unsupported board size ${n}. Supported: ${SUPPORTED_SIZES.map((s) => s.n).join(", ")}`,
    );
  }
  return cfg;
}



/**
 * Convert internal numeric value to display symbol.
 * For N≤9: numeric string. For N=16: hexadecimal character.
 * @param {number} val – internal value (0 = empty, 1..N = symbol)
 * @param {Object} config – board config
 * @returns {string}
 */
export function toDisplaySymbol(val, config) {
  if (val === 0) return "";
  return config.displaySymbols[val - 1] || String(val);
}

/**
 * Sudoku — solve an N×N Sudoku puzzle using constraint-based backtracking.
 *
 * The algorithm finds the first empty cell (value 0), tries valid symbols
 * that don't violate row, column, or sub-box constraints, recurses on the
 * next empty cell, and backtracks on contradiction. Deterministic traversal:
 * cells are solved in row-major order; symbols are tried in ascending order.
 *
 * Supported board sizes: 4×4 (2×2 boxes), 9×9 (3×3 boxes), 16×16 (4×4 boxes).
 * The board size is auto-detected from the puzzle array dimensions.
 *
 * Event vocabulary (maps to existing backtracking framework):
 *   init              — initial puzzle state
 *   enter             — entering recursive call for an empty cell
 *   choose            — trying a candidate symbol at (row, col)
 *   constraint-check  — validating candidate against row/col/box constraints
 *   solution          — all cells filled (valid complete board)
 *   prune             — dead-end: no valid symbol remains for current cell
 *   backtrack         — undoing a placed symbol at (row, col)
 *   complete          — exploration finished
 *
 * State shape (carried through events):
 *   { board: number[][], row, col, depth, placed, removed, boardSize, boxSize }
 *
 * @param {number[][]} puzzle – N×N grid; 0 = empty, 1..N = given
 * @returns {{ events: Array, solutions: Array<number[][]>, count: number, boardSize: number }}
 */
export function sudoku(puzzle) {
  // ── Input validation ──────────────────────────────────────
  if (!Array.isArray(puzzle) || puzzle.length === 0) {
    throw new Error("Puzzle must be a non-empty 2D array");
  }

  const n = puzzle.length;

  // Check that N is a supported board size
  let config;
  try {
    config = getBoardConfig(n);
  } catch {
    throw new Error(
      `Unsupported board size ${n}. Supported: ${SUPPORTED_SIZES.map((s) => s.n).join(", ")}`,
    );
  }

  const { boxSize, symbols } = config;

  // Validate all rows
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(puzzle[i]) || puzzle[i].length !== n) {
      throw new Error(`Row ${i} must have exactly ${n} elements`);
    }
    for (let j = 0; j < n; j++) {
      const v = puzzle[i][j];
      if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > n) {
        throw new Error(
          `Cell (${i},${j}) must be an integer 0–${n}, got ${v}`,
        );
      }
    }
  }

  // Validate no initial constraint violations
  validatePuzzle(puzzle, n, boxSize);

  const collector = createEventCollector();
  const { emit } = collector;

  // Deep copy the board — solver mutates it
  const board = puzzle.map((r) => [...r]);
  const solution = [];
  let found = false;

  emit("init", {
    state: {
      board: board.map((r) => [...r]),
      row: -1,
      col: -1,
      depth: 0,
      placed: null,
      removed: null,
      boardSize: n,
      boxSize,
    },
    inputVars: {
      puzzle: formatBoard(puzzle, config),
      n: String(n),
      boxSize: String(boxSize),
    },
    log: `Initialize ${n}×${n} Sudoku puzzle (${boxSize}×${boxSize} boxes)`,
  });

  // Lightweight state — no board copy (avoids OOM from deep-copying per event)
  function lightState(extra) {
    return {
      row: -1,
      col: -1,
      depth: 0,
      placed: null,
      removed: null,
      boardSize: n,
      boxSize,
      ...extra,
    };
  }

  function findEmpty() {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  function isValid(row, col, symbol) {
    // Check row
    for (let c = 0; c < n; c++) {
      if (c !== col && board[row][c] === symbol) return false;
    }
    // Check column
    for (let r = 0; r < n; r++) {
      if (r !== row && board[r][col] === symbol) return false;
    }
    // Check sub-box
    const boxRow = Math.floor(row / boxSize) * boxSize;
    const boxCol = Math.floor(col / boxSize) * boxSize;
    for (let r = boxRow; r < boxRow + boxSize; r++) {
      for (let c = boxCol; c < boxCol + boxSize; c++) {
        if (r !== row && c !== col && board[r][c] === symbol) return false;
      }
    }
    return true;
  }

  function solve(depth) {
    const empty = findEmpty();

    if (!empty) {
      // All cells filled — solution found
      found = true;
      const snapshot = board.map((r) => [...r]);
      solution.push(snapshot);

      emit("solution", {
        depth,
        solution: snapshot,
        state: {
          board: snapshot,
          row: -1,
          col: -1,
          depth,
          placed: null,
          removed: null,
          boardSize: n,
          boxSize,
        },
        vars: {
          depth: String(depth),
          solution: String(solution.length),
          cells: String(depth),
        },
        log: `Solution #${solution.length} found — all cells filled`,
      });
      return true;
    }

    const [row, col] = empty;

    emit("enter", {
      depth: depth + 1,
      candidates: [...symbols],
      state: lightState({ row, col, depth }),
      label: `cell(${row},${col})`,
      vars: {
        row: String(row),
        col: String(col),
        depth: String(depth),
        boardSize: String(n),
      },
      log: `Empty cell at (${row}, ${col}) — try symbols 1–${n}`,
    });

    let placedAny = false;

    for (const symbol of symbols) {
      if (!isValid(row, col, symbol)) {
        // Emit prune for invalid candidate so tree shows rejected symbols
        emit("prune", {
          depth: depth + 1,
          reason: `symbol ${toDisplaySymbol(symbol, config)} conflicts`,
          state: lightState({ row, col, depth }),
          vars: {
            row: String(row),
            col: String(col),
            symbol: toDisplaySymbol(symbol, config),
            depth: String(depth),
          },
          log: `Symbol ${toDisplaySymbol(symbol, config)} at (${row}, ${col}) — conflict`,
        });
        continue;
      }

      // Valid candidate — place it
      board[row][col] = symbol;

      emit("choose", {
        depth: depth + 1,
        candidate: symbol,
        candidates: [...symbols],
        state: lightState({ row, col, depth, placed: symbol }),
        highlightCells: [[row, col]],
        vars: {
          row: String(row),
          col: String(col),
          symbol: toDisplaySymbol(symbol, config),
          depth: String(depth),
        },
        log: `Place symbol ${toDisplaySymbol(symbol, config)} at (${row}, ${col})`,
      });

      emit("constraint-check", {
        depth: depth + 1,
        candidate: symbol,
        valid: true,
        state: lightState({ row, col, depth, placed: symbol }),
        highlightCells: [[row, col]],
        vars: {
          row: String(row),
          col: String(col),
          symbol: toDisplaySymbol(symbol, config),
          valid: "true",
          depth: String(depth),
        },
        log: `Symbol ${toDisplaySymbol(symbol, config)} at (${row}, ${col}) — valid`,
      });

      placedAny = true;

      // Recurse
      if (solve(depth + 1)) {
        return true;
      }

      // Backtrack — undo the placement
      board[row][col] = 0;

      emit("backtrack", {
        depth: depth + 1,
        removed: symbol,
        state: lightState({ row, col, depth, removed: symbol }),
        removedCells: [[row, col]],
        vars: {
          row: String(row),
          col: String(col),
          symbol: toDisplaySymbol(symbol, config),
          depth: String(depth),
        },
        log: `Remove symbol ${toDisplaySymbol(symbol, config)} from (${row}, ${col}) — backtrack`,
      });
    }

    if (!placedAny) {
      // Dead-end: all symbols invalid
      emit("prune", {
        depth: depth + 1,
        reason: "no valid symbol for cell",
        state: lightState({ row, col, depth }),
        vars: {
          row: String(row),
          col: String(col),
          depth: String(depth),
          reason: "no valid symbol",
        },
        log: `Dead-end at (${row}, ${col}) — no valid symbol`,
      });
    }

    return false;
  }

  solve(0);

  emit("complete", {
    state: {
      board:
        solution.length > 0 ? solution[0] : board.map((r) => [...r]),
      row: -1,
      col: -1,
      depth: 0,
      placed: null,
      removed: null,
      boardSize: n,
      boxSize,
    },
    vars: {
      totalSolutions: String(solution.length),
      boardSize: String(n),
    },
    log: found
      ? `Done — puzzle solved in ${solution.length} solution(s)`
      : "Done — no solution exists",
  });

  return {
    events: collector.events,
    solutions: solution,
    count: solution.length,
    boardSize: n,
  };
}

// ── Validation helpers ────────────────────────────────────────

/**
 * Validate that the initial puzzle doesn't contain duplicate symbols
 * in any row, column, or sub-box.
 */
function validatePuzzle(puzzle, n, boxSize) {
  // Check rows
  for (let r = 0; r < n; r++) {
    const seen = new Set();
    for (let c = 0; c < n; c++) {
      const v = puzzle[r][c];
      if (v !== 0 && seen.has(v)) {
        throw new Error(`Invalid puzzle: duplicate ${v} in row ${r}`);
      }
      if (v !== 0) seen.add(v);
    }
  }
  // Check columns
  for (let c = 0; c < n; c++) {
    const seen = new Set();
    for (let r = 0; r < n; r++) {
      const v = puzzle[r][c];
      if (v !== 0 && seen.has(v)) {
        throw new Error(`Invalid puzzle: duplicate ${v} in column ${c}`);
      }
      if (v !== 0) seen.add(v);
    }
  }
  // Check sub-boxes
  for (let br = 0; br < n; br += boxSize) {
    for (let bc = 0; bc < n; bc += boxSize) {
      const seen = new Set();
      for (let r = br; r < br + boxSize; r++) {
        for (let c = bc; c < bc + boxSize; c++) {
          const v = puzzle[r][c];
          if (v !== 0 && seen.has(v)) {
            throw new Error(
              `Invalid puzzle: duplicate ${v} in box (${Math.floor(br / boxSize)},${Math.floor(bc / boxSize)})`,
            );
          }
          if (v !== 0) seen.add(v);
        }
      }
    }
  }
}

function formatBoard(board, config) {
  return board
    .map((r) =>
      `[${r.map((v) => toDisplaySymbol(v, config)).join(",")}]`,
    )
    .join("\n");
}

// ── Educational puzzles ────────────────────────────────────────

/** 4×4 Easy puzzle — very few backtracks needed */
export const PUZZLE_4X4 = [
  [0, 2, 0, 4],
  [3, 0, 0, 2],
  [0, 1, 4, 0],
  [4, 0, 0, 1],
];

/** 4×4 Solved */
export const PUZZLE_4X4_SOLVED = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

/** 9×9 Easy puzzle — very few backtracks needed */
export const PUZZLE_EASY = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

/** 9×9 Medium puzzle — moderate backtracking */
export const PUZZLE_MEDIUM = [
  [0, 0, 0, 2, 6, 0, 7, 0, 1],
  [6, 8, 0, 0, 7, 0, 0, 9, 0],
  [1, 9, 0, 0, 0, 4, 5, 0, 0],
  [8, 2, 0, 1, 0, 0, 0, 4, 0],
  [0, 0, 4, 6, 0, 2, 9, 0, 0],
  [0, 5, 0, 0, 0, 3, 0, 2, 8],
  [0, 0, 9, 3, 0, 0, 0, 7, 4],
  [0, 4, 0, 0, 5, 0, 0, 3, 6],
  [7, 0, 3, 0, 1, 8, 0, 0, 0],
];

/** 9×9 Hard puzzle — significant backtracking (~23 givens) */
export const PUZZLE_HARD = [
  [1, 0, 0, 0, 0, 7, 0, 9, 0],
  [0, 3, 0, 0, 2, 0, 0, 0, 8],
  [0, 0, 9, 6, 0, 0, 5, 0, 0],
  [0, 0, 5, 3, 0, 0, 9, 0, 0],
  [0, 1, 0, 0, 8, 0, 0, 0, 2],
  [6, 0, 0, 0, 0, 4, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 4, 0, 0, 0, 0, 0, 0, 7],
  [0, 0, 7, 0, 0, 0, 3, 0, 0],
];

/** 9×9 Already solved puzzle */
export const PUZZLE_SOLVED = [
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

/** 16×16 puzzle — uses values 1-16 (displayed as hex 0-F) */
export const PUZZLE_16X16 = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

/** 16×16 Already solved puzzle (for immediate-solve test) */
export const PUZZLE_16X16_SOLVED = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 1, 2, 3, 4],
  [9, 10, 11, 12, 13, 14, 15, 16, 1, 2, 3, 4, 5, 6, 7, 8],
  [13, 14, 15, 16, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16, 15],
  [6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16, 15, 2, 1, 4, 3],
  [10, 9, 12, 11, 14, 13, 16, 15, 2, 1, 4, 3, 6, 5, 8, 7],
  [14, 13, 16, 15, 2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11],
  [3, 4, 1, 2, 7, 8, 5, 6, 11, 12, 9, 10, 15, 16, 13, 14],
  [7, 8, 5, 6, 11, 12, 9, 10, 15, 16, 13, 14, 3, 4, 1, 2],
  [11, 12, 9, 10, 15, 16, 13, 14, 3, 4, 1, 2, 7, 8, 5, 6],
  [15, 16, 13, 14, 3, 4, 1, 2, 7, 8, 5, 6, 11, 12, 9, 10],
  [4, 3, 2, 1, 8, 7, 6, 5, 12, 11, 10, 9, 16, 15, 14, 13],
  [8, 7, 6, 5, 12, 11, 10, 9, 16, 15, 14, 13, 4, 3, 2, 1],
  [12, 11, 10, 9, 16, 15, 14, 13, 4, 3, 2, 1, 8, 7, 6, 5],
  [16, 15, 14, 13, 4, 3, 2, 1, 8, 7, 6, 5, 12, 11, 10, 9],
];

export const PUZZLES = {
  "4x4": PUZZLE_4X4,
  "4x4-solved": PUZZLE_4X4_SOLVED,
  easy: PUZZLE_EASY,
  medium: PUZZLE_MEDIUM,
  hard: PUZZLE_HARD,
  solved: PUZZLE_SOLVED,
  "16x16": PUZZLE_16X16,
  "16x16-solved": PUZZLE_16X16_SOLVED,
};

/**
 * Get puzzle presets for a given board size.
 * @param {number} n – board dimension
 * @returns {Object} map of preset name → puzzle array
 */
export function getPuzzlePresets(n) {
  const presets = {};
  if (n === 4) {
    presets["Easy"] = PUZZLE_4X4;
    presets["Solved"] = PUZZLE_4X4_SOLVED;
  } else if (n === 9) {
    presets["Easy"] = PUZZLE_EASY;
    presets["Medium"] = PUZZLE_MEDIUM;
    presets["Hard"] = PUZZLE_HARD;
    presets["Solved"] = PUZZLE_SOLVED;
  } else if (n === 16) {
    presets["Easy"] = PUZZLE_16X16;
    presets["Solved"] = PUZZLE_16X16_SOLVED;
  }
  return presets;
}
