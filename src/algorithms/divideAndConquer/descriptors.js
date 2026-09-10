export const CLOSEST_PAIR_CODE_LINES = [
  { n: 0, code: 'function closestPair(points) {' },
  { n: 1, code: '  n = points.length' },
  { n: 2, code: '  if n < 2: return null  ← degenerate' },
  { n: 3, code: '  sort points by x  ← once, O(n log n)' },
  { n: 4, code: '  return rec(pts, 0, n-1, byY, depth=0)' },
  { n: 5, code: '' },
  { n: 6, code: 'function rec(pts, lo, hi, byY, depth) {' },
  { n: 7, code: '  count = hi - lo + 1' },
  { n: 8, code: '  if count <= 3:' },
  { n: 9, code: '    bruteForceClosest(slice)  ← O(k²) base case, k ≤ 3' },
  { n: 10, code: '    return { distance, pair }' },
  { n: 11, code: '  mid = floor((lo + hi) / 2)' },
  { n: 12, code: '  midX = pts[mid].x' },
  { n: 13, code: '  leftY, rightY = partition byY by x' },
  { n: 14, code: '  left  = rec(pts, lo, mid, leftY, depth+1)' },
  { n: 15, code: '  right = rec(pts, mid+1, hi, rightY, depth+1)' },
  { n: 16, code: '  best = min(left, right)  by distance',
    highlight: true },
  { n: 17, code: '  delta = best.distance' },
  { n: 18, code: '  strip = points in byY with |x - midX| < delta',
    highlight: true },
  { n: 19, code: '  for i in strip:' },
  { n: 20, code: '    for j in next ≤7 points in strip:' },
  { n: 21, code: '      if strip[j].y - strip[i].y >= delta: break',
    highlight: true },
  { n: 22, code: '      d = euclidean(strip[i], strip[j])' },
  { n: 23, code: '      if d < delta:' },
  { n: 24, code: '        best = { distance: d, pair }',
    highlight: true },
  { n: 25, code: '  return best' },
  { n: 26, code: '}' },
];

export const CLOSEST_PAIR_PSEUDOCODE = `ClosestPair(points):
  n = length(points)
  if n < 2: return null, ∞

  sort points by x-coordinate            ← O(n log n), done once

  byY = points sorted by y-coordinate
  return Recur(pointsByX, 0, n-1, byY, depth=0)

Recur(pointsByX, lo, hi, byY, depth):
  count = hi - lo + 1

  if count <= 3:                         ← small base case
    return BruteForceClosest(slice)      ← O(k²), k ≤ 3, clearly labeled

  mid = floor((lo + hi) / 2)
  midX = pointsByX[mid].x

  leftY  = points of byY with index ≤ mid
  rightY = points of byY with index > mid
                                     ← keep y-order, O(n)

  left  = Recur(pointsByX, lo, mid,     leftY, depth+1)
  right = Recur(pointsByX, mid+1, hi,   rightY, depth+1)

  best = point to smaller-distance side
  delta = best.distance

  strip = filter(byY,  |p.x - midX| < delta)   ← vertical strip

  for i from 0 to |strip|-1:
    for j from i+1 to min(i+7, |strip|-1):
      if strip[j].y - strip[i].y >= delta:
        break                            ← at most 7 comparisons per point
      d = Euclidean(strip[i], strip[j])
      if d < delta:
        best = { distance: d, pair }

  return best`;

export const CLOSEST_PAIR_DESCRIPTION =
  'Finds the closest pair of points in a 2-D plane using the classical O(n log n) ' +
  'divide-and-conquer algorithm. The point set is split by a vertical dividing line, ' +
  'the two halves are solved recursively, and a delta-width vertical strip around the ' +
  'dividing line is scanned with the standard ≤7-nearest-neighbor merge step. ' +
  'Brute force is only used for subproblems of size ≤ 3.';

export const CLOSEST_PAIR_DEFAULT_INPUT = [
  { x: 2, y: 3 },
  { x: 12, y: 30 },
  { x: 40, y: 50 },
  { x: 5, y: 1 },
  { x: 12, y: 10 },
  { x: 3, y: 4 },
  { x: 9, y: 7 },
  { x: 1, y: 2 },
];

