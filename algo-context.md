# Algorithm Context — Raw Source & Conventions

---

## src/algorithms/sorting/mergeSort.js

```js
/**
 * Merge Sort — Divide & Conquer
 * Time: O(n log n) | Space: O(n)
 */
export function mergeSort(arr) {
  let comparisons = 0;
  function merge(l, r) {
    const res = [];
    let i = 0,
      j = 0;
    while (i < l.length && j < r.length) {
      comparisons++;
      if (l[i] <= r[j]) res.push(l[i++]);
      else res.push(r[j++]);
    }
    return [...res, ...l.slice(i), ...r.slice(j)];
  }
  function ms(a) {
    if (a.length <= 1) return a;
    const m = Math.floor(a.length / 2);
    return merge(ms(a.slice(0, m)), ms(a.slice(m)));
  }
  return { sorted: ms([...arr]), comparisons };
}

export const MERGE_SORT_CODE_LINES = [
  { n: 0, code: "function mergeSort(arr) {" },
  { n: 1, code: "  sort(lo = 0, hi = n-1): if lo >= hi return" },
  { n: 2, code: "  mid = floor((lo + hi) / 2)" },
  { n: 3, code: "  sort(lo, mid);  sort(mid+1, hi)" },
  { n: 4, code: "  copy A[lo..hi] → aux" },
  { n: 5, code: "  merge: i=lo, j=mid+1" },
  { n: 6, code: "  for k = lo..hi: A[k] = smaller(aux[i], aux[j])" },
  { n: 7, code: "}" },
];

export function mergeSortDebug(arr) {
  const a = [...arr];
  const aux = new Array(a.length);
  const steps = [];
  const frames = [];

  const snap = (activeLine, vars, highlight, log) =>
    steps.push({
      arr: [...a],
      highlight: highlight || [],
      activeLine,
      vars,
      memory: {
        arr: `[${a.join(", ")}]`,
        lo: vars.lo !== undefined ? String(vars.lo) : "-",
        mid: vars.mid !== undefined ? String(vars.mid) : "-",
        hi: vars.hi !== undefined ? String(vars.hi) : "-",
        i: vars.i !== undefined ? String(vars.i) : "-",
        j: vars.j !== undefined ? String(vars.j) : "-",
        k: vars.k !== undefined ? String(vars.k) : "-",
      },
      callStack: ["mergeSort(arr)", ...frames],
      log,
    });

  snap(0, {}, [], "Start: arr initialized");

  function ms(lo, hi) {
    if (lo >= hi) return;
    frames.push(`  └ sort(lo=${lo}, hi=${hi})`);
    const mid = Math.floor((lo + hi) / 2);
    snap(
      2,
      { lo, mid, hi },
      rangeIdx(lo, hi),
      `Split [${lo}..${hi}] at mid=${mid} → [${lo}..${mid}] + [${mid + 1}..${hi}]`,
    );
    ms(lo, mid);
    ms(mid + 1, hi);

    for (let k = lo; k <= hi; k++) aux[k] = a[k];
    let i = lo,
      j = mid + 1;
    snap(
      5,
      { lo, mid, hi, i, j },
      rangeIdx(lo, hi),
      `Merge halves [${lo}..${mid}] + [${mid + 1}..${hi}]`,
    );
    for (let k = lo; k <= hi; k++) {
      if (i > mid) {
        a[k] = aux[j++];
      } else if (j > hi) {
        a[k] = aux[i++];
      } else if (aux[j] < aux[i]) {
        a[k] = aux[j++];
      } else {
        a[k] = aux[i++];
      }
      snap(6, { lo, mid, hi, i, j, k }, [k], `Placed ${a[k]} at position ${k}`);
    }
    frames.pop();
  }

  function rangeIdx(lo, hi) {
    const out = [];
    for (let k = lo; k <= hi; k++) out.push(k);
    return out;
  }

  ms(0, a.length - 1);
  snap(7, {}, [], `Done! Sorted: [${a.join(", ")}]`);
  return steps;
}
```

---

## src/algorithms/sorting/descriptors.js

