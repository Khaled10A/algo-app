import { createDncCollector } from './dncEvents';

/**
 * Strassen Matrix Multiplication — Divide & Conquer.
 *
 * Implements the standard O(n^{log₂7}) ≈ O(n^2.807) algorithm for square
 * matrices whose size is a power of two. Non-power-of-two inputs are rejected
 * with a clear message — dimensions are never silently changed or padded.
 *
 * Algorithm contract (for an n×n node, n > 1):
 *   1. Split A and B into four (n/2)×(n/2) quadrants each:
 *        A = [ A11 A12 ]   B = [ B11 B12 ]
 *            [ A21 A22 ]       [ B21 B22 ]
 *   2. Form ten sum/difference matrices (the additions/subtractions):
 *        S1 = A11 + A22   S2 = B11 + B22   S3 = A21 + A22   S4 = B12 − B22
 *        S5 = B21 − B11   S6 = A11 + A12   S7 = A21 − A11   S8 = B11 + B12
 *        S9 = A12 − A22   S10 = B21 + B22
 *   3. Compute the seven Strassen products recursively:
 *        M1 = (A11 + A22)(B11 + B22)   = S1·S2
 *        M2 = (A21 + A22)B11           = S3·B11
 *        M3 = A11(B12 − B22)           = A11·S4
 *        M4 = A22(B21 − B11)           = A22·S5
 *        M5 = (A11 + A12)B22           = S6·B22
 *        M6 = (A21 − A11)(B11 + B12)   = S7·S8
 *        M7 = (A12 − A22)(B21 + B22)   = S9·S10
 *   4. Recombine:
 *        C11 = M1 + M4 − M5 + M7
 *        C12 = M3 + M5
 *        C21 = M2 + M4
 *        C22 = M1 − M2 + M3 + M6
 *
 * Base case:
 *   - n == 1: a single scalar multiplication, clearly labeled. (No threshold
 *     like n ≤ 2: the whole point of this visualization is to show the seven
 *     recursive multiplications, so 2×2 inputs already exercise the full
 *     Strassen structure.)
 *
 * Visualization contract (D&C event stream):
 *   - enter / divide / 10 addition events / 7 recurse events / combine /
 *     return, all carrying nodeId/parentId for a 7-ary recursion tree.
 *   - Matrices live in `meta` (deep-cloned per event); stateSnapshot holds
 *     only small scalars (n, stage, labels) so vars/memory stay readable.
 *
 * Correctness is never traded for size: sizes are capped for playback, and
 * results are exact (plain IEEE doubles; values stay small in the UI).
 */

/** Largest matrix size allowed for visualization. */
export const STRASSEN_DEFAULT_MAX_N = 8;

/** Element-wise matrix addition. */
export function matAdd(a, b) {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

/** Element-wise matrix subtraction. */
export function matSub(a, b) {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

/**
 * Split an even-sized square matrix into four equal quadrants.
 *
 * @param {number[][]} m — n×n with n even
 * @returns {{ a11: number[][], a12: number[][], a21: number[][], a22: number[][] }}
 */
export function splitQuadrants(m) {
  const n = m.length;
  const qn = n / 2;
  const slice = (r0, r1, c0, c1) =>
    m.slice(r0, r1).map((row) => row.slice(c0, c1));
  return {
    a11: slice(0, qn, 0, qn),
    a12: slice(0, qn, qn, n),
    a21: slice(qn, n, 0, qn),
    a22: slice(qn, n, qn, n),
  };
}

/**
 * Join four (qn×qn) quadrants into an n×n matrix.
 *
 * @param {number[][]} c11
 * @param {number[][]} c12
 * @param {number[][]} c21
 * @param {number[][]} c22
 * @returns {number[][]}
 */
export function joinQuadrants(c11, c12, c21, c22) {
  const qn = c11.length;
  const n = qn * 2;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const top = i < qn;
    const row = [];
    for (let j = 0; j < n; j += 1) {
      const left = j < qn;
      const q = top ? (left ? c11 : c12) : left ? c21 : c22;
      row.push(q[top ? i : i - qn][left ? j : j - qn]);
    }
    out.push(row);
  }
  return out;
}

/**
 * Validate two Strassen operands.
 *
 * Returns { valid: true } or { valid: false, reason }. Both matrices must be
 * square, equally sized, powers of two (1, 2, 4, 8, …), no larger than
 * `maxN`, and contain only finite numbers. Non-power-of-two sizes are rejected
 * rather than silently padded.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @param {number} [maxN]
 * @returns {{ valid: true } | { valid: false, reason: string }}
 */
export function validateStrassenInput(a, b, maxN = STRASSEN_DEFAULT_MAX_N) {
  const checkMatrix = (label, m) => {
    if (!Array.isArray(m) || m.length === 0) {
      return `${label} must be a non-empty square matrix (array of rows).`;
    }
    const n = m.length;
    if (!m.every((row) => Array.isArray(row) && row.length === n)) {
      return `${label} must be square (every row has ${n} entries).`;
    }
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        const v = m[i][j];
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          return `${label}[${i}][${j}] is not a finite number.`;
        }
      }
    }
    if ((n & (n - 1)) !== 0) {
      return `${label} is ${n}×${n}, which is not a power of two (supported: 1, 2, 4, 8, …). Dimensions are never silently padded — use a power of two.`;
    }
    if (n > maxN) {
      return `${label} is ${n}×${n} (max ${maxN}×${maxN}) — reduce the size to keep the visualization responsive.`;
    }
    return null;
  };

  const ea = checkMatrix('A', a);
  if (ea) return { valid: false, reason: ea };
  const eb = checkMatrix('B', b);
  if (eb) return { valid: false, reason: eb };
  if (a.length !== b.length) {
    return {
      valid: false,
      reason: `A is ${a.length}×${a.length} but B is ${b.length}×${b.length} — both matrices must have the same size.`,
    };
  }
  return { valid: true };
}

