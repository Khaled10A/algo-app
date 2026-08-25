import { createEventCollector } from "../../core/execution/events";

/**
 * Actual code layout shown by the debugger for every counting-sort step.
 */
export const COUNTING_SORT_CODE_LINES = [
  { n: 0, code: "function countingSort(array) {" },
  { n: 1, code: "  min = min(array);  max = max(array)" },
  { n: 2, code: "  range = max - min + 1;  count = [0] × range" },
  { n: 3, code: "  for i = 0 .. n-1:  count[array[i] - min]++" },
  { n: 4, code: "  for ci = 1 .. range-1:  count[ci] += count[ci-1]" },
  { n: 5, code: "  output = [0] × n" },
  { n: 6, code: "  for i = n-1 down to 0:  ← stable placement" },
  { n: 7, code: "    count[array[i] - min]--" },
  { n: 8, code: "    output[count[array[i] - min]] = array[i]" },
  { n: 9, code: "  return output   ← sorted (stable)" },
];

/**
 * Counting Sort — non-comparison sort for integers.
 * O(n + k) time, O(n + k) auxiliary space, where k = max - min + 1.
 * Stable (right-to-left placement). Negative integers supported via
 * min-offset. Returns { sorted, comparisons: 0 } — zero comparisons
 * is the defining property of the algorithm.
 *
 * Does not mutate the input (project convention).
 */
export function countingSort(arr) {
  const { sorted, comparisons } = countingSortEvents(arr);
  return { sorted, comparisons };
}

/**
 * Pure Counting-Sort execution as a deterministic event stream:
 *   init | count-update | count-complete | prefix-update |
 *   prefix-complete | place-element | complete
 *
 * The input is scanned left-to-right to build the frequency count,
 * prefix sums are accumulated, then elements are placed right-to-left
 * into the output for stability. No UI coupling.
 */
export function countingSortEvents(input) {
  const collector = createEventCollector();
  const { emit, events } = collector;

  const a = [...input];
  const n = a.length;

  if (n === 0) {
    emit("init", { array: [], min: 0, max: 0, range: 0, size: 0 });
    emit("complete", { array: [], placements: 0, sortedFrom: 0 });
    return { sorted: [], comparisons: 0, events };
  }

  const min = Math.min(...a);
  const max = Math.max(...a);
  const range = max - min + 1;

  emit("init", { array: [...a], min, max, range, size: n });

  const count = new Array(range).fill(0);

  for (let i = 0; i < n; i++) {
    const ci = a[i] - min;
    count[ci]++;
    emit("count-update", {
      inputIndex: i,
      value: a[i],
      countIndex: ci,
      count: count[ci],
      countArray: [...count],
    });
  }

  emit("count-complete", { countArray: [...count] });

  for (let ci = 1; ci < range; ci++) {
    count[ci] += count[ci - 1];
    emit("prefix-update", {
      countIndex: ci,
      cumulative: count[ci],
      countArray: [...count],
    });
  }

  emit("prefix-complete", { countArray: [...count] });

  const output = new Array(n).fill(null);

  for (let i = n - 1; i >= 0; i--) {
    const ci = a[i] - min;
    count[ci]--;
    const oi = count[ci];
    output[oi] = a[i];
    emit("place-element", {
      inputIndex: i,
      value: a[i],
      outputIndex: oi,
      output: [...output],
    });
  }

  emit("complete", { array: [...output], placements: n, sortedFrom: 0 });

  return { sorted: output, comparisons: 0, events };
}
