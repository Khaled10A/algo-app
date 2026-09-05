import { lcs } from "./lcs";
import { projectDPEvents } from "./dpSteps";

/** Line numbers in LCS_CODE_LINES for each event type. */
export const LCS_LINE_MAP = {
  init: 1,
  "compare-cell": 4,
  "compute-cell": 5,
  "skip-cell": 6,
  "backtrack-start": 7,
  "backtrack-step": 7,
  complete: 7,
};

/**
 * Debugger projection of Longest Common Subsequence.
 * One event → one step; deterministic.
 */
export function lcsDebug(a, b) {
  const { events } = lcs(a, b);
  return projectDPEvents(events, {
    lineMap: LCS_LINE_MAP,
    label: "lcs",
    tableLabels: (event) => ({
      rowLabels: event.rowLabels || [],
      colLabels: event.colLabels || [],
    }),
  });
}
