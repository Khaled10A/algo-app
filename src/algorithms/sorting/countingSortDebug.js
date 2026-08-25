import { countingSortEvents } from "./countingSort";
import { projectSortingEvents } from "./sortingSteps";

/** Line numbers in COUNTING_SORT_CODE_LINES for each event type. */
export const COUNTING_SORT_LINE_MAP = {
  init: 2,
  countUpdate: 3,
  "count-update": 3,
  countComplete: 3,
  "count-complete": 3,
  prefixUpdate: 4,
  "prefix-update": 4,
  prefixComplete: 4,
  "prefix-complete": 4,
  placeElement: 8,
  "place-element": 8,
  complete: 9,
};

/**
 * Debugger projection of Counting Sort. One event → one step;
 * deterministic. Signature matches the existing sorting debug
 * contract: (array).
 */
export function countingSortDebug(arr) {
  const result = countingSortEvents(arr);
  return projectSortingEvents(result.events, {
    lineMap: COUNTING_SORT_LINE_MAP,
    label: "countingSort",
  });
}