```js
import {
  insertionSort,
  insertionSortSteps,
  insertionSortDebug,
} from "./insertionSort";
import { bubbleSort, bubbleSortSteps, bubbleSortDebug } from "./bubbleSort";
import {
  selectionSort,
  selectionSortSteps,
  selectionSortDebug,
} from "./selectionSort";
import { mergeSort, mergeSortDebug, MERGE_SORT_CODE_LINES } from "./mergeSort";
import { quickSort, quickSortDebug, QUICK_SORT_CODE_LINES } from "./quickSort";
import { heapSort, HEAP_SORT_CODE_LINES } from "./heapSort";
import { heapSortDebug } from "./heapSortDebug";
import { radixSortEvents, RADIX_SORT_CODE_LINES } from "./radixSort";
import { radixSortDebug } from "./radixSortDebug";
import { countingSort, COUNTING_SORT_CODE_LINES } from "./countingSort";
import { countingSortDebug } from "./countingSortDebug";

export const INSERTION_SORT_CODE_LINES = [
  { n: 0, code: "function insertionSort(arr) {" },
  { n: 1, code: "  const a = [...arr]" },
  { n: 2, code: "  for i = 1..n-1: key = A[i], j = i - 1" },
  { n: 3, code: "  while j >= 0 and A[j] > key:" },
  { n: 4, code: "    A[j+1] = A[j];  j--   ← shift right" },
  { n: 5, code: "  A[j+1] = key   ← insert key here" },
  { n: 6, code: "}" },
];

export const BUBBLE_SORT_CODE_LINES = [
  { n: 0, code: "function bubbleSort(arr) {" },
  { n: 1, code: "  const a = [...arr]" },
  { n: 2, code: "  for i = 0..n-2:  ← outer pass" },
  { n: 3, code: "  for j = 0..n-i-2: if A[j] > A[j+1]" },
  { n: 4, code: "    swap(A[j], A[j+1])" },
  { n: 5, code: "}" },
];

export const SELECTION_SORT_CODE_LINES = [
  { n: 0, code: "function selectionSort(arr) {" },
  { n: 1, code: "  const a = [...arr]" },
  { n: 2, code: "  for i = 0..n-2: minIdx = i" },
  { n: 3, code: "  for j = i+1..n-1: if A[j] < A[minIdx]" },
  { n: 4, code: "    minIdx = j" },
  { n: 5, code: "  swap(A[i], A[minIdx])" },
  { n: 6, code: "}" },
];

export const sortingDescriptors = [
  {
    id: "insertion-sort",
    name: "Insertion Sort",
    category: "sorting",
    color: "#0a84ff",
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
      paradigm: "Decrease & Conquer",
    },
    run: (arr) => insertionSort(arr),
    steps: (arr) => insertionSortSteps(arr),
    debug: (arr) => insertionSortDebug(arr),
    pseudocode: `InsertionSort(A, n):
  for i = 1 to n-1:
    key = A[i]
    j = i - 1
    while j >= 0 and A[j] > key:
      A[j+1] = A[j]
      j = j - 1
    A[j+1] = key`,
    codeLines: INSERTION_SORT_CODE_LINES,
  },
  {
    id: "bubble-sort",
    name: "Bubble Sort",
    category: "sorting",
    color: "#ff453a",
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
      paradigm: "Brute Force",
    },
    run: (arr) => bubbleSort(arr),
    steps: (arr) => bubbleSortSteps(arr),
    debug: (arr) => bubbleSortDebug(arr),
    pseudocode: `BubbleSort(A, n):
  for i = 0 to n-2:
    for j = 0 to n-i-2:
      if A[j] > A[j+1]:
        swap(A[j], A[j+1])`,
    codeLines: BUBBLE_SORT_CODE_LINES,
  },
  {
    id: "selection-sort",
    name: "Selection Sort",
    category: "sorting",
    color: "#c93400",
    complexity: {
      best: "O(n²)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
      paradigm: "Brute Force",
    },
    run: (arr) => selectionSort(arr),
    steps: (arr) => selectionSortSteps(arr),
    debug: (arr) => selectionSortDebug(arr),
    pseudocode: `SelectionSort(A, n):
  for i = 0 to n-2:
    minIdx = i
    for j = i+1 to n-1:
      if A[j] < A[minIdx]:
        minIdx = j
    swap(A[i], A[minIdx])`,
    codeLines: SELECTION_SORT_CODE_LINES,
  },
  {
    id: "merge-sort",
    name: "Merge Sort",
    category: "sorting",
    color: "#248a3d",
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n log n)",
      space: "O(n)",
      paradigm: "Divide & Conquer",
    },
    run: (arr) => mergeSort(arr),
    steps: null,
    debug: (arr) => mergeSortDebug(arr),
    pseudocode: `MergeSort(A, lo, hi):
  if lo < hi:
    mid = floor((lo + hi) / 2)
    MergeSort(A, lo, mid)
    MergeSort(A, mid+1, hi)
    Merge(A, lo, mid, hi)

