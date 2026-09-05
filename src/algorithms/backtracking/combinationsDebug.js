import { combinations } from "./combinations";
import { projectBacktrackEvents } from "./backtrackSteps";

/**
 * Line numbers in COMBINATIONS_CODE_LINES for each event type.
 */
export const COMBINATIONS_LINE_MAP = {
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
 * Debugger projection of Combinations.
 * One event → one step; deterministic.
 */
export function combinationsDebug(arr, k) {
  const { events } = combinations(arr, k);
  return projectBacktrackEvents(events, {
    lineMap: COMBINATIONS_LINE_MAP,
    label: "combinations",
    stateSerializer: (state) => {
      if (!state) return "—";
      const parts = [];
      if (state.path) parts.push(`comb=[${state.path.join(", ")}]`);
      if (state.start != null) parts.push(`start=${state.start}`);
      if (state.depth != null) parts.push(`depth=${state.depth}`);
      return parts.join(", ") || "—";
    },
  });
}