/**
 * Recursive Strassen multiplication.
 *
 * Emits the D&C event stream through `emit`; returns the product matrix.
 *
 * @param {number[][]} a
 * @param {number[][]} b
 * @param {(type: string, payload: object) => void} emit
 * @param {number} depth
 * @param {string} nodeId
 * @param {string | null} parentId
 * @returns {number[][]}
 */
function strassenRec(a, b, emit, depth, nodeId, parentId) {
  const n = a.length;
  const subproblem = `A ${n}×${n} · B ${n}×${n}`;
  const base = { n, stage: 'enter' };

  emit('enter', {
    depth,
    subproblem,
    action: 'enter',
    stateSnapshot: base,
    nodeId,
    parentId,
    meta: { stage: 'enter', n, a, b },
  });

  // ── Base case: 1×1 — single scalar multiplication ─────────────────────────
  if (n === 1) {
    const product = [[a[0][0] * b[0][0]]];
    emit('baseCase', {
      depth,
      subproblem,
      reason: '1×1 → single scalar multiplication',
      stateSnapshot: { n, stage: 'base' },
      nodeId,
      parentId,
      meta: { baseCase: true, stage: 'base', a, b, product, result: product },
    });
    emit('return', {
      depth,
      subproblem,
      reason: 'base-case product',
      stateSnapshot: { n, stage: 'return' },
      nodeId,
      parentId,
      meta: { stage: 'return', result: product },
    });
    return product;
  }

  // ── Divide: quadrant partitions ───────────────────────────────────────────
  const qn = n / 2;
  const qa = splitQuadrants(a);
  const qb = splitQuadrants(b);
  const quadrants = {
    a11: qa.a11,
    a12: qa.a12,
    a21: qa.a21,
    a22: qa.a22,
    b11: qb.a11,
    b12: qb.a12,
    b21: qb.a21,
    b22: qb.a22,
  };

  emit('divide', {
    depth,
    subproblem,
    splitDescription: `quadrant split ${n}×${n} → four ${qn}×${qn}`,
    stateSnapshot: { n, stage: 'divide', qn },
    nodeId,
    parentId,
    meta: { stage: 'divide', n, qn, a, b, quadrants },
  });

  const emitAddition = (label, expression, left, right, result) => {
    emit('combine', {
      depth,
      subproblem,
      description: `${label} = ${expression}`,
      stateSnapshot: { n, stage: 'addition', label },
      nodeId,
      parentId,
      meta: { stage: 'addition', label, expression, left, right, result },
    });
  };

  // ── Additions/subtractions (S1..S10) ─────────────────────────────────────
  const S1 = matAdd(qa.a11, qa.a22);
  emitAddition('S1', 'A11 + A22', qa.a11, qa.a22, S1);
  const S2 = matAdd(qb.a11, qb.a22);
  emitAddition('S2', 'B11 + B22', qb.a11, qb.a22, S2);
  const S3 = matAdd(qa.a21, qa.a22);
  emitAddition('S3', 'A21 + A22', qa.a21, qa.a22, S3);
  const S4 = matSub(qb.a12, qb.a22);
  emitAddition('S4', 'B12 − B22', qb.a12, qb.a22, S4);
  const S5 = matSub(qb.a21, qb.a11);
  emitAddition('S5', 'B21 − B11', qb.a21, qb.a11, S5);
  const S6 = matAdd(qa.a11, qa.a12);
  emitAddition('S6', 'A11 + A12', qa.a11, qa.a12, S6);
  const S7 = matSub(qa.a21, qa.a11);
  emitAddition('S7', 'A21 − A11', qa.a21, qa.a11, S7);
  const S8 = matAdd(qb.a11, qb.a12);
  emitAddition('S8', 'B11 + B12', qb.a11, qb.a12, S8);
  const S9 = matSub(qa.a12, qa.a22);
  emitAddition('S9', 'A12 − A22', qa.a12, qa.a22, S9);
  const S10 = matAdd(qb.a21, qb.a22);
  emitAddition('S10', 'B21 + B22', qb.a21, qb.a22, S10);

  const emitRecurse = (target, expression, x, y) => {
    const childNodeId = `${nodeId}-${target}`;
    emit('recurse', {
      depth,
      subproblem,
      childDescription: `${target} = ${expression}`,
      stateSnapshot: { n, stage: 'recurse', target },
      nodeId: childNodeId,
      parentId: nodeId,
      meta: { stage: 'recurse', target, expression, a: x, b: y },
    });
    return strassenRec(x, y, emit, depth + 1, childNodeId, nodeId);
  };

  // ── The seven Strassen products ───────────────────────────────────────────
  const M1 = emitRecurse('M1', '(A11 + A22) × (B11 + B22)', S1, S2);
  const M2 = emitRecurse('M2', '(A21 + A22) × B11', S3, qb.a11);
  const M3 = emitRecurse('M3', 'A11 × (B12 − B22)', qa.a11, S4);
  const M4 = emitRecurse('M4', 'A22 × (B21 − B11)', qa.a22, S5);
  const M5 = emitRecurse('M5', '(A11 + A12) × B22', S6, qb.a22);
  const M6 = emitRecurse('M6', '(A21 − A11) × (B11 + B12)', S7, S8);
  const M7 = emitRecurse('M7', '(A12 − A22) × (B21 + B22)', S9, S10);

  // ── Recombine ─────────────────────────────────────────────────────────────
  // Strassen recombination formulas:
  //   C11 = M1 + M4 - M5 + M7
  //   C12 = M3 + M5
  //   C21 = M2 + M4
  //   C22 = M1 - M2 + M3 + M6
  const C11 = matAdd(matAdd(matSub(M1, M5), M4), M7);
  const C12 = matAdd(M3, M5);
  const C21 = matAdd(M2, M4);
  const C22 = matAdd(matAdd(matSub(M1, M2), M3), M6);
  const c = joinQuadrants(C11, C12, C21, C22);

  emit('combine', {
    depth,
    subproblem,
    description: 'recombine quadrants into C',
    stateSnapshot: { n, stage: 'recombine' },
    nodeId,
    parentId,
    meta: {
      stage: 'recombine',
      n,
      m1: M1,
      m2: M2,
      m3: M3,
      m4: M4,
      m5: M5,
      m6: M6,
      m7: M7,
      c11: C11,
      c12: C12,
      c21: C21,
      c22: C22,
      c,
      result: c,
      formulas: {
        c11: 'M1 + M4 − M5 + M7',
        c12: 'M3 + M5',
        c21: 'M2 + M4',
        c22: 'M1 − M2 + M3 + M6',
      },
    },
  });

  emit('return', {
    depth,
    subproblem,
    reason: `product C (${n}×${n})`,
    stateSnapshot: { n, stage: 'return' },
    nodeId,
    parentId,
    meta: { stage: 'return', c, result: c },
  });

  return c;
}

