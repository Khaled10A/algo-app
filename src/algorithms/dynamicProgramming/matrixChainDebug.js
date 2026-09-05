import { matrixChain } from "./matrixChain";
import { projectDPEvents } from "./dpSteps";

/** Line numbers in MATRIX_CHAIN_CODE_LINES for each event type. */
export const MATRIX_CHAIN_LINE_MAP = {
  init: 1,
  "compare-cell": 6,
  "compute-cell": 8,
  "skip-cell": 1,
  "backtrack-start": 9,
  "backtrack-step": 9,
  complete: 9,
};

/**
 * Debugger projection of Matrix Chain Multiplication.
 * One event → one step; deterministic.
 */
export function matrixChainDebug(dims) {
  const { events } = matrixChain(dims);
  return projectDPEvents(events, {
    lineMap: MATRIX_CHAIN_LINE_MAP,
    label: "matrixChain",
    tableLabels: (event) => ({
      rowLabels: event.rowLabels || [],
      colLabels: event.colLabels || [],
    }),
  });
}
