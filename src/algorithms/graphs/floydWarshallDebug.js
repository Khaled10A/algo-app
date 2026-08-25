import { floydWarshall } from "./floydWarshall";
import { projectMatrixEvents } from "./floydWarshallSteps";

/** Line numbers in FLOYD_WARSHALL_CODE_LINES for each event type. */
export const FLOYD_WARSHALL_LINE_MAP = {
  init: 2,
  kStart: 4,
  "k-start": 4,
  inspectPair: 7,
  "inspect-pair": 7,
  updateDistance: 9,
  "update-distance": 9,
  kComplete: 9,
  "k-complete": 9,
  negativeCycleCheck: 10,
  "negative-cycle-check": 10,
  negativeCycleDetected: 10,
  "negative-cycle-detected": 10,
  complete: 11,
};

/**
 * Debugger projection of Floyd-Warshall. One event → one step;
 * deterministic. Signature matches the existing graph debugger
 * contract — no source node: all-pairs is source-independent.
 */
export function floydWarshallDebug(graph) {
  const result = floydWarshall(graph);
  return projectMatrixEvents(result.events, {
    lineMap: FLOYD_WARSHALL_LINE_MAP,
    label: "floydWarshall",
  });
}
