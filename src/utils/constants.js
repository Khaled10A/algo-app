import {
  insertionSort, insertionSortSteps,
  mergeSort,
  quickSort,
  selectionSort, selectionSortSteps,
  bubbleSort, bubbleSortSteps,
} from '../algorithms/sorting';
import { bruteForceSearch, horspoolSearch, kmpSearch } from '../algorithms/searching';

export const SORT_ALGOS = {
  "Insertion Sort": insertionSort,
  "Merge Sort": mergeSort,
  "Quick Sort": quickSort,
  "Selection Sort": selectionSort,
  "Bubble Sort": bubbleSort,
};

export const SORT_STEPS = {
  "Insertion Sort": insertionSortSteps,
  "Bubble Sort": bubbleSortSteps,
  "Selection Sort": selectionSortSteps,
};

export const SEARCH_ALGOS = {
  "Brute Force": bruteForceSearch,
  "Horspool": horspoolSearch,
  "KMP": kmpSearch,
};

export const INPUT_TYPES = ["random", "sorted", "reverse", "nearly"];

export const INPUT_LABELS = {
  random: "Random",
  sorted: "Already Sorted",
  reverse: "Reverse Sorted",
  nearly: "Nearly Sorted",
};

export const TEXT_SCENARIOS = ["start", "end", "multiple", "nomatch"];

export const SCENARIO_LABELS = {
  start: "Found at Start",
  end: "Found at End",
  multiple: "Multiple Matches",
  nomatch: "No Match",
};

export const COLORS = ["#38bdf8", "#f472b6", "#4ade80", "#fb923c", "#a78bfa", "#fbbf24"];

export const COMPLEXITY = {
  "Insertion Sort": { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)", paradigm: "Decrease & Conquer" },
  "Merge Sort":     { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", paradigm: "Divide & Conquer" },
  "Quick Sort":     { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)", paradigm: "Divide & Conquer" },
  "Selection Sort": { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)", paradigm: "Brute Force" },
  "Bubble Sort":    { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)", paradigm: "Brute Force" },
  "Brute Force":    { best: "O(n)", average: "O(n×m)", worst: "O(n×m)", space: "O(1)", paradigm: "Brute Force" },
  "Horspool":       { best: "O(n/m)", average: "O(n/m)", worst: "O(n×m)", space: "O(σ)", paradigm: "Transform & Conquer" },
  "KMP":            { best: "O(n)", average: "O(n+m)", worst: "O(n+m)", space: "O(m)", paradigm: "Dynamic Programming" },
};

export const PSEUDOCODE = {
  "Insertion Sort": `InsertionSort(A, n):
  for i = 1 to n-1:
    key = A[i]
    j = i - 1
    while j >= 0 and A[j] > key:
      A[j+1] = A[j]
      j = j - 1
    A[j+1] = key`,
  "Merge Sort": `MergeSort(A, lo, hi):
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
  "Quick Sort": `QuickSort(A, lo, hi):
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
  "Selection Sort": `SelectionSort(A, n):
  for i = 0 to n-2:
    minIdx = i
    for j = i+1 to n-1:
      if A[j] < A[minIdx]:
        minIdx = j
    swap(A[i], A[minIdx])`,
  "Bubble Sort": `BubbleSort(A, n):
  for i = 0 to n-2:
    for j = 0 to n-i-2:
      if A[j] > A[j+1]:
        swap(A[j], A[j+1])`,
  "Brute Force": `BruteForce(text, pattern):
  n = length(text)
  m = length(pattern)
  for i = 0 to n-m:
    j = 0
    while j < m and text[i+j] == pattern[j]:
      j = j + 1
    if j == m:
      report match at position i`,
  "Horspool": `BuildShiftTable(pattern, m):
  for each char c: table[c] = m
  for i = 0 to m-2: table[pattern[i]] = m-1-i

Horspool(text, pattern):
  build ShiftTable
  i = m - 1
  while i < n:
    k = 0
    while k<m and text[i-k]==pattern[m-1-k]:
      k = k + 1
    if k == m: report match at i-m+1
    i = i + ShiftTable[text[i]]`,
  "KMP": `BuildLPS(pattern, m):
  lps[0] = 0, len = 0, i = 1
  while i < m:
    if pattern[i] == pattern[len]: lps[i++] = ++len
    elif len: len = lps[len-1]
    else: lps[i++] = 0

KMP(text, pattern):
  build LPS array
  i = 0, j = 0
  while i < n:
    if text[i] == pattern[j]: i++, j++
    if j == m: report match, j = lps[j-1]
    elif text[i] != pattern[j]:
      if j: j = lps[j-1]
      else: i++`,
};

export const TH = {
  padding: "8px 12px", textAlign: "left", fontSize: 10, letterSpacing: 1,
  color: "#475569", borderBottom: "1px solid #1e293b", fontWeight: "bold",
};

export const TD = {
  padding: "7px 12px", borderBottom: "1px solid #0f172a", color: "#94a3b8", fontSize: 11,
};

export const btnBase = {
  background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6,
  color: "#94a3b8", fontSize: 11, cursor: "pointer", padding: "6px 12px", fontFamily: "monospace",
};