/**
 * debug(): produce the raw D&C event stream for projectDNCEvents().
 *
 * @param {number[][]} a
 * @param {number[][]} b
 * @returns {object[]}
 */
export function strassenDebug(a, b) {
  const v = validateStrassenInput(a, b);
  if (!v.valid) throw new Error(v.reason);
  const collector = createDncCollector();
  strassenRec(a, b, collector.emit.bind(collector), 0, 's-0', null);
  return collector.events;
}

/**
 * run(): compute the Strassen product, returning the result plus the event
 * stream.
 *
 * @param {number[][]} a
 * @param {number[][]} b
 * @returns {{ n: number, c: number[][], events: object[] }}
 */
export function strassenRun(a, b) {
  const events = strassenDebug(a, b);
  const last = events[events.length - 1];
  const c =
    last && last.meta && last.meta.result != null
      ? last.meta.result
      : null;
  return { n: a.length, c, events };
}

/**
 * steps(): produce a frame-per-event list for visualizers.
 *
 * Each frame exposes phase, matrix size, stage, the recursion target for
 * recurse frames, the deep-cloned event meta (matrices), and the result when
 * available.
 *
 * @param {number[][]} a
 * @param {number[][]} b
 * @returns {object[]}
 */
export function strassenSteps(a, b) {
  const events = strassenDebug(a, b);
  return events.map((event, step) => {
    const s = event.stateSnapshot;
    return {
      step,
      phase: event.type,
      subproblem: event.subproblem,
      log: event.action,
      depth: event.depth,
      activeLine: step,
      n: s.n ?? null,
      stage: s.stage ?? null,
      label: s.label ?? null,
      target: s.target ?? null,
      mutates: event.meta && event.meta.mutates != null ? event.meta.mutates : (step >= 11 && step <= 20 ? 'matrix' : null),
      result: event.meta && event.meta.result != null ? event.meta.result : null,
    };
  });
}