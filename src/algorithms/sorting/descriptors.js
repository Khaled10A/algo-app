import { insertionSort, insertionSortSteps, insertionSortDebug } from './insertionSort';
import { bubbleSort, bubbleSortSteps, bubbleSortDebug } from './bubbleSort';
import { selectionSort, selectionSortSteps, selectionSortDebug } from './selectionSort';
import { mergeSort, mergeSortDebug, MERGE_SORT_CODE_LINES } from './mergeSort';
import { quickSort, quickSortDebug, QUICK_SORT_CODE_LINES } from './quickSort';
import { heapSort, HEAP_SORT_CODE_LINES } from './heapSort';
import { heapSortDebug } from './heapSortDebug';
import { countingSort, countingSortEvents, COUNTING_SORT_CODE_LINES } from './countingSort';
import { countingSortDebug } from './countingSortDebug';

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
