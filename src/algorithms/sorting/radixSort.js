import { createEventCollector } from "../../core/execution/events";

/**
 * Actual code layout shown by the debugger for every radix-sort step.
 */
export const RADIX_SORT_CODE_LINES = [
  { n: 0, code: "function radixSort(array) {" },
  { n: 1, code: "  offset negatives;  max = max(offset array)" },
  { n: 2, code: "  totalPasses = digits in max" },
  { n: 3, code: "  for pass = 0 .. totalPasses-1:" },
  { n: 4, code: "    place = 10^pass" },
  { n: 5, code: "    count[0..9] = 0" },
  { n: 6, code: "    for i = 0 .. n-1:" },
  { n: 7, code: "      digit = floor(a[i] / place) % 10" },
  { n: 8, code: "      count[digit]++" },
  { n: 9, code: "    for d = 1 .. 9:  count[d] += count[d-1]" },
  { n: 10, code: "    output = [0] × n" },
  { n: 11, code: "    for i = n-1 down to 0:  ← stable" },
  { n: 12, code: "      digit = floor(a[i] / place) % 10" },
  { n: 13, code: "      output[--count[digit]] = a[i]" },
  { n: 14, code: "    copy output → array" },
  { n: 15, code: "}  ← sorted (all digit passes done)" },
];

/**
 * LSD Radix Sort for integers (including negatives).
 *
 * Strategy for negatives: offset all values by the minimum so every
 * value is non-negative, run standard LSD radix on the offset values,
 * then un-offset at the end. Uniform offset preserves order.
 *
 * Each digit pass is a stable counting sort on the current decimal
 * digit. Time O(d·(n+k)), space O(n+k), where d = digit count and
 * k = 10 (radix). No comparisons — the defining property.
 *
 * Emits a deterministic event sequence reusing the counting-sort
 * vocabulary plus two pass markers:
 *   init | digit-pass-start | count-update | prefix-update |
 *   place-element | digit-pass-complete | complete
 */
export function radixSortEvents(input) {
  const collector = createEventCollector();
  const { emit, events } = collector;

  const a = [...input];
  const n = a.length;

  if (n === 0) {
    emit("init", { array: [], size: 0, totalPasses: 0 });
    emit("complete", { array: [], passes: 0 });
    return { sorted: [], events };
  }

  const min = Math.min(...a);
  const offset = min < 0 ? -min : 0;
  if (offset > 0) {
    for (let i = 0; i < n; i++) a[i] += offset;
  }

  const maxVal = Math.max(...a);
  const totalPasses = maxVal === 0 ? 1 : Math.floor(Math.log10(maxVal)) + 1;

  emit("init", {
    array: [...a],
    size: n,
    totalPasses,
    offset,
    original: [...input],
  });

  const output = new Array(n);

  for (let pass = 0; pass < totalPasses; pass++) {
    const place = Math.pow(10, pass);
    emit("digit-pass-start", { pass: pass + 1, totalPasses, place });

    const count = new Array(10).fill(0);

    for (let i = 0; i < n; i++) {
      const digit = Math.floor(a[i] / place) % 10;
      count[digit]++;
      emit("count-update", {
        inputIndex: i,
        value: a[i],
        digit,
        countIndex: digit,
        count: count[digit],
        countArray: [...count],
        pass: pass + 1,
        totalPasses,
        place,
      });
    }

    for (let d = 1; d < 10; d++) {
      count[d] += count[d - 1];
      emit("prefix-update", {
        countIndex: d,
        cumulative: count[d],
        countArray: [...count],
        pass: pass + 1,
        totalPasses,
        place,
      });
    }

    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(a[i] / place) % 10;
      count[digit]--;
      const oi = count[digit];
      output[oi] = a[i];
      emit("place-element", {
        inputIndex: i,
        value: a[i],
        outputIndex: oi,
        output: [...output],
        digit,
        pass: pass + 1,
        totalPasses,
        place,
      });
    }

    for (let i = 0; i < n; i++) a[i] = output[i];
    emit("digit-pass-complete", {
      pass: pass + 1,
      totalPasses,
      place,
      output: [...a],
    });
  }

  if (offset > 0) {
    for (let i = 0; i < n; i++) a[i] -= offset;
  }

  emit("complete", { array: [...a], passes: totalPasses });

  return { sorted: a, events };
}
