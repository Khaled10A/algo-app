import { subsetSum } from "./subsetSum";
import { projectBacktrackEvents } from "./backtrackSteps";

/**
 * Line numbers in SUBSETSUM_CODE_LINES for each event type.
 */
export const SUBSETSUM_LINE_MAP = {
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
 * Debugger projection of Subset Sum.
 * One event → one step; deterministic.
 */
export function subsetSumDebug(arr, target) {
  const { events } = subsetSum(arr, target);
  return projectBacktrackEvents(events, {
    lineMap: SUBSETSUM_LINE_MAP,
    label: "subsetSum",
    stateSerializer: (state) => {
      if (!state) return "—";
      const parts = [];
      if (state.subset) parts.push(`subset=[${state.subset.join(", ")}]`);
      if (state.sum != null) parts.push(`sum=${state.sum}`);
      if (state.target != null) parts.push(`target=${state.target}`);
      if (state.index != null) parts.push(`idx=${state.index}`);
      return parts.join(", ") || "—";
    },
  });
}
