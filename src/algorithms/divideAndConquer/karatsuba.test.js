import { describe, expect, it } from 'vitest';
import {
  KARA_BASE_DIGITS,
  normalizeBigIntString,
  parseKaratsubaInput,
  splitBigIntString,
  validateKaratsubaInput,
  karatsubaRun,
  karatsubaSteps,
  karatsubaDebug,
} from './karatsuba';

/** Native BigInt reference product as a string. */
function nativeProduct(xStr, yStr) {
  return (BigInt(xStr) * BigInt(yStr)).toString();
}

function prod(xStr, yStr) {
  const out = karatsubaRun(xStr, yStr);
  expect(out).toHaveProperty('product');
  return out.product;
}

function expectProduct(xStr, yStr) {
  expect(prod(xStr, yStr)).toBe(nativeProduct(xStr, yStr));
}

describe('normalizeBigIntString / parseKaratsubaInput', () => {
  it('normalizes signs and leading zeros', () => {
    expect(normalizeBigIntString('1234')).toBe('1234');
    expect(normalizeBigIntString('  +42 ')).toBe('42');
    expect(normalizeBigIntString('-0042')).toBe('-42');
    expect(normalizeBigIntString('0000')).toBe('0');
    expect(normalizeBigIntString('-0')).toBe('0');
  });

  it('parses to exact BigInt', () => {
    expect(parseKaratsubaInput('12345678901234567890')).toBe(
      12345678901234567890n,
    );
    expect(parseKaratsubaInput('-999')).toBe(-999n);
  });

  it('rejects non-integer input', () => {
    expect(() => parseKaratsubaInput('12x')).toThrow();
    expect(() => parseKaratsubaInput('1.5')).toThrow();
    expect(() => parseKaratsubaInput('')).toThrow();
    expect(() => parseKaratsubaInput('   ')).toThrow();
  });
});

describe('validateKaratsubaInput', () => {
  it('accepts valid integer strings', () => {
    expect(validateKaratsubaInput('1234', '5678')).toEqual({
      valid: true,
      x: '1234',
      y: '5678',
    });
    expect(validateKaratsubaInput(' -0 ', '+7').valid).toBe(true);
  });

  it('rejects empty, malformed, or non-integer operands', () => {
    expect(validateKaratsubaInput('', '5').valid).toBe(false);
    expect(validateKaratsubaInput('5', ' ').valid).toBe(false);
    expect(validateKaratsubaInput('12a', '5').valid).toBe(false);
    expect(validateKaratsubaInput('12.5', '5').valid).toBe(false);
    expect(validateKaratsubaInput('12', '--5').valid).toBe(false);
    expect(validateKaratsubaInput('12', '5').reason).toBeUndefined();
  });

  it('rejects oversized operands instead of truncating', () => {
    const big = '9'.repeat(30);
    const v = validateKaratsubaInput(big, '12', 16);
    expect(v.valid).toBe(false);
    expect(v.reason).toMatch(/30 digits \(limit 16\)/);

    // No limit → accepted.
    expect(validateKaratsubaInput(big, '12').valid).toBe(true);
    // At the limit → accepted.
    expect(validateKaratsubaInput('9'.repeat(16), '12', 16).valid).toBe(true);
  });
});

describe('splitBigIntString', () => {
  it('splits into high/low around 10^m', () => {
    expect(splitBigIntString('1234', 2)).toEqual({
      high: 12n,
      low: 34n,
      m: 2,
      len: 4,
    });
    expect(splitBigIntString('5678', 2).high).toBe(56n);
    expect(splitBigIntString('5678', 2).low).toBe(78n);
  });

  it('keeps low-part leading zeros as a numeric value', () => {
    expect(splitBigIntString('1002', 2)).toEqual({
      high: 10n,
      low: 2n,
      m: 2,
      len: 4,
    });
    expect(splitBigIntString('5', 2)).toEqual({
      high: 0n,
      low: 5n,
      m: 2,
      len: 1,
    });
  });
});

