import { createEventCollector } from "../../core/execution/events";

/**
 * Actual code layout shown by the debugger for every heap-sort step.
 */
export const HEAP_SORT_CODE_LINES = [
  { n: 0, code: "function heapSort(array) {" },
  { n: 1, code: "  build max heap: siftDown parent(n-1) .. 0" },
  { n: 2, code: "  for end = n-1 down to 1:" },
  { n: 3, code: "    swap array[0] ↔ array[end]   ← extract max" },
  { n: 4, code: "    shrink boundary to end;  siftDown(0, end)" },
  { n: 5, code: "}  ← array sorted" },
];

/**
 * In-place Heap Sort (ascending, max-heap). O(n log n) time, O(1)
 * auxiliary space beyond the defensive input copy. Does not mutate the
 * input (project convention).
 *
 * Returns { sorted, comparisons } — the benchmark contract.
 */
export function heapSort(arr) {
  const { sorted, comparisons } = heapSortEvents(arr);
  return { sorted, comparisons };
}

/**
 * Pure Heap-Sort execution as a deterministic event stream:
 *   init | build-start | compare | swap | build-complete |
 *   extract-max | complete
 *
 * Every compare/swap carries { indices, values, phase, boundary } —
 * plain data, no UI coupling. The projector replays swaps to rebuild
 * the array state.
 */
export function heapSortEvents(input) {
  const collector = createEventCollector();
  const { emit, events } = collector;

  const a = [...input];
  const n = a.length;

  emit("init", { array: [...a], size: n });

  if (n <= 1) {
    emit("complete", { array: [...a], comparisons: 0, sortedFrom: 0 });
    return { sorted: a, comparisons: 0, events };
  }

  let comparisons = 0;

  function siftDown(i, boundary, phase) {
    while (true) {
      const left = 2 * i + 1;
      const right = left + 1;
      if (left >= boundary) break;

      let largest = left;
      if (right < boundary) {
        comparisons++;
        emit("compare", {
          indices: [left, right],
          values: [a[left], a[right]],
          phase,
          boundary,
        });
        if (a[right] > a[left]) largest = right;
      }

      comparisons++;
      emit("compare", {
        indices: [i, largest],
        values: [a[i], a[largest]],
        phase,
        boundary,
      });
      if (a[largest] > a[i]) {
        [a[i], a[largest]] = [a[largest], a[i]];
        emit("swap", {
          indices: [i, largest],
          values: [a[i], a[largest]],
          phase,
          boundary,
        });
        i = largest;
      } else break;
    }
  }

  emit("build-start", { boundary: n });
  for (let i = (n >> 1) - 1; i >= 0; i--) {
    siftDown(i, n, "build");
  }
  emit("build-complete", { boundary: n, comparisons });

  for (let end = n - 1; end > 0; end--) {
    emit("extract-max", {
      indices: [0, end],
      values: [a[0], a[end]],
      phase: "extract",
      boundary: end,
      value: a[0],
    });
    [a[0], a[end]] = [a[end], a[0]];
    comparisons++;
    emit("swap", {
      indices: [0, end],
      values: [a[0], a[end]],
      phase: "extract",
      boundary: end,
      sortedFrom: end,
    });
    siftDown(0, end, "extract");
  }

  emit("complete", { array: [...a], comparisons, sortedFrom: 0 });

  return { sorted: a, comparisons, events };
}
