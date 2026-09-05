import { nQueensDebug } from "./nQueensDebug";
import { subsetSumDebug } from "./subsetSumDebug";
import { permutationsDebug } from "./permutationsDebug";
import { combinationsDebug } from "./combinationsDebug";
import { sudokuDebug } from "./sudokuDebug";

/**
 * Backtracking algorithm descriptors.
 *
 * Each descriptor follows the same contract as DP/sorting/graph descriptors:
 *   { id, name, category, color, group, complexity, run, steps, debug,
 *     pseudocode, codeLines }
 */

// ─── Code Lines ──────────────────────────────────────────────

export const NQUEENS_CODE_LINES = [
  { n: 0, code: "function nQueens(n) {" },
  { n: 1, code: "  if row == n: record solution" },
  { n: 2, code: "  for col = 0 .. n-1:" },
  { n: 3, code: "    if isSafe(row, col):" },
  { n: 4, code: "      placeQueen(row, col)" },
  { n: 5, code: "      nQueens(row + 1)" },
  { n: 6, code: "      removeQueen(row, col)" },
  { n: 7, code: "  return solutions" },
];

// ─── Descriptors ─────────────────────────────────────────────

export const SUBSETSUM_CODE_LINES = [
  { n: 0, code: "function subsetSum(arr, target) {" },
  { n: 1, code: "  if index == n:" },
  { n: 2, code: "    if sum == target: record(subset)" },
  { n: 3, code: "    return" },
  { n: 4, code: "  // include arr[index]" },
  { n: 5, code: "  subset.add(arr[index]); sum += arr[index]" },
  { n: 6, code: "  subsetSum(arr, target, index+1)" },
  { n: 7, code: "  subset.remove(arr[index]); sum -= arr[index]" },
  { n: 8, code: "  // exclude arr[index]" },
  { n: 9, code: "  subsetSum(arr, target, index+1)" },
  { n: 10, code: "  return solutions" },
];

export const PERMUTATIONS_CODE_LINES = [
  { n: 0, code: "function permutations(arr) {" },
  { n: 1, code: "  if depth == n: record(path)" },
  { n: 2, code: "  for each unused element i:" },
  { n: 3, code: "    path.add(arr[i]); used[i] = true" },
  { n: 4, code: "    permutations(arr, depth+1)" },
  { n: 5, code: "    path.remove(arr[i]); used[i] = false" },
  { n: 6, code: "  return solutions" },
  { n: 7, code: "  // backtrack" },
];

export const COMBINATIONS_CODE_LINES = [
  { n: 0, code: "function combinations(arr, k) {" },
  { n: 1, code: "  if depth == k: record(path)" },
  { n: 2, code: "  for i = start to n-1:" },
  { n: 3, code: "    path.add(arr[i])" },
  { n: 4, code: "    combinations(arr, k, i+1, depth+1)" },
  { n: 5, code: "    path.remove(arr[i])" },
  { n: 6, code: "  return solutions" },
  { n: 7, code: "  // backtrack" },
];

export const SUDOKU_CODE_LINES = [
  { n: 0, code: "function solve(board, N) {" },
  { n: 1, code: "  if no empty cell: record(board)" },
  { n: 2, code: "  for symbol = 1 .. N:" },
  { n: 3, code: "    if isValid(board, row, col, symbol):" },
  { n: 4, code: "      board[row][col] = symbol" },
  { n: 5, code: "      if solve(board, N): return true" },
  { n: 6, code: "      board[row][col] = 0  // backtrack" },
  { n: 7, code: "  return false" },
];

