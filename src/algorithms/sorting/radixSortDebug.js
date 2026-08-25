import { radixSortEvents } from "./radixSort";
import { projectSortingEvents } from "./sortingSteps";

/** Line numbers in RADIX_SORT_CODE_LINES for each event type. */
export const RADIX_SORT_LINE_MAP = {
  init: 1,
  digitPassStart: 4,
  "digit-pass-start": 4,
  countUpdate: 8,
  "count-update": 8,
  prefixUpdate: 9,
  "prefix-update": 9,
  placeElement: 13,
  "place-element": 13,
  digitPassComplete: 14,
  "digit-pass-complete": 14,
  complete: 15,
};

/**
 * Debugger projection of Radix Sort. One event → one step;
 * deterministic. Signature matches the existing sorting debug
 * contract: (array).
 */
export function radixSortDebug(arr) {
  const result = radixSortEvents(arr);
  return projectSortingEvents(result.events, {
    lineMap: RADIX_SORT_LINE_MAP,
    label: "radixSort",
  });
}
