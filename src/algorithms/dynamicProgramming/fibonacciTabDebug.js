import { fibonacciTab } from "./fibonacciTab";
import { projectDPEvents } from "./dpSteps";

/** Line numbers in FIBONACCI_TAB_CODE_LINES for each event type. */
export const FIBONACCI_TAB_LINE_MAP = {
  init: 0,
  "compare-cell": 3,
  "compute-cell": 3,
  "skip-cell": 1,
  complete: 4,
};

/**
 * Debugger projection of Fibonacci Tabulation.
 * One event → one step; deterministic.
 */
export function fibonacciTabDebug(n) {
  const { events } = fibonacciTab(n);
  return projectDPEvents(events, {
    lineMap: FIBONACCI_TAB_LINE_MAP,
    label: "fibTab",
  });
}
