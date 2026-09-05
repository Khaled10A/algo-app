import { fibonacciMemoDebug } from "./fibonacciMemoDebug";
import { fibonacciTabDebug } from "./fibonacciTabDebug";
import { knapsackDebug } from "./knapsackDebug";
import { lcsDebug } from "./lcsDebug";
import { lisDebug } from "./lisDebug";
import { editDistanceDebug } from "./editDistanceDebug";
import { matrixChainDebug } from "./matrixChainDebug";

// ─── Code Lines ──────────────────────────────────────────────

export const FIBONACCI_MEMO_CODE_LINES = [
  { n: 0, code: "function fib(n, memo) {" },
  { n: 1, code: "  if n <= 1: return n" },
  { n: 2, code: "  if memo[n] exists: return memo[n]" },
  { n: 3, code: "  memo[n] = fib(n-1) + fib(n-2)" },
  { n: 4, code: "  return memo[n]" },
];

export const FIBONACCI_TAB_CODE_LINES = [
  { n: 0, code: "function fib(n) {" },
  { n: 1, code: "  dp[0] = 0;  dp[1] = 1" },
  { n: 2, code: "  for i = 2 .. n:" },
  { n: 3, code: "    dp[i] = dp[i-1] + dp[i-2]" },
  { n: 4, code: "  return dp[n]" },
];

export const KNAPSACK_CODE_LINES = [
  { n: 0, code: "function knapsack(weights, values, W) {" },
  { n: 1, code: "  dp[i][w] = 0  for all i, w" },
  { n: 2, code: "  for i = 1 .. n:" },
  { n: 3, code: "    for w = 0 .. W:" },
  { n: 4, code: "      if weights[i-1] <= w:" },
  { n: 5, code: "        dp[i][w] = max(dp[i-1][w]," },
  { n: 6, code: "                     dp[i-1][w-wt] + val)" },
  { n: 7, code: "      else: dp[i][w] = dp[i-1][w]" },
  { n: 8, code: "  return dp[n][W]" },
];

export const LCS_CODE_LINES = [
  { n: 0, code: "function lcs(s1, s2) {" },
  { n: 1, code: "  dp[i][j] = 0  for all i, j" },
  { n: 2, code: "  for i = 1 .. m:" },
  { n: 3, code: "    for j = 1 .. n:" },
  { n: 4, code: "      if s1[i-1] == s2[j-1]:" },
  { n: 5, code: "        dp[i][j] = dp[i-1][j-1] + 1" },
  { n: 6, code: "      else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])" },
  { n: 7, code: "  return dp[m][n]" },
];

export const LIS_CODE_LINES = [
  { n: 0, code: "function lis(arr) {" },
  { n: 1, code: "  dp[i] = 1  for all i" },
  { n: 2, code: "  for i = 1 .. n-1:" },
  { n: 3, code: "    for j = 0 .. i-1:" },
  { n: 4, code: "      if arr[j] < arr[i] and dp[j]+1 > dp[i]:" },
  { n: 5, code: "        dp[i] = dp[j] + 1" },
  { n: 6, code: "  return max(dp)" },
];

export const MATRIX_CHAIN_CODE_LINES = [
  { n: 0, code: "function matrixChain(dims) {" },
  { n: 1, code: "  dp[i][j] = 0  for i == j" },
  { n: 2, code: "  for len = 2 .. n:" },
  { n: 3, code: "    for i = 0 .. n-len:" },
  { n: 4, code: "      j = i + len - 1" },
  { n: 5, code: "      dp[i][j] = ∞" },
  { n: 6, code: "      for k = i .. j-1:" },
  { n: 7, code: "        cost = dp[i][k]+dp[k+1][j]+dims[i]*dims[k+1]*dims[j+1]" },
  { n: 8, code: "        dp[i][j] = min(dp[i][j], cost)" },
  { n: 9, code: "  return dp[0][n-1]" },
];

export const EDIT_DISTANCE_CODE_LINES = [
  { n: 0, code: "function editDistance(s1, s2) {" },
  { n: 1, code: "  dp[i][j] = i+j  (base: insert/delete)" },
  { n: 2, code: "  for i = 1 .. m:" },
  { n: 3, code: "    for j = 1 .. n:" },
  { n: 4, code: "      if s1[i-1] == s2[j-1]:" },
  { n: 5, code: "        dp[i][j] = dp[i-1][j-1]" },
  { n: 6, code: "      else: dp[i][j] = 1 + min(" },
  { n: 7, code: "        dp[i-1][j],   dp[i][j-1],   dp[i-1][j-1])" },
  { n: 8, code: "  return dp[m][n]" },
];

// ─── Descriptors ─────────────────────────────────────────────

