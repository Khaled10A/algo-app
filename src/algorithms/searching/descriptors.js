import { bruteForceSearch } from './bruteForce';
import { horspoolSearch } from './horspool';
import { kmpSearch } from './kmp';
import { bruteForceDebug } from './bruteForceDebug';
import { horspoolDebug } from './horspoolDebug';
import { kmpDebug } from './kmpDebug';
import { binarySearchDebug } from './binarySearch';

export const BRUTE_FORCE_CODE_LINES = [
  { n: 0, code: "function bruteForceSearch(text, pattern) {" },
  { n: 1, code: "  n = |text|; m = |pattern|; matches = []" },
  { n: 2, code: "  for (i = 0; i <= n-m; i++)  ← window at i" },
  { n: 3, code: "    j = 0; while text[i+j]==pattern[j]: j++" },
  { n: 4, code: "    mismatch → break inner loop, slide window" },
  { n: 5, code: "    if (j === m) matches.push(i)" },
  { n: 6, code: "}" },
];

export const HORSPOOL_CODE_LINES = [
  { n: 0, code: "function horspoolSearch(text, pattern) {" },
  { n: 1, code: "  for i in 0..m-2: shift[pattern[i]] = m-1-i" },
  { n: 2, code: "  default shift for unknown chars = m" },
  { n: 3, code: "  i = m - 1   ← window right end" },
  { n: 4, code: "  while (i < n):" },
  { n: 5, code: "    compare right→left: text[i-k] vs pattern[m-1-k]" },
  { n: 6, code: "    if k === m → match at i-m+1" },
  { n: 7, code: "    i += shift[text[i]] ?? m" },
  { n: 8, code: "}" },
];

export const KMP_CODE_LINES = [
  { n: 0,  code: "function kmpSearch(text, pattern) {" },
  { n: 1,  code: "  Phase 1 — build LPS: pi=1, len=0" },
  { n: 2,  code: "    if pattern[pi]==pattern[len]: lps[pi++]=++len" },
  { n: 3,  code: "    elif len > 0: len = lps[len-1]" },
  { n: 4,  code: "    else: lps[pi++] = 0" },
  { n: 5,  code: "  LPS table ready" },
  { n: 6,  code: "  Phase 2 — search: i=0, j=0" },
  { n: 7,  code: "  while (i < n): compare text[i] vs pattern[j]" },
  { n: 8,  code: "    match → i++, j++" },
  { n: 9,  code: "    if j == m: report match at i-j; j = lps[j-1]" },
  { n: 10, code: "    elif mismatch & j > 0: j = lps[j-1]" },
  { n: 11, code: "    else: i++" },
  { n: 12, code: "}" },
];

export const BINARY_SEARCH_CODE_LINES = [
  { n: 0, code: "function binarySearch(arr, target) {" },
  { n: 1, code: "  lo = 0, hi = arr.length - 1   (arr sorted first)" },
  { n: 2, code: "  mid = floor((lo + hi) / 2)" },
  { n: 3, code: "  if A[mid] == target → found at mid" },
  { n: 4, code: "  elif A[mid] < target → search RIGHT half" },
  { n: 5, code: "    lo = mid + 1" },
  { n: 6, code: "  else → search LEFT half" },
  { n: 7, code: "    hi = mid - 1" },
  { n: 8, code: "  loop ended → not found" },
];

export const searchingDescriptors = [
  {
    id: "brute-force",
    name: "Brute Force",
    category: "searching",
    group: "string",
    color: "#a78bfa",
    complexity: {
      best: "O(n)",
      average: "O(n×m)",
      worst: "O(n×m)",
      space: "O(1)",
      paradigm: "Brute Force",
    },
    run: (text, pattern) => bruteForceSearch(text, pattern),
    steps: null,
    debug: (text, pattern) => bruteForceDebug(text, pattern),
    pseudocode: `BruteForce(text, pattern):
  n = length(text)
  m = length(pattern)
  for i = 0 to n-m:
    j = 0
    while j < m and text[i+j] == pattern[j]:
      j = j + 1
    if j == m:
      report match at position i`,
    codeLines: BRUTE_FORCE_CODE_LINES,
  },
  {
    id: "horspool",
    name: "Horspool",
    category: "searching",
    group: "string",
    color: "#fbbf24",
    complexity: {
      best: "O(n/m)",
      average: "O(n/m)",
      worst: "O(n×m)",
      space: "O(σ)",
      paradigm: "Transform & Conquer",
    },
    run: (text, pattern) => horspoolSearch(text, pattern),
    steps: null,
    debug: (text, pattern) => horspoolDebug(text, pattern),
    pseudocode: `BuildShiftTable(pattern, m):
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
    codeLines: HORSPOOL_CODE_LINES,
  },
  {
    id: "kmp",
    name: "KMP",
    category: "searching",
    group: "string",
    color: "#34d399",
    complexity: {
      best: "O(n)",
      average: "O(n+m)",
      worst: "O(n+m)",
      space: "O(m)",
      paradigm: "Dynamic Programming",
    },
    run: (text, pattern) => kmpSearch(text, pattern),
    steps: null,
    debug: (text, pattern) => kmpDebug(text, pattern),
    pseudocode: `BuildLPS(pattern, m):
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
    codeLines: KMP_CODE_LINES,
  },
  {
    id: "binary-search",
    name: "Binary Search",
    category: "searching",
    group: "array",
    color: "#38bdf8",
    complexity: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)",
      space: "O(1)",
      paradigm: "Decrease & Conquer",
    },
    run: null,
    steps: null,
    debug: (arr, target) => binarySearchDebug(arr, target),
    pseudocode: `BinarySearch(A, target):
  lo = 0, hi = n - 1        (A must be sorted)
  while lo <= hi:
    mid = floor((lo + hi) / 2)
    if A[mid] == target: return mid
    elif A[mid] < target: lo = mid + 1
    else: hi = mid - 1
  return not found`,
    codeLines: BINARY_SEARCH_CODE_LINES,
  },
];