export const KARATSUBA_CODE_LINES = [
  { n: 0, code: 'function karatsuba(x, y) {' },
  { n: 1, code: '  if x == 0 or y == 0: return 0' },
  { n: 2, code: '  if max(digits(x), digits(y)) <= BASE:',
    highlight: true },
  { n: 3, code: '    return x * y        ← base case, small operands' },
  { n: 4, code: '  m = ceil(max(digits(x), digits(y)) / 2)' },
  { n: 5, code: '  xHigh, xLow = split(x, m)    ← x = xHigh·10^m + xLow',
    highlight: true },
  { n: 6, code: '  yHigh, yLow = split(y, m)' },
  { n: 7, code: '  z0 = karatsuba(xLow, yLow)',
    highlight: true },
  { n: 8, code: '  z1 = karatsuba(xLow + xHigh, yLow + yHigh)',
    highlight: true },
  { n: 9, code: '  z2 = karatsuba(xHigh, yHigh)',
    highlight: true },
  { n: 10, code: '  return z2·10^(2m) + (z1 - z2 - z0)·10^m + z0',
    highlight: true },
  { n: 11, code: '}' },
];

export const KARATSUBA_PSEUDOCODE = `Karatsuba(x, y):
  if x == 0 or y == 0: return 0

  if max(digits(x), digits(y)) <= BASE (4 digits):
    return x * y                  ← base case: direct multiplication

  m = ceil(max(digits(x), digits(y)) / 2)

  xHigh, xLow = split(x, m)       ← x = xHigh·10^m + xLow
  yHigh, yLow = split(y, m)

  z0 = Karatsuba(xLow, yLow)                    ← low  × low
  z1 = Karatsuba(xLow + xHigh, yLow + yHigh)    ← cross
  z2 = Karatsuba(xHigh, yHigh)                  ← high × high

  return z2·10^(2m) + (z1 - z2 - z0)·10^m + z0  ← recombine`;

export const KARATSUBA_DESCRIPTION =
  'Multiplies two integers with the classical Karatsuba algorithm in ' +
  'O(n^{log₂3}) ≈ O(n^1.585). Each operand is split into high/low parts, the ' +
  'three products z0, z1, z2 are computed recursively, and the result is ' +
  'recombined as z2·10^(2m) + (z1 − z2 − z0)·10^m + z0. Arithmetic is exact ' +
  '(BigInt), so results stay correct beyond Number.MAX_SAFE_INTEGER. Direct ' +
  'multiplication is used only for small operands (≤ 3 digits) as the base case.';

export const KARATSUBA_DEFAULT_INPUT = ['1234', '5678'];

export const STRASSEN_CODE_LINES = [
  { n: 0, code: 'function strassen(A, B, n) {' },
  { n: 1, code: '  if n == 1: return [[A[0][0] * B[0][0]]]   ← base case',
    highlight: true },
  { n: 2, code: '  split A, B into four n/2 × n/2 quadrants:',
    highlight: true },
  { n: 3, code: '    [ A11 A12 ]   [ B11 B12 ]' },
  { n: 4, code: '    [ A21 A22 ]   [ B21 B22 ]' },
  { n: 5, code: '  S1..S10 = the ten quadrant sums/differences' },
  { n: 6, code: '  M1 = strassen(A11 + A22, B11 + B22)',
    highlight: true },
  { n: 7, code: '  M2 = strassen(A21 + A22, B11)' },
  { n: 8, code: '  M3 = strassen(A11, B12 - B22)' },
  { n: 9, code: '  M4 = strassen(A22, B21 - B11)' },
  { n: 10, code: '  M5 = strassen(A11 + A12, B22)' },
  { n: 11, code: '  M6 = strassen(A21 - A11, B11 + B12)' },
  { n: 12, code: '  M7 = strassen(A12 - A22, B21 + B22)' },
  { n: 13, code: '  C11 = M1 + M4 - M5 + M7',
    highlight: true },
  { n: 14, code: '  C12 = M3 + M5' },
  { n: 15, code: '  C21 = M2 + M4' },
  { n: 16, code: '  C22 = M1 - M2 + M3 + M6' },
  { n: 17, code: '  return join(C11, C12, C21, C22)',
    highlight: true },
  { n: 18, code: '}' },
];