export const backtrackingDescriptors = [
  {
    id: "n-queens",
    name: "N-Queens",
    category: "backtracking",
    color: "#bf5af2",
    group: "backtracking",
    complexity: {
      best: "O(N!)",
      average: "O(N!)",
      worst: "O(N!)",
      space: "O(N²)",
      paradigm: "Backtracking",
    },
    run: null,
    steps: null,
    debug: (n) => nQueensDebug(n),
    pseudocode: `NQueens(n):
  board = empty n×n
  solve(row):
    if row == n:
      record(board)
      return
    for col = 0 to n-1:
      if isSafe(board, row, col):
        board[row][col] = 'Q'
        solve(row + 1)
        board[row][col] = '.'`,
    codeLines: NQUEENS_CODE_LINES,
  },
  {
    id: "subset-sum",
    name: "Subset Sum",
    category: "backtracking",
    color: "#30d158",
    group: "backtracking",
    complexity: {
      best: "O(2ⁿ)",
      average: "O(2ⁿ)",
      worst: "O(2ⁿ)",
      space: "O(n)",
      paradigm: "Backtracking",
    },
    run: null,
    steps: null,
    debug: (arr, target) => subsetSumDebug(arr, target),
    pseudocode: `SubsetSum(arr, target):
  solve(index, sum, subset):
    if index == n:
      if sum == target: record(subset)
      return
    // include arr[index]
    subset.add(arr[index])
    solve(index+1, sum+arr[index], subset)
    subset.remove(arr[index])
    // exclude arr[index]
    solve(index+1, sum, subset)`,
    codeLines: SUBSETSUM_CODE_LINES,
  },
  {
    id: "permutations",
    name: "Permutations",
    category: "backtracking",
    color: "#64d2ff",
    group: "backtracking",
    complexity: {
      best: "O(n!)",
      average: "O(n!)",
      worst: "O(n!)",
      space: "O(n)",
      paradigm: "Backtracking",
    },
    run: null,
    steps: null,
    debug: (arr) => permutationsDebug(arr),
    pseudocode: `Permutations(arr):
  used = array of n false
  path = []
  solve(depth):
    if depth == n:
      record(path)
      return
    for each i where used[i] == false:
      path.add(arr[i])
      used[i] = true
      solve(depth + 1)
      path.remove(arr[i])
      used[i] = false`,
    codeLines: PERMUTATIONS_CODE_LINES,
  },
  {
    id: "combinations",
    name: "Combinations",
    category: "backtracking",
    color: "#ffd60a",
    group: "backtracking",
    complexity: {
      best: "O(C(n,k))",
      average: "O(C(n,k))",
      worst: "O(C(n,k))",
      space: "O(k)",
      paradigm: "Backtracking",
    },
    run: null,
    steps: null,
    debug: (arr, k) => combinationsDebug(arr, k),
    pseudocode: `Combinations(arr, k):
  path = []
  solve(start, depth):
    if depth == k:
      record(path)
      return
    for i = start to n-1:
      path.add(arr[i])
      solve(i + 1, depth + 1)
      path.remove(arr[i])`,
    codeLines: COMBINATIONS_CODE_LINES,
  },
  {
    id: "sudoku",
    name: "Sudoku",
    category: "backtracking",
    color: "#ff9f0a",
    group: "backtracking",
    description:
      "Sudoku is a constraint-satisfaction puzzle solved through backtracking. The solver fills an N×N grid (where N = boxSize²) by trying valid symbols in each empty cell, checking row, column, and sub-box constraints, and backtracking when no valid symbol remains.",
    complexity: {
      best: "O(N^E)",
      average: "O(N^E)",
      worst: "O(N^E)",
      space: "O(E)",
      paradigm: "Backtracking",
    },
    run: null,
    steps: null,
    debug: (puzzle) => sudokuDebug(puzzle),
    pseudocode: `Sudoku(board, N):
  boxSize = sqrt(N)
  find empty cell (row, col)
  if none: record(board) return true
  for symbol = 1 to N:
    if isValid(board, row, col, symbol, boxSize):
      board[row][col] = symbol
      if solve(board, N): return true
      board[row][col] = 0  // backtrack
  return false`,
    codeLines: SUDOKU_CODE_LINES,
  },
];
