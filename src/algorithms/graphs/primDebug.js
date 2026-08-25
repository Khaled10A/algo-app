import { prim } from "./prim";
import { projectMstEvents } from "./mstSteps";

/** Line numbers in PRIM_CODE_LINES for each event type. */
export const PRIM_LINE_MAP = {
  init: 1,
  startNode: 1,
  "start-node": 1,
  visitNode: 6,
  "visit-node": 6,
  enqueueEdge: 7,
  "enqueue-edge": 7,
  inspectEdge: 4,
  "inspect-edge": 4,
  rejectEdge: 5,
  "reject-edge": 5,
  selectEdge: 6,
  "select-edge": 6,
  disconnected: 8,
  complete: 9,
};

/**
 * Debugger projection of Prim. One event → one step; deterministic.
 * Signature matches the existing graph debugger contract: (graph, start).
 */
export function primDebug(graph, start) {
  const result = prim(graph, start);
  return projectMstEvents(result.events, {
    lineMap: PRIM_LINE_MAP,
    label: "prim",
  });
}
