import { fibonacciMemo } from "./fibonacciMemo";
import { projectDPEvents } from "./dpSteps";

/** Line numbers in FIBONACCI_MEMO_CODE_LINES for each event type. */
export const FIBONACCI_MEMO_LINE_MAP = {
  init: 0,
  "compare-cell": 2,
  "compute-cell": 3,
  "skip-cell": 1,
  complete: 4,
};

/**
 * Debugger projection of Fibonacci Memoization.
 * One event → one step; deterministic.
 */
export function fibonacciMemoDebug(n) {
  const { events } = fibonacciMemo(n);
  return projectDPEvents(events, {
    lineMap: FIBONACCI_MEMO_LINE_MAP,
    label: "fibMemo",
  });
}
