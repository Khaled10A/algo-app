import { bellmanFord } from "./bellmanFord";
import { projectPathfindingEvents } from "./pathfindingSteps";

/** Line numbers in BELLMAN_FORD_CODE_LINES for each event type. */
export const BELLMAN_FORD_LINE_MAP = {
  init: 1,
  passStart: 3,
  "pass-start": 3,
  inspect: 5,
  "inspect-edge": 5,
  skipUnreachable: 6,
  "skip-unreachable": 6,
  relax: 9,
  "relax-edge": 9,
  skipEdge: 8,
  "skip-edge": 8,
  passComplete: 10,
  "pass-complete": 10,
  negativeCycleCheck: 11,
  "negative-cycle-check": 11,
  negativeCycleDetected: 12,
  "negative-cycle-detected": 12,
  complete: 13,
};

/**
 * Debugger projection of Bellman-Ford. One event → one step; deterministic.
 * Signature matches the existing graph debugger contract: (graph, start).
 */
export function bellmanFordDebug(graph, start) {
  const result = bellmanFord(graph, start);
  return projectPathfindingEvents(result.events, {
    lineMap: BELLMAN_FORD_LINE_MAP,
    label: "bellmanFord",
    knownFromDistances: true,
    passTracking: true,
  });
}
