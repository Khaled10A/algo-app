import { permutations } from "./permutations";
import { projectBacktrackEvents } from "./backtrackSteps";

/**
 * Line numbers in PERMUTATIONS_CODE_LINES for each event type.
 */
export const PERMUTATIONS_LINE_MAP = {
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
 * Debugger projection of Permutations.
 * One event → one step; deterministic.
 */
export function permutationsDebug(arr) {
  const { events } = permutations(arr);
  return projectBacktrackEvents(events, {
    lineMap: PERMUTATIONS_LINE_MAP,
    label: "permutations",
    stateSerializer: (state) => {
      if (!state) return "—";
      const parts = [];
      if (state.path) parts.push(`path=[${state.path.join(", ")}]`);
      if (state.used) {
        const usedIndices = state.used
          .map((u, i) => (u ? i : -1))
          .filter((i) => i >= 0);
        parts.push(`used=[${usedIndices.join(", ")}]`);
      }
      if (state.depth != null) parts.push(`depth=${state.depth}`);
      return parts.join(", ") || "—";
    },
  });
}
