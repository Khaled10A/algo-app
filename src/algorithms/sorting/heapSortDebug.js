import { heapSortEvents } from "./heapSort";
import { projectSortingEvents } from "./sortingSteps";

/** Line numbers in HEAP_SORT_CODE_LINES for each event type. */
export const HEAP_SORT_LINE_MAP = {
  init: 1,
  buildStart: 1,
  "build-start": 1,
  compare: 1,
  swap: 1,
  buildComplete: 2,
  "build-complete": 2,
  extractMax: 3,
  "extract-max": 3,
  complete: 5,
};

/**
 * Debugger projection of Heap Sort. One event → one step; deterministic.
 * Signature matches the existing sorting debug contract: (array).
 * The rich snapshots double as visualizer steps (arr + highlight).
 */
export function heapSortDebug(arr) {
  const result = heapSortEvents(arr);
  return projectSortingEvents(result.events, {
    lineMap: HEAP_SORT_LINE_MAP,
    label: "heapSort",
  });
}
