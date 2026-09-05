import { nQueens } from "./nQueens";
import { projectBacktrackEvents } from "./backtrackSteps";

/**
 * Line numbers in NQUEENS_CODE_LINES for each event type.
 */
export const NQUEENS_LINE_MAP = {
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
 * Debugger projection of N-Queens.
 * One event → one step; deterministic.
 */
export function nQueensDebug(n) {
  const { events } = nQueens(n);
  return projectBacktrackEvents(events, {
    lineMap: NQUEENS_LINE_MAP,
    label: "nQueens",
    stateSerializer: (state) => {
      if (!state || !state.board) return "—";
      return state.board
        .map((row) =>
          row
            .map((c) => {
              if (c === "Q") return "Q";
              if (c === "x") return "×";
              return "·";
            })
            .join(" "),
        )
        .join("\n");
    },
  });
}
