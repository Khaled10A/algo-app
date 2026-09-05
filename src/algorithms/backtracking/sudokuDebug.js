import { sudoku, getBoardConfig, toDisplaySymbol } from "./sudoku";
import { projectBacktrackEvents } from "./backtrackSteps";

/**
 * Line numbers in SUDOKU_CODE_LINES for each event type.
 */
export const SUDOKU_LINE_MAP = {
  init: 0,
  enter: 1,
  choose: 2,
  "constraint-check": 3,
  solution: 4,
  prune: 5,
  backtrack: 6,
  complete: 7,
};

/**
 * Debugger projection of Sudoku.
 * One event → one step; deterministic.
 * Supports dynamic board sizes (4×4, 9×9, 16×16).
 */
export function sudokuDebug(puzzle) {
  const { events } = sudoku(puzzle);
  const n = puzzle.length;
  const config = getBoardConfig(n);

  return projectBacktrackEvents(events, {
    lineMap: SUDOKU_LINE_MAP,
    label: "sudoku",
    stateSerializer: (state) => {
      if (!state) return "—";
      const parts = [];
      if (state.row != null && state.row >= 0) {
        parts.push(`cell(${state.row},${state.col})`);
      }
      if (state.depth != null) parts.push(`depth=${state.depth}`);
      if (state.placed != null)
        parts.push(`placed=${toDisplaySymbol(state.placed, config)}`);
      if (state.removed != null)
        parts.push(`removed=${toDisplaySymbol(state.removed, config)}`);
      if (state.boardSize != null) parts.push(`N=${state.boardSize}`);
      return parts.join(", ") || "—";
    },
  });
}
