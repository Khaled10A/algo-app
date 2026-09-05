import { editDistance } from "./editDistance";
import { projectDPEvents } from "./dpSteps";

/** Line numbers in EDIT_DISTANCE_CODE_LINES for each event type. */
export const EDIT_DISTANCE_LINE_MAP = {
  init: 1,
  "compare-cell": 4,
  "compute-cell": 5,
  "skip-cell": 1,
  "backtrack-start": 8,
  "backtrack-step": 8,
  complete: 8,
};

/**
 * Debugger projection of Edit Distance.
 * One event → one step; deterministic.
 */
export function editDistanceDebug(source, target) {
  const { events } = editDistance(source, target);
  return projectDPEvents(events, {
    lineMap: EDIT_DISTANCE_LINE_MAP,
    label: "editDist",
    tableLabels: (event) => ({
      rowLabels: event.rowLabels || [],
      colLabels: event.colLabels || [],
    }),
  });
}
