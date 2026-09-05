import { lis } from "./lis";
import { projectDPEvents } from "./dpSteps";

/** Line numbers in LIS_CODE_LINES for each event type. */
export const LIS_LINE_MAP = {
  init: 1,
  "compare-cell": 3,
  "compute-cell": 5,
  "skip-cell": 1,
  "backtrack-start": 6,
  "backtrack-step": 6,
  complete: 6,
};

/**
 * Debugger projection of Longest Increasing Subsequence.
 * One event → one step; deterministic.
 */
export function lisDebug(arr) {
  const { events } = lis(arr);
  return projectDPEvents(events, {
    lineMap: LIS_LINE_MAP,
    label: "lis",
    tableLabels: (event) => ({
      rowLabels: event.rowLabels || [],
      colLabels: event.colLabels || [],
    }),
  });
}
