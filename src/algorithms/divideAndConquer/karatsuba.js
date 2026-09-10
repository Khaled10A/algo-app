import { createDncCollector } from './dncEvents';

/**
 * Karatsuba multiplication — Divide & Conquer.
 *
 * Implements the standard O(n^{log₂ 3}) ≈ O(n^1.585) recursive algorithm on
 * BigInt values, so products are exact even beyond Number.MAX_SAFE_INTEGER.
 *
 * Input contract:
 *   - x and y are integer strings (digits, optional leading '+'/'-').
 *   - Output is the exact product as a string.
 *
 * Algorithm contract (per call on operands X, Y):
 *   1. Zero / small operands (≤ KARA_BASE_DIGITS digits) are handled by a
 *      clearly labeled direct-multiplication base case — not the main path.
 *      With BASE = 3, the canonical 1234 × 5678 example still splits into
 *      12|34 × 56|78 and exercises the full divide → recurse → combine flow.
 *   2. m = ceil(max(digits) / 2); split each operand: X = xHigh·10^m + xLow.
 *   3. Recurse three times (the main recursive work):
 *        z0 = Xlow · Ylow
 *        z1 = (Xlow + Xhigh) · (Ylow + Yhigh)
 *        z2 = Xhigh · Yhigh
 *   4. Recombine: z2·10^(2m) + (z1 − z2 − z0)·10^m + z0.
 *
 * The main recursive work is three Karatsuba multiplications per node; native
 * BigInt multiplication is used only for the small-operand base case (≤ 3
 * digits) and for power-of-ten shifts during recombination.
 *
 * Visualization contract (D&C event stream):
 *   - enter / divide / recurse(z0, z1, z2) / baseCase / combine / return,
 *     carrying split metadata (m, high/low parts), the recursive target, and
 *     recombination values (z0/z1/z2, terms, result).
 *   - Every event payload holds plain strings/numbers (never BigInt), so the
 *     stream stays JSON-safe and projector-friendly; BigInts live only inside
 *     the recursion.
 */

/** Operands at or below this many digits are multiplied directly. */
export const KARA_BASE_DIGITS = 3;

/** Educational digit limit used by the debugger UI (each operand). */
export const KARA_DEFAULT_MAX_DIGITS = 16;

/**
 * Normalize an integer string: trims whitespace, drops a leading '+' and
 * redundant leading zeros, keeps a single leading '-' for negatives, and
 * maps "-0"/"000" to "0".
 *
 * @param {unknown} s
 * @returns {string}
 */
export function normalizeBigIntString(s) {
  if (typeof s !== 'string') return String(BigInt(s));
  const trimmed = s.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid integer string: empty input');
  }
  const sign = trimmed.startsWith('-') ? '-' : '';
  const digits = trimmed.startsWith('-') || trimmed.startsWith('+')
    ? trimmed.slice(1)
    : trimmed;
  if (!/^\d+$/.test(digits)) {
    throw new Error(`Invalid integer string: ${JSON.stringify(s)}`);
  }
  const stripped = digits.replace(/^0+/, '');
  const normalized = stripped === '' ? '0' : stripped;
  return normalized === '0' ? '0' : sign + normalized;
}

/**
 * Parse an integer string into a BigInt. Throws on non-integer input.
 *
 * @param {unknown} s
 * @returns {bigint}
 */
export function parseKaratsubaInput(s) {
  const normalized = normalizeBigIntString(s);
  try {
    return BigInt(normalized);
  } catch {
    throw new Error(`Invalid Karatsuba operand: ${JSON.stringify(s)}`);
  }
}

/** Format a BigInt for display (plain decimal string). */
export function formatBigInt(b) {
  return b.toString();
}

/**
 * Validate two Karatsuba operands.
 *
 * Returns { valid: true, x, y } with normalized values, or
 * { valid: false, reason } describing the problem. When `maxDigits` is
 * provided, operands with more significant digits are rejected (educational
 * limit) instead of being silently truncated.
 *
 * @param {unknown} xStr
 * @param {unknown} yStr
 * @param {number | null} [maxDigits]
 * @returns {{ valid: true, x: string, y: string } | { valid: false, reason: string }}
 */