Merge(A, lo, mid, hi):
  copy A[lo..mid] to L
  copy A[mid+1..hi] to R
  i=0, j=0, k=lo
  while i<|L| and j<|R|:
    if L[i] <= R[j]: A[k++] = L[i++]
    else: A[k++] = R[j++]
  copy remaining`,
    codeLines: MERGE_SORT_CODE_LINES,
  },
  {
    id: "heap-sort",
    name: "Heap Sort",
    category: "sorting",
    color: "#0e7490",
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n log n)",
      space: "O(1)",
      paradigm: "Heap / Selection",
    },
    run: (arr) => heapSort(arr),
    steps: (arr) => heapSortDebug(arr),
    debug: (arr) => heapSortDebug(arr),
    pseudocode: `HeapSort(array):
  n = length(array)

  build max heap:
    for i = parent(n-1) down to 0:
      siftDown(i, n)
      (siftDown compares the parent with its
       larger child and swaps while the child
       is bigger, within the heap boundary)

  for end = n-1 down to 1:
    swap array[0] ↔ array[end]   (extract max)
    heap boundary shrinks to end
    siftDown(0, end)

  ← array sorted`,
    codeLines: HEAP_SORT_CODE_LINES,
  },
  {
    id: "counting-sort",
    name: "Counting Sort",
    category: "sorting",
    color: "#9333ea",
    complexity: {
      best: "O(n + k)",
      average: "O(n + k)",
      worst: "O(n + k)",
      space: "O(n + k)",
      paradigm: "Non-comparison / Counting",
    },
    run: (arr) => countingSort(arr),
    steps: (arr) => countingSortDebug(arr),
    debug: (arr) => countingSortDebug(arr),
    pseudocode: `CountingSort(array):
  n = length(array)
  min = min(array);  max = max(array)
  range = max - min + 1
  count = [0] × range

  for i = 0 .. n-1:
    count[array[i] - min]++

  for ci = 1 .. range-1:
    count[ci] += count[ci-1]     (prefix sums)

  output = [0] × n
  for i = n-1 down to 0:         (stable placement)
    count[array[i] - min]--
    output[count[array[i] - min]] = array[i]

  return output   ← sorted (stable)`,
    codeLines: COUNTING_SORT_CODE_LINES,
  },
  {
    id: "radix-sort",
    name: "Radix Sort",
    category: "sorting",
    color: "#be185d",
    complexity: {
      best: "O(d(n + k))",
      average: "O(d(n + k))",
      worst: "O(d(n + k))",
      space: "O(n + k)",
      paradigm: "Non-comparison / Digit-by-digit",
    },
    run: (arr) => {
      const { sorted } = radixSortEvents(arr);
      return { sorted, comparisons: 0 };
    },
    steps: (arr) => radixSortDebug(arr),
    debug: (arr) => radixSortDebug(arr),
    pseudocode: `RadixSort(array):
  n = length(array)
  min = min(array)
  offset negatives by |min| so all ≥ 0
  max = max(offset array)
  totalPasses = number of decimal digits in max

  for pass = 0 .. totalPasses-1:
    place = 10^pass
    count[0..9] = 0

    for i = 0 .. n-1:
      digit = floor(offset[i] / place) % 10
      count[digit]++

    for d = 1 .. 9:
      count[d] += count[d-1]

    output = [0] × n
    for i = n-1 down to 0:
      digit = floor(offset[i] / place) % 10
      output[--count[digit]] = offset[i]

    copy output → offset array

  return offset array with offset subtracted  ← sorted`,
    codeLines: RADIX_SORT_CODE_LINES,
  },
  {
    id: "quick-sort",
    name: "Quick Sort",
    category: "sorting",
    color: "#8944ab",
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n²)",
      space: "O(log n)",
      paradigm: "Divide & Conquer",
    },
    run: (arr) => quickSort(arr),
    steps: null,
    debug: (arr) => quickSortDebug(arr),
    pseudocode: `QuickSort(A, lo, hi):
  if lo < hi:
    p = Partition(A, lo, hi)
    QuickSort(A, lo, p-1)
    QuickSort(A, p+1, hi)

Partition(A, lo, hi):
  pivot = A[hi]
  i = lo - 1
  for j = lo to hi-1:
    if A[j] <= pivot:
      i++
      swap(A[i], A[j])
  swap(A[i+1], A[hi])
  return i + 1`,
    codeLines: QUICK_SORT_CODE_LINES,
  },
];
```

---

## src/algorithms/sorting/sortingSteps.js