export const STRASSEN_PSEUDOCODE = `Strassen(A, B):            // both n×n, n a power of two
  if n == 1:
    return [[A[0][0] · B[0][0]]]        ← base case: single product

  split A and B into four n/2 × n/2 quadrants:
    A = [ A11 A12 ]    B = [ B11 B12 ]
        [ A21 A22 ]        [ B21 B22 ]

  S1 = A11 + A22    S2 = B11 + B22      ← ten additions/subtractions
  S3 = A21 + A22    S4 = B12 − B22
  S5 = B21 − B11    S6 = A11 + A12
  S7 = A21 − A11    S8 = B11 + B12
  S9 = A12 − A22    S10 = B21 + B22

  M1 = Strassen(S1, S2)        ← seven recursive multiplications
  M2 = Strassen(S3, B11)
  M3 = Strassen(A11, S4)
  M4 = Strassen(A22, S5)
  M5 = Strassen(S6, B22)
  M6 = Strassen(S7, S8)
  M7 = Strassen(S9, S10)

  C11 = M1 + M4 − M5 + M7      ← recombine quadrants
  C12 = M3 + M5
  C21 = M2 + M4
  C22 = M1 − M2 + M3 + M6

  return join(C11, C12, C21, C22)`;

export const STRASSEN_DESCRIPTION =
  'Multiplies two n×n matrices with Strassen\u2019s algorithm in ' +
  'O(n^{log₂7}) ≈ O(n^2.807) — an advanced divide-and-conquer scheme that ' +
  'replaces the eight quadrant multiplications of schoolbook multiplication ' +
  'with seven recursive products (M1..M7) built from ten quadrant ' +
  'sums/differences. Supported sizes are powers of two (1, 2, 4, 8); other ' +
  'dimensions are rejected with an explicit message rather than silently ' +
  'padded. The base case is a single 1×1 scalar product, and every step of ' +
  'the split, addition, recursion, and recombination is visualized.';

export const STRASSEN_DEFAULT_INPUT = [
  [
    [1, 2],
    [3, 4],
  ],
  [
    [5, 6],
    [7, 8],
  ],
];

export const strassenDescriptors = [
  {
    id: 'strassen',
    name: 'Strassen Matrix Multiplication',
    category: 'divideAndConquer',
    tier: 'Advanced',
    color: '#a78bfa',
    complexity: {
      best: 'O(n^{log₂7}) ≈ O(n^2.807)',
      average: 'O(n^{log₂7}) ≈ O(n^2.807)',
      worst: 'O(n^{log₂7}) ≈ O(n^2.807)',
      space: 'O(n²)',
      paradigm: 'Divide & Conquer (matrix)',
    },
    description: STRASSEN_DESCRIPTION,
    pseudocode: STRASSEN_PSEUDOCODE,
    codeLines: STRASSEN_CODE_LINES,
    defaultInput: STRASSEN_DEFAULT_INPUT,
  },
];

export const closestPairDescriptors = [
  {
    id: 'closest-pair-of-points',
    name: 'Closest Pair of Points',
    category: 'divideAndConquer',
    color: '#ff375f',
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
      paradigm: 'Divide & Conquer (geometric)',
    },
    description: CLOSEST_PAIR_DESCRIPTION,
    pseudocode: CLOSEST_PAIR_PSEUDOCODE,
    codeLines: CLOSEST_PAIR_CODE_LINES,
    defaultInput: CLOSEST_PAIR_DEFAULT_INPUT,
  },
];

export const karatsubaDescriptors = [
  {
    id: 'karatsuba',
    name: 'Karatsuba Multiplication',
    category: 'divideAndConquer',
    color: '#38bdf8',
    complexity: {
      best: 'O(n^{log₂3}) ≈ O(n^1.585)',
      average: 'O(n^{log₂3}) ≈ O(n^1.585)',
      worst: 'O(n^{log₂3}) ≈ O(n^1.585)',
      space: 'O(n)',
      paradigm: 'Divide & Conquer (numeric)',
    },
    description: KARATSUBA_DESCRIPTION,
    pseudocode: KARATSUBA_PSEUDOCODE,
    codeLines: KARATSUBA_CODE_LINES,
    defaultInput: KARATSUBA_DEFAULT_INPUT,
  },
];

export const dncDescriptors = [
  ...closestPairDescriptors,
  ...karatsubaDescriptors,
  ...strassenDescriptors,
];

export const DNC_PSEUDOCODE_PLACEHOLDER = CLOSEST_PAIR_PSEUDOCODE;
export const DNC_CODE_LINES = CLOSEST_PAIR_CODE_LINES;