export function validateKaratsubaInput(xStr, yStr, maxDigits = null) {
  const check = (label, s) => {
    if (typeof s !== 'string' || s.trim().length === 0) {
      return `${label} must be a non-empty integer.`;
    }
    const trimmed = s.trim();
    if (!/^[+-]?\d+$/.test(trimmed)) {
      return `${label} must be a plain integer (digits only, optional leading sign) — got ${JSON.stringify(s)}.`;
    }
    if (maxDigits != null) {
      const digits = trimmed.replace(/^[+-]/, '').replace(/^0+/, '') || '0';
      if (digits.length > maxDigits) {
        return `${label} has ${digits.length} digits (limit ${maxDigits}) — reduce it to keep the visualization responsive.`;
      }
    }
    return null;
  };

  const ex = check('x', xStr);
  if (ex) return { valid: false, reason: ex };
  const ey = check('y', yStr);
  if (ey) return { valid: false, reason: ey };

  return { valid: true, x: normalizeBigIntString(xStr), y: normalizeBigIntString(yStr) };
}

/**
 * Split a nonnegative digit string into high/low parts around 10^m.
 *
 *   low  = n mod 10^m
 *   high = floor(n / 10^m)
 *
 * @param {string} digits — nonnegative decimal digit string
 * @param {number} m — split exponent
 * @returns {{ high: bigint, low: bigint, m: number, len: number }}
 */
export function splitBigIntString(digits, m) {
  const pow = 10n ** BigInt(m);
  const big = BigInt(digits);
  return { high: big / pow, low: big % pow, m, len: digits.length };
}

/**
 * Recursive Karatsuba multiplication.
 *
 * Emits the D&C event stream (enter/divide/recurse/baseCase/combine/return)
 * through `emit`. Returns the exact product as a BigInt.
 *
 * @param {bigint} x
 * @param {bigint} y
 * @param {(type: string, payload: object) => void} emit
 * @param {number} depth
 * @param {string} nodeId
 * @param {string | null} parentId
 * @param {string} xStr — display form of x (normalized string)
 * @param {string} yStr — display form of y (normalized string)
 * @returns {bigint}
 */