```js
/**
 * Projects sorting event sequences (Heap Sort today; Counting/Radix/
 * Shell/Bucket tomorrow where events map onto the vocabulary) into the
 * debugger snapshot schema:
 *
 *   { activeLine, log, vars, memory, callStack,
 *     arr, highlight, boundary, sortedFrom, phase }
 *
 * `arr`/`highlight` keep the snapshots directly consumable by the
 * array-bar visualizer; `boundary`/`sortedFrom` expose heap and sorted
 * regions for algorithms that have them (absent → no markers).
 *
 * Pure and deterministic: one event maps to exactly one snapshot.
 *
 * lineMap: { init, buildStart, compare, swap, buildComplete,
 *            extractMax, complete }
 */
export function projectSortingEvents(events, { lineMap, label = "heapSort" }) {
  let array = [];
  let countArray = null;
  let countIndex = null;
  let output = null;
  let currentPass = null;
  let totalPassesVal = null;
  let currentPlace = null;

  const steps = [];

  const snapshot = (event) => {
    const vars = {};
    const memory = {};
    const callStack = [`${label}(array)`];
    const indices = event.indices || [];
    const values = event.values || [];
    const phase = event.phase || null;
    const boundary = event.boundary ?? null;
    let complete = false;
    let highlight = [];
    let sortedFrom = phase === "extract" ? boundary : null;
    let log = "";

    switch (event.type) {
      case "init": {
        array = [...event.array];
        Object.assign(vars, { size: String(event.size) });
        Object.assign(memory, { array: `[${event.array.join(", ")}]` });
        callStack.push("  └ load array");
        log = `Load array [${event.array.join(", ")}]`;
        break;
      }
      case "build-start": {
        Object.assign(vars, {
          phase: "build max heap",
          boundary: String(event.boundary),
        });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push("  └ build max heap");
        log = "Build max heap — sift down from the last parent";
        break;
      }
      case "compare": {
        const [x, y] = indices;
        highlight = [x, y];
        Object.assign(vars, {
          [`a[${x}]`]: String(values[0]),
          [`a[${y}]`]: String(values[1]),
          phase: phase ?? "",
        });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push(`  └ compare a[${x}] vs a[${y}]`);
        log = `Compare a[${x}]=${values[0]} vs a[${y}]=${values[1]}`;
        break;
      }
      case "swap": {
        const [x, y] = indices;
        [array[x], array[y]] = [array[y], array[x]];
        highlight = [x, y];
        sortedFrom = event.sortedFrom ?? sortedFrom;
        Object.assign(vars, {
          [`a[${x}]`]: String(values[0]),
          [`a[${y}]`]: String(values[1]),
          phase: phase ?? "",
        });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push(`  └ swap a[${x}] ↔ a[${y}]`);
        log = `Swap a[${x}] ↔ a[${y}]`;
        break;
      }
      case "build-complete": {
        Object.assign(vars, {
          phase: "max heap built",
          boundary: String(event.boundary),
        });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push("  └ max heap built");
        log = "Max heap built — every parent ≥ its children";
        break;
      }
      case "extract-max": {
        const [x, y] = indices;
        highlight = [x, y];
        sortedFrom = event.boundary;
        Object.assign(vars, {
          "max value": String(event.value),
          "moved to index": String(y),
          boundary: String(event.boundary),
        });
        Object.assign(memory, {
          array: `[${array.join(", ")}]`,
          "sorted region": `${y}..${array.length - 1}`,
        });
        callStack.push(`  └ extract max ${event.value} → index ${y}`);
        log = `Extract max ${event.value} — swap root ↔ index ${y}, shrink heap`;
        break;
      }
      case "count-update": {
        countArray = [...event.countArray];
        countIndex = event.countIndex;
        highlight = [event.inputIndex];
        Object.assign(vars, {
          "input index": String(event.inputIndex),
          value: String(event.value),
          "count slot": String(event.countIndex),
          count: String(event.count),
        });
        Object.assign(memory, {
          "count array": `[${countArray.join(", ")}]`,
          array: `[${array.join(", ")}]`,
        });
        callStack.push(
          `  └ count a[${event.inputIndex}] → slot ${event.countIndex}`,
        );
        log = `Count a[${event.inputIndex}]=${event.value} → slot ${event.countIndex} (now ${event.count})`;
        break;
      }
      case "count-complete": {
        countArray = [...event.countArray];
        Object.assign(vars, { phase: "frequency counted" });
        Object.assign(memory, { "count array": `[${countArray.join(", ")}]` });
        callStack.push(`  └ frequency count complete`);
        log = `Frequency count complete: [${countArray.join(", ")}]`;
        break;
      }
      case "prefix-update": {
        countArray = [...event.countArray];
        countIndex = event.countIndex;
        Object.assign(vars, {
          "count slot": String(event.countIndex),
          cumulative: String(event.cumulative),
        });
        Object.assign(memory, { "count array": `[${countArray.join(", ")}]` });
        callStack.push(`  └ prefix sum slot ${event.countIndex}`);
        log = `Prefix sum: slot ${event.countIndex} → ${event.cumulative}`;
        break;
      }
      case "prefix-complete": {
        countArray = [...event.countArray];
        Object.assign(vars, { phase: "prefix sums ready" });
        Object.assign(memory, { "count array": `[${countArray.join(", ")}]` });
        callStack.push(`  └ prefix sums complete`);
        log = `Prefix sums ready — count array now holds output positions`;
        break;
      }
      case "place-element": {
        output = [...event.output];
        array = [...event.output];
        highlight = [event.outputIndex];
        Object.assign(vars, {
          "input index": String(event.inputIndex),
          value: String(event.value),
          "output index": String(event.outputIndex),
        });
        Object.assign(memory, {
          output: `[${event.output.map((v) => (v === null ? "·" : v)).join(", ")}]`,
        });
        callStack.push(
          `  └ place ${event.value} at output[${event.outputIndex}]`,
        );
        log = `Place ${event.value} at output[${event.outputIndex}]`;
        break;
      }
      case "digit-pass-start": {
        currentPass = event.pass;
        totalPassesVal = event.totalPasses;
        currentPlace = event.place;
        Object.assign(vars, {
          pass: `${event.pass} / ${event.totalPasses}`,
          place: String(event.place),
          phase: "counting by digit",
        });
        Object.assign(memory, {
          "count array": "[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]",
        });
        callStack.push(`  └ digit pass ${event.pass} (place ${event.place})`);
        log = `Digit pass ${event.pass} of ${event.totalPasses} — sorting by place ${event.place}`;
        break;
      }
      case "digit-pass-complete": {
        currentPass = event.pass;
        totalPassesVal = event.totalPasses;
        Object.assign(vars, {
          pass: `${event.pass} / ${event.totalPasses}`,
          phase: "pass complete",
        });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push(`  └ digit pass ${event.pass} done`);
        log = `Digit pass ${event.pass} complete — array re-ordered by place ${event.place}`;
        break;
      }
      case "complete": {
        complete = true;
        if (event.array) array = [...event.array];
        sortedFrom = event.sortedFrom ?? 0;
        Object.assign(vars, {
          comparisons: String(event.comparisons ?? 0),
          passes: event.passes !== undefined ? String(event.passes) : undefined,
        });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push("  └ sorted");
        log = `Done — ${array.length} elements sorted, ${event.comparisons ?? 0} comparisons`;
        break;
      }
      default:
        log = event.type;
    }

    steps.push({
      activeLine: lineMap[event.type] ?? lineMap.complete,
      log,
      vars,
      memory,
      callStack,
      arr: [...array],
      highlight: [...highlight],
      boundary,
      sortedFrom,
      phase,
      countArray: countArray ? [...countArray] : undefined,
      countIndex,
      output: output ? [...output] : undefined,
      pass:
        currentPass !== null && totalPassesVal !== null
          ? `${currentPass} / ${totalPassesVal}`
          : undefined,
      place: currentPlace,
      complete,
    });
  };

  for (const event of events) snapshot(event);
  return steps;
}
```

