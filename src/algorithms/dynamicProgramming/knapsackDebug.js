import { knapsack } from "./knapsack";
import { projectDPEvents } from "./dpSteps";

/** Line numbers in KNAPSACK_CODE_LINES for each event type. */
export const KNAPSACK_LINE_MAP = {
  init: 1,
  "compare-cell": 4,
  "compute-cell": 5,
  "skip-cell": 7,
  "backtrack-start": 8,
  "backtrack-step": 8,
  complete: 8,
};

/**
 * Debugger projection of 0/1 Knapsack.
 * One event → one step; deterministic.
 */
export function knapsackDebug(weights, values, capacity) {
  const { events } = knapsack(weights, values, capacity);
  return projectDPEvents(events, {
    lineMap: KNAPSACK_LINE_MAP,
    label: "knapsack",
    tableLabels: (event) => ({
      rowLabels: event.rowLabels || [],
      colLabels: event.colLabels || [],
    }),
  });
}