function karatsubaRec(x, y, emit, depth, nodeId, parentId, xStr, yStr) {
  const xNeg = x < 0n;
  const yNeg = y < 0n;
  const absX = xNeg ? -x : x;
  const absY = yNeg ? -y : y;
  const xStrAbs = absX.toString();
  const yStrAbs = absY.toString();
  const sign = (xNeg ? -1 : 1) * (yNeg ? -1 : 1);
  const subproblem = `${xStr} × ${yStr}`;

  emit('enter', {
    depth,
    subproblem,
    action: 'enter',
    stateSnapshot: { x: xStr, y: yStr, absX: xStrAbs, absY: yStrAbs, sign },
    nodeId,
    parentId,
  });

  // ── Base case: an operand is zero ─────────────────────────────────────────
  if (absX === 0n || absY === 0n) {
    const product = '0';
    emit('baseCase', {
      depth,
      subproblem,
      reason: 'an operand is zero → product is 0',
      stateSnapshot: {
        x: xStr,
        y: yStr,
        absX: xStrAbs,
        absY: yStrAbs,
        sign,
        absProduct: '0',
        result: product,
      },
      result: product,
      nodeId,
      parentId,
      meta: { baseCase: true, product },
    });

    emit('return', {
      depth,
      subproblem,
      reason: 'zero operand',
      stateSnapshot: {
        x: xStr,
        y: yStr,
        absX: xStrAbs,
        absY: yStrAbs,
        sign,
        result: product,
      },
      result: product,
      nodeId,
      parentId,
      meta: { result: product },
    });

    return 0n;
  }

  // ── Base case: small operands → direct multiplication ─────────────────────
  // Clearly labeled: this is the standard Karatsuba base case, not the main
  // algorithm. Only operands with ≤ KARA_BASE_DIGITS digits land here.
  if (Math.max(xStrAbs.length, yStrAbs.length) <= KARA_BASE_DIGITS) {
    const productAbs = absX * absY;
    const product = formatBigInt(xNeg !== yNeg ? -productAbs : productAbs);

    emit('baseCase', {
      depth,
      subproblem,
      reason:
        `small operands (max digits ≤ ${KARA_BASE_DIGITS}) → direct multiplication`,
      stateSnapshot: {
        x: xStr,
        y: yStr,
        absX: xStrAbs,
        absY: yStrAbs,
        sign,
        absProduct: formatBigInt(productAbs),
        result: product,
        direct: true,
      },
      result: product,
      nodeId,
      parentId,
      meta: {
        baseCase: true,
        direct: true,
        absProduct: formatBigInt(productAbs),
        product,
      },
    });

    emit('return', {
      depth,
      subproblem,
      reason: 'direct multiplication result',
      stateSnapshot: {
        x: xStr,
        y: yStr,
        absX: xStrAbs,
        absY: yStrAbs,
        sign,
        absProduct: formatBigInt(productAbs),
        result: product,
      },
      result: product,
      nodeId,
      parentId,
      meta: { result: product },
    });

    return xNeg !== yNeg ? -productAbs : productAbs;
  }

  // ── Divide: split into high/low parts ─────────────────────────────────────
  const m = Math.ceil(Math.max(xStrAbs.length, yStrAbs.length) / 2);
  const sx = splitBigIntString(xStrAbs, m);
  const sy = splitBigIntString(yStrAbs, m);
  const xHigh = formatBigInt(sx.high);
  const xLow = formatBigInt(sx.low);
  const yHigh = formatBigInt(sy.high);
  const yLow = formatBigInt(sy.low);
  const padLow = (s) => String(s).padStart(m, '0');

  emit('divide', {
    depth,
    subproblem,
    splitDescription:
      `m=${m}:  x = ${xHigh} | ${padLow(xLow)}   y = ${yHigh} | ${padLow(yLow)}`,
    stateSnapshot: {
      x: xStr,
      y: yStr,
      sign,
      m,
      xHigh,
      xLow,
      yHigh,
      yLow,
      xHighLen: String(sx.high).length,
      xLowLen: String(sx.low).length,
      yHighLen: String(sy.high).length,
      yLowLen: String(sy.low).length,
    },
    nodeId,
    parentId,
    meta: { m, xHigh, xLow, yHigh, yLow, splitKind: 'karatsuba' },
  });

  const xSum = sx.high + sx.low;
  const ySum = sy.high + sy.low;
  const xSumStr = formatBigInt(xSum);
  const ySumStr = formatBigInt(ySum);
  const childId = (tag) => `${nodeId}-${tag}`;

  // ── Recurse: z0 = low1 × low2 ─────────────────────────────────────────────
  emit('recurse', {
    depth,
    subproblem,
    childDescription: `z0 = xLow × yLow = ${xLow} × ${yLow}`,
    stateSnapshot: {
      x: xStr,
      y: yStr,
      sign,
      m,
      recurseTarget: 'z0',
      targetExpression: `${xLow} × ${yLow}`,
      low1: xLow,
      low2: yLow,
    },
    nodeId,
    parentId,
    meta: { recurseTarget: 'z0', m, targetExpression: `${xLow} × ${yLow}` },
  });

  const z0 = karatsubaRec(
    sx.low,
    sy.low,
    emit,
    depth + 1,
    childId('z0'),
    nodeId,
    xLow,
    yLow,
  );

  // ── Recurse: z1 = (low1 + high1) × (low2 + high2) ─────────────────────────
  emit('recurse', {
    depth,
    subproblem,
    childDescription:
      `z1 = (xLow + xHigh) × (yLow + yHigh) = ${xSumStr} × ${ySumStr}`,
    stateSnapshot: {
      x: xStr,
      y: yStr,
      sign,
      m,
      recurseTarget: 'z1',
      targetExpression: `${xSumStr} × ${ySumStr}`,
      sum1: xSumStr,
      sum2: ySumStr,
    },
    nodeId,
    parentId,
    meta: { recurseTarget: 'z1', m, targetExpression: `${xSumStr} × ${ySumStr}` },
  });

  const z1 = karatsubaRec(
    xSum,
    ySum,
    emit,
    depth + 1,
    childId('z1'),
    nodeId,
    xSumStr,
    ySumStr,
  );

  // ── Recurse: z2 = high1 × high2 ───────────────────────────────────────────
  emit('recurse', {
    depth,
    subproblem,
    childDescription: `z2 = xHigh × yHigh = ${xHigh} × ${yHigh}`,
    stateSnapshot: {
      x: xStr,
      y: yStr,
      sign,
      m,
      recurseTarget: 'z2',
      targetExpression: `${xHigh} × ${yHigh}`,
      high1: xHigh,
      high2: yHigh,
    },
    nodeId,
    parentId,
    meta: { recurseTarget: 'z2', m, targetExpression: `${xHigh} × ${yHigh}` },
  });

  const z2 = karatsubaRec(
    sx.high,
    sy.high,
    emit,
    depth + 1,
    childId('z2'),
    nodeId,
    xHigh,
    yHigh,
  );

  // ── Combine: z2·10^(2m) + (z1 − z2 − z0)·10^m + z0 ───────────────────────
  const termHigh = z2 * 10n ** BigInt(2 * m);
  const middleTerm = (z1 - z2 - z0) * 10n ** BigInt(m);
  const productAbs = termHigh + middleTerm + z0;
  const product = formatBigInt(xNeg !== yNeg ? -productAbs : productAbs);

  const combineState = {
    x: xStr,
    y: yStr,
    sign,
    m,
    z0: formatBigInt(z0),
    z1: formatBigInt(z1),
    z2: formatBigInt(z2),
    termHigh: formatBigInt(termHigh),
    middleTerm: formatBigInt(middleTerm),
    absProduct: formatBigInt(productAbs),
    result: product,
  };

  emit('combine', {
    depth,
    subproblem,
    description: 'recombine: z2·10^(2m) + (z1 − z2 − z0)·10^m + z0',
    stateSnapshot: combineState,
    nodeId,
    parentId,
    meta: {
      m,
      z0: formatBigInt(z0),
      z1: formatBigInt(z1),
      z2: formatBigInt(z2),
      termHigh: formatBigInt(termHigh),
      middleTerm: formatBigInt(middleTerm),
      recombination: {
        z2Term: formatBigInt(termHigh),
        middleTerm: formatBigInt(middleTerm),
        z0Term: formatBigInt(z0),
      },
      result: product,
    },
  });

  emit('return', {
    depth,
    subproblem,
    reason: `karatsuba result ${product}`,
    stateSnapshot: { ...combineState },
    result: product,
    nodeId,
    parentId,
    meta: {
      result: product,
      m,
      z0: formatBigInt(z0),
      z1: formatBigInt(z1),
      z2: formatBigInt(z2),
    },
  });

  return xNeg !== yNeg ? -productAbs : productAbs;
}