---

## src/algorithms/graphs/dijkstraDebug.js

```js
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
```

---

## src/algorithms/registry.js

```js
import { sortingDescriptors } from "./sorting/descriptors";
import { searchingDescriptors } from "./searching/descriptors";
import { graphDescriptors } from "./graphs/descriptors";

export const ALL_DESCRIPTORS = [
  ...sortingDescriptors,
  ...searchingDescriptors,
  ...graphDescriptors,
];

const BY_ID = new Map(ALL_DESCRIPTORS.map((d) => [d.id, d]));

export const DOMAINS = [
  {
    id: "sorting",
    label: "Sorting",
    subTabs: [
      "benchmark",
      "visualizer",
      "complexity",
      "pseudocode",
      "history",
      "report",
      "debugger",
      "ai",
    ],
  },
  {
    id: "searching",
    label: "String Matching",
    subTabs: [
      "benchmark",
      "complexity",
      "pseudocode",
      "history",
      "report",
      "debugger",
      "ai",
    ],
  },
  {
    id: "graphs",
    label: "Graphs",
    subTabs: ["debugger"],
  },
];

export function getDomain(id) {
  return DOMAINS.find((d) => d.id === id) || null;
}

export function getAlgorithm(id) {
  const d = BY_ID.get(id);
  if (!d) throw new Error(`Unknown algorithm id: ${id}`);
  return d;
}

const FALLBACK_COMPLEXITY = {
  best: "—",
  average: "—",
  worst: "—",
  space: "—",
  paradigm: "Unknown",
};

/**
 * Never throws. Returns null for unknown/stale IDs so render paths can
 * degrade gracefully instead of crashing on persisted state.
 */
export function getAlgorithmSafe(id) {
  return BY_ID.get(id) || null;
}

/** Safe descriptor for display contexts; falls back to a stub using the raw id. */
export function getAlgorithmForDisplay(id) {
  return (
    BY_ID.get(id) || {
      id,
      name: id,
      category: "unknown",
      color: "#94a3b8",
      complexity: FALLBACK_COMPLEXITY,
      run: null,
      steps: null,
      debug: null,
      pseudocode: null,
      codeLines: [],
    }
  );
}

export function getByCategory(category) {
  return ALL_DESCRIPTORS.filter((d) => d.category === category);
}

export function getBenchmarkable(category) {
  return getByCategory(category).filter((d) => typeof d.run === "function");
}

export function getWithSteps(category) {
  return getByCategory(category).filter((d) => typeof d.steps === "function");
}

export function getWithDebug(categories) {
  const cats = Array.isArray(categories) ? categories : [categories];
  return ALL_DESCRIPTORS.filter(
    (d) => cats.includes(d.category) && typeof d.debug === "function",
  );
}
```

---

## src/algorithms/contracts.test.js

