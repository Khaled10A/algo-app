import { kruskal } from "./kruskal";
import { projectMstEvents } from "./mstSteps";

/** Line numbers in KRUSKAL_CODE_LINES for each event type. */
export const KRUSKAL_LINE_MAP = {
  init: 3,
  inspectEdge: 5,
  "inspect-edge": 5,
  rejectEdge: 6,
  "reject-edge": 6,
  selectEdge: 8,
  "select-edge": 8,
  disconnected: 9,
  visitNode: 9,
  "visit-node": 9,
  complete: 9,
};

/**
 * Debugger projection of Kruskal. One event → one step; deterministic.
 * Signature matches the existing graph debugger contract — Kruskal is
 * source-independent, so the start argument is ignored.
 */
export function kruskalDebug(graph) {
  const result = kruskal(graph);
  return projectMstEvents(result.events, {
    lineMap: KRUSKAL_LINE_MAP,
    label: "kruskal",
  });
}