/**
 * debug(): produce the raw D&C event stream for projectDNCEvents().
 *
 * @param {string} xStr
 * @param {string} yStr
 * @returns {object[]}
 */
export function karatsubaDebug(xStr, yStr) {
  const v = validateKaratsubaInput(xStr, yStr);
  if (!v.valid) throw new Error(v.reason);
  const x = BigInt(v.x);
  const y = BigInt(v.y);
  const collector = createDncCollector();
  karatsubaRec(x, y, collector.emit.bind(collector), 0, 'k-0', null, v.x, v.y);
  return collector.events;
}

/**
 * run(): compute the exact product, returning output plus the event stream.
 *
 * @param {string} xStr
 * @param {string} yStr
 * @returns {{ x: string, y: string, product: string | null, events: object[] }}
 */
export function karatsubaRun(xStr, yStr) {
  const events = karatsubaDebug(xStr, yStr);
  const last = events[events.length - 1];
  const product =
    last && last.stateSnapshot && last.stateSnapshot.result != null
      ? String(last.stateSnapshot.result)
      : null;
  return {
    x: String(xStr).trim(),
    y: String(yStr).trim(),
    product,
    events,
  };
}

/**
 * steps(): produce a frame-per-event list for visualizers.
 *
 * Each frame exposes the current operands, split info (m, high/low), the
 * recursive target, recombination values, and the returned result when
 * available. Frames are plain serializable data (strings/numbers).
 *
 * @param {string} xStr
 * @param {string} yStr
 * @returns {object[]}
 */
export function karatsubaSteps(xStr, yStr) {
  const events = karatsubaDebug(xStr, yStr);
  return events.map((event, step) => {
    const s = event.stateSnapshot;
    return {
      step,
      phase: event.type,
      subproblem: event.subproblem,
      log: event.action,
      depth: event.depth,
      activeLine: step,
      x: s.x ?? null,
      y: s.y ?? null,
      sign: s.sign ?? null,
      m: s.m ?? null,
      xHigh: s.xHigh ?? null,
      xLow: s.xLow ?? null,
      yHigh: s.yHigh ?? null,
      yLow: s.yLow ?? null,
      recurseTarget: s.recurseTarget ?? null,
      targetExpression: s.targetExpression ?? null,
      z0: s.z0 ?? null,
      z1: s.z1 ?? null,
      z2: s.z2 ?? null,
      termHigh: s.termHigh ?? null,
      middleTerm: s.middleTerm ?? null,
      absProduct: s.absProduct ?? null,
      result: s.result ?? null,
      direct: s.direct === true,
      nodeId: event.nodeId,
      parentId: event.parentId,
      meta: event.meta,
    };
  });
}