```js
import { describe, expect, it } from "vitest";
import {
  ALL_DESCRIPTORS,
  getByCategory,
  getBenchmarkable,
  getWithDebug,
  getAlgorithm,
} from "./registry";
import { bfsDebug } from "./graphs/bfs";
import { dfsDebug } from "./graphs/dfs";

function isSortedAsc(a) {
  for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
  return true;
}

function randomArray(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    // || 0 normalizes the -0 that -Math.floor(0) produces; Vitest's toEqual
    // distinguishes -0 from 0, which made this fixture flaky.
    if (Math.random() < 0.2) out.push(-Math.floor(Math.random() * 50) || 0);
    else out.push(Math.floor(Math.random() * 100));
    if (out.length > 1 && Math.random() < 0.3) out[out.length - 1] = out[0];
  }
  return out;
}

describe("registry integrity", () => {
  it("exposes unique ids with required metadata", () => {
    const ids = new Set();
    for (const d of ALL_DESCRIPTORS) {
      expect(ids.has(d.id)).toBe(false);
      ids.add(d.id);
      expect(typeof d.name).toBe("string");
      expect(d.category).toMatch(/^(sorting|searching|graphs)$/);
      expect(typeof d.color).toBe("string");
      expect(d.complexity).toHaveProperty("worst");
      expect(Array.isArray(d.codeLines)).toBe(true);
      expect(d.codeLines.length).toBeGreaterThan(0);
      expect(typeof d.pseudocode).toBe("string");
    }
    expect(getBenchmarkable("sorting")).toHaveLength(8);
    expect(getBenchmarkable("searching")).toHaveLength(3);
    expect(getWithDebug(["sorting"])).toHaveLength(8);
  });

  it("getAlgorithm throws for unknown ids", () => {
    expect(() => getAlgorithm("nope-sort")).toThrow(/Unknown algorithm/);
  });
});

describe("run/steps/debug equivalence (sorting)", () => {
  const sorts = getByCategory("sorting");

  it.each(sorts.map((d) => [d.id, d]))(
    "%s: run, steps and debug agree with reference sort",
    (_id, d) => {
      const inputs = [
        [],
        [1],
        [2, 2, 2],
        [5, -1, 3, 3, 0, 12, -4],
        ...Array.from({ length: 8 }, () =>
          randomArray(Math.floor(Math.random() * 40) + 1),
        ),
      ];
      for (const arr of inputs) {
        const expected = [...arr].sort((a, b) => a - b);

        const runOut = d.run(arr);
        expect(runOut.sorted).toEqual(expected);
        expect(runOut.comparisons).toBeGreaterThanOrEqual(0);
        expect(arr).toEqual([...arr]);

        if (typeof d.steps === "function") {
          const steps = d.steps(arr);
          expect(steps.length).toBeGreaterThan(0);
          expect(steps[steps.length - 1].arr).toEqual(expected);
        }

        if (typeof d.debug === "function") {
          const dbg = d.debug(arr);
          expect(dbg.length).toBeGreaterThan(0);
          expect(dbg[dbg.length - 1].arr).toEqual(expected);
        }
      }
    },
  );
});

describe("debug snapshot invariants", () => {
  const debuggables = [
    ...getWithDebug("sorting"),
    ...getWithDebug("searching"),
  ];

  it.each(debuggables.map((d) => [d.id, d]))(
    "%s: snapshots stay within codeLines bounds and carry required fields",
    (_id, d) => {
      const maxLine = d.codeLines.length;
      const samples =
        d.category === "sorting"
          ? [d.debug([4, 1, 3])]
          : [
              d.debug("abcababc", "abc"),
              d.debug("aaaa", "aa"),
              d.debug("xyz", "qqq"),
            ];

      for (const steps of samples) {
        expect(steps.length).toBeGreaterThan(0);
        for (const s of steps) {
          expect(s.activeLine).toBeGreaterThanOrEqual(0);
          expect(s.activeLine).toBeLessThan(maxLine);
          expect(typeof s.log).toBe("string");
          expect(s.vars).toBeDefined();
          expect(s.memory).toBeDefined();
          expect(Array.isArray(s.callStack)).toBe(true);
        }
        expect(steps[steps.length - 1].log).toMatch(/Done|not found|Found!/i);
      }
    },
  );

  it("mergeSortDebug highlights real indices", () => {
    const steps = getAlgorithm("merge-sort").debug([5, 2, 9, 1]);
    const withHighlight = steps.filter((s) => s.highlight.length > 0);
    expect(withHighlight.length).toBeGreaterThan(0);
    for (const s of withHighlight) {
      for (const idx of s.highlight) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(s.arr.length);
      }
    }
  });

  it("quickSortDebug tracks recursion frames", () => {
    const steps = getAlgorithm("quick-sort").debug([7, 6, 5, 4, 3, 2, 1]);
    const framed = steps.filter((s) => s.callStack.length > 1);
    expect(framed.length).toBeGreaterThan(0);
  });

  it("binarySearch debug supports found and not-found targets", () => {
    const d = getAlgorithm("binary-search");
    const arr = [10, 3, 8, 1, 9];
    const foundSteps = d.debug(arr);
    const sorted = [...arr].sort((a, b) => a - b);
    const midValue = sorted[Math.floor(sorted.length / 2)];
    expect(foundSteps.some((s) => s.log.includes("Found"))).toBe(true);

    const missingTarget = Math.max(...sorted) + 1;
    const missingSteps = d.debug(arr, missingTarget);
    expect(missingSteps[missingSteps.length - 1].log).toMatch(/not found/i);
    expect(foundSteps.every((s) => isSortedAsc(s.arr))).toBe(true);
  });
});

describe("run/debug equivalence (string searching)", () => {
  const stringMatchers = getWithDebug("searching").filter(
    (d) => d.group === "string",
  );

  it.each(stringMatchers.map((d) => [d.id, d]))(
    "%s: final matchPositions equal run() matches",
    (_id, d) => {
      const cases = [
        ["algo xx algo yy algo", "algo"],
        ["aaaa", "aa"],
        ["aaaa", "aaa"],
        ["abcababcabcabc", "abc"],
        ["mississippi", "issip"],
        ["xyz", "abc"],
        ["a", "a"],
      ];
      for (const [text, pattern] of cases) {
        const expected = d.run(text, pattern).matches;
        const dbg = d.debug(text, pattern);
        expect(dbg[dbg.length - 1].matchPositions).toEqual(expected);
      }
    },
  );

  it.each(stringMatchers.map((d) => [d.id, d]))(
    "%s: handles overlapping matches identically",
    (_id, d) => {
      expect(d.run("aaaa", "aaa").matches).toEqual([0, 1]);
      expect(d.run("aaaaa", "aa").matches).toEqual([0, 1, 2, 3]);
    },
  );
});

describe("graph traversal debuggers", () => {
  const graph = {
    A: ["B", "D"],
    B: ["A", "C"],
    C: ["B"],
    D: ["A", "E"],
    E: ["D"],
  };

  it.each([
    ["dfs", dfsDebug],
    ["bfs", bfsDebug],
  ])("%s visits every reachable node exactly once", (_name, fn) => {
    const steps = fn(graph, "A");
    const last = steps[steps.length - 1];
    expect(last.visitOrder[0]).toBe("A");
    expect(new Set(last.visitOrder).size).toBe(last.visitOrder.length);
    expect(last.visitOrder.sort().join("")).toBe("ABCDE");
    expect(last.queue ?? []).toEqual([]);
  });
});
```