describe('karatsubaRun correctness', () => {
  it('zero operands', () => {
    expect(prod('0', '123')).toBe('0');
    expect(prod('123', '0')).toBe('0');
    expect(prod('0', '0')).toBe('0');
    expect(prod('-5', '0')).toBe('0');
  });

  it('identity with 1', () => {
    expect(prod('1', '1')).toBe('1');
    expect(prod('1', '98765')).toBe('98765');
    expect(prod('98765', '1')).toBe('98765');
  });

  it('small numbers', () => {
    expectProduct('9', '9');
    expectProduct('12', '34');
    expectProduct('123', '456');
    expectProduct('1234', '5678');
    expect(prod('1234', '5678')).toBe('7006652');
  });

  it('powers of 10', () => {
    expectProduct('10', '10');
    expectProduct('1000', '1000000');
    expectProduct('1'.padEnd(22, '0'), '1'.padEnd(7, '0'));
  });

  it('odd digit lengths', () => {
    expectProduct('12345', '6789');
    expectProduct('99999', '99999');
    expectProduct('123456789', '987654321');
  });

  it('different digit lengths', () => {
    expectProduct('123', '45678901');
    expectProduct('1', '100000000000');
    expectProduct('999999999', '1');
  });

  it('negative numbers', () => {
    expect(prod('-1234', '5678')).toBe('-7006652');
    expect(prod('1234', '-5678')).toBe('-7006652');
    expect(prod('-1234', '-5678')).toBe('7006652');
    expectProduct('-999999999999', '888888888888');
  });

  it('large values beyond Number.MAX_SAFE_INTEGER', () => {
    const a = '12345678901234567890';
    const b = '98765432109876543210';
    expectProduct(a, b);
    expect(prod(a, b)).toBe('1219326311370217952237463801111263526900');

    // Even larger: 40 digits each.
    const c = '1234567890123456789012345678901234567890';
    const d = '9876543210987654321098765432109876543210';
    expectProduct(c, d);
  });

  it('cross-checks many random digit strings against BigInt', () => {
    let seed = 1234;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return ((seed >>> 0) % 1000000) / 1000000;
    };
    const randDigits = (maxLen) => {
      const len = Math.floor(rnd() * maxLen) + 1;
      let s = '';
      for (let i = 0; i < len; i += 1) {
        s += Math.floor(rnd() * 10);
      }
      // Strip leading zeros so it behaves like a real number.
      s = s.replace(/^0+/, '');
      return s === '' ? '0' : s;
    };

    for (let trial = 0; trial < 200; trial += 1) {
      let a = randDigits(30);
      let b = randDigits(30);
      if (rnd() < 0.4) a = '-' + a;
      if (rnd() < 0.4) b = '-' + b;
      expectProduct(a, b);
    }
  });
});

describe('recursive event structure', () => {
  it('emits the D&C vocabulary with recursion', () => {
    const events = karatsubaDebug('12345678901234567890', '98765432109876543210');
    const types = events.map((e) => e.type);

    expect(types).toContain('enter');
    expect(types).toContain('divide');
    expect(types).toContain('recurse');
    expect(types).toContain('baseCase');
    expect(types).toContain('combine');
    expect(types).toContain('return');

    // Must actually recurse (depth > 1) — a cheating a*b would be flat.
    expect(Math.max(...events.map((e) => e.depth))).toBeGreaterThan(1);

    // Three recursive targets per split node.
    const targets = new Set(
      events
        .filter((e) => e.type === 'recurse' && e.meta)
        .map((e) => e.meta.recurseTarget),
    );
    expect(targets).toEqual(new Set(['z0', 'z1', 'z2']));

    // Base cases are clearly labeled as direct multiplication.
    const baseCases = events.filter(
      (e) => e.type === 'baseCase' && e.meta && e.meta.direct,
    );
    expect(baseCases.length).toBeGreaterThan(0);
    for (const e of baseCases) {
      expect(e.meta.direct).toBe(true);
      expect(e.stateSnapshot.result).toBeDefined();
    }
  });

  it('uses node ids forming a ternary recursion tree', () => {
    const events = karatsubaDebug('123456789', '987654321');
    const first = events[0];
    expect(first.nodeId).toBe('k-0');
    expect(first.parentId).toBeNull();

    const childIds = new Set(
      events
        .filter((e) => e.parentId === 'k-0' && e.nodeId !== 'k-0')
        .map((e) => e.nodeId),
    );
    expect(childIds).toEqual(new Set(['k-0-z0', 'k-0-z1', 'k-0-z2']));
  });

  it('small inputs never split (base case only)', () => {
    const events = karatsubaDebug('12', '34');
    expect(events.some((e) => e.type === 'divide')).toBe(false);
    expect(events.some((e) => e.type === 'baseCase')).toBe(true);
  });

  it('events are deterministic across calls', () => {
    const a = karatsubaDebug('1234', '5678');
    const b = karatsubaDebug('1234', '5678');
    expect(a).toHaveLength(b.length);
    for (let i = 0; i < a.length; i += 1) {
      expect(a[i].eventId).toBe(b[i].eventId);
      expect(a[i].type).toBe(b[i].type);
      expect(a[i].depth).toBe(b[i].depth);
      expect(a[i].subproblem).toBe(b[i].subproblem);
    }
  });
});

