import { dijkstra } from "./dijkstra";
import { projectPathfindingEvents } from "./pathfindingSteps";

/** Line numbers in DIJKSTRA_CODE_LINES for each event type. */
export const DIJKSTRA_LINE_MAP = {
  init: 1,
  select: 2,
  "select-node": 2,
  dequeue: 4,
  skipNode: 5,
  "skip-node": 5,
  visit: 6,
  "visit-node": 6,
  inspect: 7,
  "inspect-edge": 7,
  skipEdge: 8,
  "skip-edge": 8,
  relax: 11,
  "relax-edge": 11,
  complete: 12,
};

/**
 * Debugger projection of Dijkstra. One event → one step; deterministic.
 * Signature matches the existing graph debugger contract: (graph, start).
 */
export function dijkstraDebug(graph, start) {
  const result = dijkstra(graph, start);
  return projectPathfindingEvents(result.events, {
    lineMap: DIJKSTRA_LINE_MAP,
    label: "dijkstra",
  });
}