---

## Conventions

### File & Function Naming

- **Algorithm modules** live in `src/algorithms/{category}/` (e.g. `sorting/`, `searching/`, `graphs/`).
- **File names** use camelCase: `insertionSort.js`, `dijkstra.js`, `binarySearch.js`, `kmp.js`.
- **Exported functions** follow the pattern:
  - Benchmark runner: `camelSort(arr)` — returns `{ sorted, comparisons }` (sorting) or `{ matches, comparisons }` (searching).
  - Visualizer steps: `camelSortSteps(arr)` — returns an array of visualizer frames.
  - Debugger: `camelSortDebug(arr)` — returns an array of debugger snapshots.
  - For graphs: `dijkstraDebug(graph, start)` or `bfsDebug(graph, start)` — returns debugger snapshots.
  - Event emitters: `camelSortEvents(arr)` — returns `{ sorted, comparisons, events }` (used by Heap, Counting, Radix sorts and all engine-based graph algorithms).
- **Code line arrays** are named `UPPER_SNAKE_CASE` constants: `INSERTION_SORT_CODE_LINES`, `HEAP_SORT_CODE_LINES`, `DIJKSTRA_CODE_LINES`.
- **Line maps** (for event→line projection) are named `UPPER_SNAKE_CASE`: `DIJKSTRA_LINE_MAP`, `BELLMAN_FORD_LINE_MAP`.
- **Descriptor arrays** are named by category in camelCase: `sortingDescriptors`, `searchingDescriptors`, `graphDescriptors`.
- **Barrel files** (`index.js`) re-export all algorithm functions for a category.

### Descriptor Object Shape

Every descriptor is a plain object with these fields:

**Required fields (enforced by `contracts.test.js`):**

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique kebab-case identifier (e.g. `"insertion-sort"`, `"kmp"`, `"dijkstra"`). Must be unique across all descriptors. |
| `name` | `string` | Human-readable display name (e.g. `"Insertion Sort"`). |
| `category` | `"sorting" \| "searching" \| "graphs"` | Which domain this algorithm belongs to. |
| `color` | `string` | Hex color code for chart/UI rendering (e.g. `"#0a84ff"`). |
| `complexity` | `object` | Must contain `worst` (the only checked field). Typically `{ best, average, worst, space, paradigm }`. |
| `codeLines` | `Array<{ n: number, code: string }>` | Non-empty array of source lines shown by the debugger. `n` is the 0-indexed line number; `code` is the display text. |
| `pseudocode` | `string` | Readable pseudocode text for the algorithm. |

**Optional fields:**

| Field | Type | Description |
|---|---|---|
| `run` | `(input) => result` | Benchmark implementation. Sorting returns `{ sorted, comparisons }`. String matching returns `{ matches, comparisons }`. If `null`/omitted, the algorithm is not benchmarkable. |
| `steps` | `(input) => frames[]` | Visualizer frame generator. If `null`/omitted, the algorithm has no visualizer (e.g. Merge Sort, Quick Sort). |
| `debug` | `(input) => snapshots[]` | Debugger snapshot generator. If `null`/omitted, the algorithm has no debugger. **Must be present** for an algorithm to appear in `contracts.test.js`'s invariants. |
| `group` | `string` | Sub-grouping within a category (e.g. `"string"` for string matchers vs `"array"` for Binary Search). Affects which algorithms are tested for string-matching contracts. |

### Steps/Debug Snapshot Structure

**Visualizer frames** (from `steps` functions) are consumed by `VisualizerTab`. The frame shape varies but typically includes:
- `arr: number[]` — the current array state
- `highlight: number[]` — indices to visually highlight (comparisons, swaps, etc.)
- `boundary: number | null` — heap boundary for heap sort (optional)
- `sortedFrom: number | null` — start of sorted region (optional)
- `phase: string | null` — current phase label (optional)

**Debugger snapshots** (from `debug` functions) have a stricter schema enforced by `contracts.test.js`:

| Field | Type | Description |
|---|---|---|
| `activeLine` | `number` | 0-indexed line number into `codeLines`. Must be `>= 0` and `< codeLines.length`. |
| `log` | `string` | Human-readable log message for the step. Last snapshot must match `/Done\|not found\|Found!/i`. |
| `vars` | `object` | Named variables for the current step (e.g. `{ lo: "0", mid: "3", i: "1" }`). |
| `memory` | `object` | Memory/state view (e.g. `{ arr: "[5, 2, 9, 1]" }`). |
| `callStack` | `string[]` | Call stack frames (e.g. `["mergeSort(arr)", "  └ sort(lo=0, hi=3)"]`). |

**Graph debugger snapshots** additionally include domain-specific fields like `visited`, `queue`, `heap`, `distances`, `previous`, `matrix`, `frontier`, `mstEdges`, `visitOrder`, etc.

**Sorting debugger snapshots** additionally include:
- `arr: number[]` — current array state
- `highlight: number[]` — indices to highlight