export const dpDescriptors = [
  {
    id: "fibonacci-memo",
    name: "Fibonacci (Memoization)",
    category: "dynamicProgramming",
    color: "#bf5af2",
    group: "dp",
    complexity: {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(n)",
      paradigm: "Dynamic Programming / Top-Down",
    },
    run: null,
    steps: null,
    debug: (n) => fibonacciMemoDebug(n),
    pseudocode: `Fib(n, memo):
  if n <= 1: return n
  if memo[n] exists: return memo[n]
  memo[n] = Fib(n-1, memo) + Fib(n-2, memo)
  return memo[n]`,
    codeLines: FIBONACCI_MEMO_CODE_LINES,
  },
  {
    id: "fibonacci-tab",
    name: "Fibonacci (Tabulation)",
    category: "dynamicProgramming",
    color: "#8944ab",
    group: "dp",
    complexity: {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(n)",
      paradigm: "Dynamic Programming / Bottom-Up",
    },
    run: null,
    steps: null,
    debug: (n) => fibonacciTabDebug(n),
    pseudocode: `Fib(n):
  dp[0] = 0
  dp[1] = 1
  for i = 2 to n:
    dp[i] = dp[i-1] + dp[i-2]
  return dp[n]`,
    codeLines: FIBONACCI_TAB_CODE_LINES,
  },
  {
    id: "knapsack",
    name: "0/1 Knapsack",
    category: "dynamicProgramming",
    color: "#0e7490",
    group: "dp",
    complexity: {
      best: "O(n·W)",
      average: "O(n·W)",
      worst: "O(n·W)",
      space: "O(n·W)",
      paradigm: "Dynamic Programming / Bottom-Up",
    },
    run: null,
    steps: null,
    debug: (weights, values, capacity) => knapsackDebug(weights, values, capacity),
    pseudocode: `Knapsack(weights, values, W):
  dp[i][w] = 0  for all i, w
  for i = 1 to n:
    for w = 0 to W:
      if weights[i-1] <= w:
        dp[i][w] = max(dp[i-1][w],
                       dp[i-1][w-weights[i-1]] + values[i-1])
      else:
        dp[i][w] = dp[i-1][w]
  return dp[n][W]`,
    codeLines: KNAPSACK_CODE_LINES,
  },
  {
    id: "lcs",
    name: "Longest Common Subsequence",
    category: "dynamicProgramming",
    color: "#30d158",
    group: "dp",
    complexity: {
      best: "O(m·n)",
      average: "O(m·n)",
      worst: "O(m·n)",
      space: "O(m·n)",
      paradigm: "Dynamic Programming / Bottom-Up",
    },
    run: null,
    steps: null,
    debug: (a, b) => lcsDebug(a, b),
    pseudocode: `LCS(s1, s2):
  dp[i][j] = 0  for all i, j
  for i = 1 to m:
    for j = 1 to n:
      if s1[i-1] == s2[j-1]:
        dp[i][j] = dp[i-1][j-1] + 1
      else:
        dp[i][j] = max(dp[i-1][j], dp[i][j-1])
  return dp[m][n]`,
    codeLines: LCS_CODE_LINES,
  },
  {
    id: "lis",
    name: "Longest Increasing Subsequence",
    category: "dynamicProgramming",
    color: "#0a84ff",
    group: "dp",
    complexity: {
      best: "O(n²)",
      average: "O(n²)",
      worst: "O(n²)",
      space: "O(n)",
      paradigm: "Dynamic Programming / Bottom-Up",
    },
    run: null,
    steps: null,
    debug: (arr) => lisDebug(arr),
    pseudocode: `LIS(arr):
  dp[i] = 1  for all i
  for i = 1 to n-1:
    for j = 0 to i-1:
      if arr[j] < arr[i] and dp[j]+1 > dp[i]:
        dp[i] = dp[j] + 1
  return max(dp)`,
    codeLines: LIS_CODE_LINES,
  },
  {
    id: "matrix-chain",
    name: "Matrix Chain Multiplication",
    category: "dynamicProgramming",
    color: "#ff9f0a",
    group: "dp",
    complexity: {
      best: "O(n³)",
      average: "O(n³)",
      worst: "O(n³)",
      space: "O(n²)",
      paradigm: "Dynamic Programming / Bottom-Up",
    },
    run: null,
    steps: null,
    debug: (dims) => matrixChainDebug(dims),
    pseudocode: `MatrixChain(dims):
  n = length(dims) - 1
  dp[i][j] = 0  for all i == j
  for len = 2 to n:
    for i = 0 to n-len:
      j = i + len - 1
      dp[i][j] = ∞
      for k = i to j-1:
        cost = dp[i][k] + dp[k+1][j]
               + dims[i] * dims[k+1] * dims[j+1]
        dp[i][j] = min(dp[i][j], cost)
  return dp[0][n-1]`,
    codeLines: MATRIX_CHAIN_CODE_LINES,
  },
  {
    id: "edit-distance",
    name: "Edit Distance",
    category: "dynamicProgramming",
    color: "#ff375f",
    group: "dp",
    complexity: {
      best: "O(m·n)",
      average: "O(m·n)",
      worst: "O(m·n)",
      space: "O(m·n)",
      paradigm: "Dynamic Programming / Bottom-Up",
    },
    run: null,
    steps: null,
    debug: (source, target) => editDistanceDebug(source, target),
    pseudocode: `EditDistance(s1, s2):
  dp[i][j] = i + j  (base case)
  for i = 1 to m:
    for j = 1 to n:
      if s1[i-1] == s2[j-1]:
        dp[i][j] = dp[i-1][j-1]
      else:
        dp[i][j] = 1 + min(
          dp[i-1][j],    (delete)
          dp[i][j-1],    (insert)
          dp[i-1][j-1])  (replace)
  return dp[m][n]`,
    codeLines: EDIT_DISTANCE_CODE_LINES,
  },
];