describe('split / z0 / z1 / z2 / recombination semantics', () => {
  it('divide event reports the correct split', () => {
    const events = karatsubaDebug('1234', '5678');
    const divide = events.find((e) => e.type === 'divide');

    expect(divide).toBeDefined();
    expect(divide.meta.m).toBe(2);
    expect(divide.meta.xHigh).toBe('12');
    expect(divide.meta.xLow).toBe('34');
    expect(divide.meta.yHigh).toBe('56');
    expect(divide.meta.yLow).toBe('78');
    expect(divide.stateSnapshot.m).toBe(2);
  });

  it('recurse events carry the target expression', () => {
    const events = karatsubaDebug('1234', '5678');
    const z0 = events.find(
      (e) => e.type === 'recurse' && e.meta.recurseTarget === 'z0',
    );
    const z1 = events.find(
      (e) => e.type === 'recurse' && e.meta.recurseTarget === 'z1',
    );
    const z2 = events.find(
      (e) => e.type === 'recurse' && e.meta.recurseTarget === 'z2',
    );

    expect(z0.meta.targetExpression).toBe('34 × 78');
    expect(z1.meta.targetExpression).toBe('46 × 134');
    expect(z2.meta.targetExpression).toBe('12 × 56');
  });

  it('combine event reports z0/z1/z2 and the recombination terms', () => {
    const events = karatsubaDebug('1234', '5678');
    const combines = events.filter(
      (e) => e.type === 'combine' && e.meta && e.meta.recombination,
    );
    const root = combines.find((e) => e.nodeId === 'k-0');

    expect(root).toBeDefined();
    expect(root.stateSnapshot.z0).toBe('2652');
    expect(root.stateSnapshot.z1).toBe('6164');
    expect(root.stateSnapshot.z2).toBe('672');
    // z2·10^(2m), (z1 − z2 − z0)·10^m, and the sum.
    expect(root.stateSnapshot.termHigh).toBe('6720000');
    expect(root.stateSnapshot.middleTerm).toBe('284000');
    expect(root.stateSnapshot.absProduct).toBe('7006652');
    expect(root.stateSnapshot.result).toBe('7006652');
  });

  it('recombination identity holds for every combine event', () => {
    const events = karatsubaDebug('123456789', '987654321');
    for (const e of events) {
      if (e.type !== 'combine' || !e.stateSnapshot.termHigh) continue;
      const { z0, z1, z2, termHigh, middleTerm, result } = e.stateSnapshot;
      const m = e.stateSnapshot.m;
      expect(BigInt(termHigh)).toBe(BigInt(z2) * 10n ** BigInt(2 * m));
      expect(BigInt(middleTerm)).toBe(
        (BigInt(z1) - BigInt(z2) - BigInt(z0)) * 10n ** BigInt(m),
      );
      expect(BigInt(result)).toBe(
        BigInt(termHigh) + BigInt(middleTerm) + BigInt(z0),
      );
    }
  });

  it('KARA_BASE_DIGITS guards the direct-multiplication base case', () => {
    expect(KARA_BASE_DIGITS).toBeGreaterThan(0);
    // 4-digit operands must split; 3-digit operands must not.
    expect(karatsubaDebug('9999', '1').some((e) => e.type === 'divide')).toBe(
      true,
    );
    expect(karatsubaDebug('999', '1').some((e) => e.type === 'divide')).toBe(
      false,
    );
  });
});

describe('steps frames', () => {
  it('produces a frame per event with readable fields', () => {
    const frames = karatsubaSteps('1234', '5678');
    expect(frames.length).toBeGreaterThan(0);

    const divide = frames.find((f) => f.phase === 'divide');
    expect(divide).toBeDefined();
    expect(divide.x).toBe('1234');
    expect(divide.y).toBe('5678');
    expect(divide.m).toBe(2);
    expect(divide.xHigh).toBe('12');
    expect(divide.xLow).toBe('34');
    expect(divide.yHigh).toBe('56');
    expect(divide.yLow).toBe('78');

    const last = frames[frames.length - 1];
    expect(last.phase).toBe('return');
    expect(last.result).toBe('7006652');
  });

  it('frames are independent objects', () => {
    const frames = karatsubaSteps('1234', '5678');
    frames[0].__mut = true;
    expect(frames[1].__mut).toBeUndefined();
  });
});

describe('immutable snapshots', () => {
  it('mutating an early event does not affect later events', () => {
    const events = karatsubaDebug('1234', '5678');
    const first = events[0];
    const last = events[events.length - 1];

    first.stateSnapshot.x = '999999';
    expect(last.stateSnapshot.x).toBe('1234');

    // Deep mutation of a nested meta value is also isolated.
    const divide = events.find((e) => e.type === 'divide');
    divide.meta.xHigh = 'bogus';
    const otherDivide = events[events.length - 1];
    expect(otherDivide.meta).not.toBe(divide.meta);
  });

  it('karatsubaRun does not mutate its inputs', () => {
    const x = '1234';
    const y = '5678';
    karatsubaRun(x, y);
    expect(x).toBe('1234');
    expect(y).toBe('5678');
  });
});