**String-matching debugger snapshots** additionally include:
- `text: string`, `pattern: string` — the input
- `highlightText: number[]`, `highlightPat: number[]` — character-level highlights
- `matchPositions: number[]` — found match positions (must equal `run()` output)
- `lpsTable: number[] | null` — for KMP
- `shiftTable: number[] | null` — for Horspool

### How to Register a New Algorithm

1. **Create the algorithm module** in the appropriate `src/algorithms/{category}/` directory (e.g. `sorting/shellSort.js`). Export the benchmark function, optional steps function, and debug function.

2. **Create a descriptor** in the category's `descriptors.js` file (e.g. `src/algorithms/sorting/descriptors.js`). Add a new object to the `sortingDescriptors` array with all required fields.

3. **The descriptor is automatically picked up** by `src/algorithms/registry.js` because it spreads all category descriptor arrays into `ALL_DESCRIPTORS`:
   ```js
   export const ALL_DESCRIPTORS = [
     ...sortingDescriptors,
     ...searchingDescriptors,
     ...graphDescriptors,
   ];
   ```

4. **No other files need to change.** The registry provides lookup functions (`getAlgorithm`, `getAlgorithmSafe`, `getBenchmarkable`, `getWithSteps`, `getWithDebug`) that dynamically filter by the descriptor's fields. The benchmark engine, visualizer, debugger, complexity tab, and pseudocode tab all read from the registry — not from hardcoded lists.

5. **For graph algorithms** that use the event→projector pattern: implement the algorithm to emit events via `createEventCollector`, create a debug file that calls the algorithm and pipes events through the appropriate projector (`projectPathfindingEvents`, `projectMstEvents`, etc.), and define a `LINE_MAP` for event→line mapping.

---

## Contracts

`contracts.test.js` validates the following minimum requirements for every algorithm descriptor. A new algorithm **must** satisfy all of these to pass the test suite.

### 1. Registry Integrity (all descriptors)

- **Unique IDs:** Every descriptor's `id` must be unique across all categories.
- **Required metadata present:**
  - `name` must be a string.
  - `category` must be one of `"sorting"`, `"searching"`, or `"graphs"`.
  - `color` must be a string.
  - `complexity` must exist and have a `worst` property.
  - `codeLines` must be a non-empty array.
  - `pseudocode` must be a string.
- **Expected counts are pinned:**
  - `getBenchmarkable("sorting")` must return exactly 8 descriptors.
  - `getBenchmarkable("searching")` must return exactly 3 descriptors.
  - `getWithDebug(["sorting"])` must return exactly 8 descriptors.
- **Unknown IDs throw:** `getAlgorithm("nonexistent")` must throw an error matching `/Unknown algorithm/`.

### 2. Sorting Algorithm Equivalence

Every sorting descriptor's `run()`, `steps()` (if present), and `debug()` must agree on the sorted output:
- `run(arr).sorted` must equal `[...arr].sort((a, b) => a - b)`.
- `run(arr).comparisons` must be `>= 0`.
- The input array must not be mutated (defensive copy).
- `steps(arr)` must return a non-empty array; the **last frame's `arr`** must equal the sorted array.
- `debug(arr)` must return a non-empty array; the **last snapshot's `arr`** must equal the sorted array.
- Tested with: empty array, single element, all duplicates, mixed values, and 8 random arrays (up to length 40 with negatives and duplicates).

### 3. Debug Snapshot Invariants

For every debuggable sorting and searching algorithm:
- **`activeLine` bounds:** Every snapshot's `activeLine` must be `>= 0` and `< codeLines.length`.
- **Required fields present:** Every snapshot must have `log` (string), `vars` (defined), `memory` (defined), and `callStack` (array).
- **Terminal log:** The **last** snapshot's `log` must match `/Done|not found|Found!/i`.
- Sorting is tested with `[4, 1, 3]`. String matchers are tested with three inputs including a no-match case.

### 4. Merge Sort Highlight Validity

All highlight indices in merge sort debug snapshots must be valid array indices (`>= 0` and `< arr.length`).

### 5. Quick Sort Recursion Tracking

Quick sort debug must produce at least one snapshot where `callStack.length > 1`, confirming recursion frames are tracked.

### 6. Binary Search Found/Not-Found

Binary search debug must:
- Return a snapshot with `"Found"` in the log when a target exists.
- Return `"not found"` in the log's last snapshot when the target doesn't exist.
- All snapshots must have a sorted array (`isSortedAsc`).

### 7. String Matching Run/Debug Equivalence

For every string-matching descriptor with `group === "string"`:
- `debug(text, pattern)` must return a non-empty array.
- The **last snapshot's `matchPositions`** must exactly equal `run(text, pattern).matches`.
- Overlapping matches must work correctly: `"aaaa"` with `"aaa"` → `[0, 1]`; `"aaaaa"` with `"aa"` → `[0, 1, 2, 3]`.
- Seven test cases cover: simple, duplicates, overlapping, partial, no-match, and single-character.

### 8. Graph Traversal (DFS/BFS) Correctness

DFS and BFS debuggers must:
- Visit every reachable node exactly once (no duplicates in `visitOrder`).
- Visit the specified start node first.
- Visit all nodes alphabetically when starting from `"A"` on the test graph.
- Clear the queue/stack by the final snapshot.
- Tested with: `{ A: ["B","D"], B: ["A","C"], C: ["B"], D: ["A","E"], E: ["D"] }`.
