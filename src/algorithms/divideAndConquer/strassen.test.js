import { describe, expect, it } from 'vitest';
import {
  STRASSEN_DEFAULT_MAX_N,
  matAdd,
  matSub,
  splitQuadrants,
  joinQuadrants,
  validateStrassenInput,
  strassenRun,
  strassenSteps,
  strassenDebug,
} from './strassen';

/** Canonical 2×2 example used across several suites. */
const A = [
  [1, 2],
  [3, 4],
];
const B = [
  [5, 6],
  [7, 8],
];

/** Reference O(n³) schoolbook multiplication. */
function naiveMultiply(a, b) {
  const n = a.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let k = 0; k < n; k += 1) {
      for (let j = 0; j < n; j += 1) {
        out[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return out;
}

function expectMatrixEqual(actual, expected) {
  expect(actual).toEqual(expected);
}

function strassenProduct(a, b) {
  const out = strassenRun(a, b);
  expect(out).toHaveProperty('c');
  return out.c;
}

function expectProduct(a, b) {
  expectMatrixEqual(strassenProduct(a, b), naiveMultiply(a, b));
}

describe('matrix helpers', () => {
  it('matAdd / matSub are element-wise', () => {
    const a = [
      [1, 2],
      [3, 4],
    ];
    const b = [
      [5, 6],
      [7, 8],
    ];
    expect(matAdd(a, b)).toEqual([
      [6, 8],
      [10, 12],
    ]);
    expect(matSub(b, a)).toEqual([
      [4, 4],
      [4, 4],
    ]);
    expect(matAdd(a, b)).not.toBe(a);
  });

  it('splitQuadrants splits 4×4 into four 2×2 quadrants', () => {
    const m = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    const q = splitQuadrants(m);
    expect(q.a11).toEqual([
      [1, 2],
      [5, 6],
    ]);
    expect(q.a12).toEqual([
      [3, 4],
      [7, 8],
    ]);
    expect(q.a21).toEqual([
      [9, 10],
      [13, 14],
    ]);
    expect(q.a22).toEqual([
      [11, 12],
      [15, 16],
    ]);
  });

  it('joinQuadrants inverts splitQuadrants', () => {
    const m = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    const q = splitQuadrants(m);
    expect(joinQuadrants(q.a11, q.a12, q.a21, q.a22)).toEqual(m);
  });
});

describe('validateStrassenInput', () => {
  it('accepts power-of-two square matrices', () => {
    expect(
      validateStrassenInput(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ),
    ).toEqual({ valid: true });
    expect(validateStrassenInput([[7]], [[3]])).toEqual({ valid: true });
  });

  it('rejects non-square, ragged, or empty matrices', () => {
    expect(validateStrassenInput([[1, 2]], [[1, 2]]).valid).toBe(false);
    expect(
      validateStrassenInput(
        [
          [1, 2],
          [3],
        ],
        [
          [1, 2],
          [3, 4],
        ],
      ).valid,
    ).toBe(false);
    expect(validateStrassenInput([], [[1]]).valid).toBe(false);
  });

  it('rejects mismatched sizes', () => {
    const v = validateStrassenInput(
      [
        [1, 2],
        [3, 4],
      ],
      [[5]],
    );
    expect(v.valid).toBe(false);
    expect(v.reason).toMatch(/same size/);
  });

  it('rejects non-power-of-two sizes without silently padding', () => {
    const m3 = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const v = validateStrassenInput(m3, m3);
    expect(v.valid).toBe(false);
    expect(v.reason).toMatch(/not a power of two/);
    expect(v.reason).toMatch(/never silently padded/);
  });

  it('rejects oversized matrices with a clear limit', () => {
    const m16 = Array.from({ length: 16 }, () => Array(16).fill(1));
    const v = validateStrassenInput(m16, m16);
    expect(v.valid).toBe(false);
    expect(v.reason).toMatch(/max 8×8/);

    // At the limit → accepted.
    const m8 = Array.from({ length: 8 }, () => Array(8).fill(1));
    expect(validateStrassenInput(m8, m8).valid).toBe(true);
    expect(STRASSEN_DEFAULT_MAX_N).toBe(8);
  });

  it('rejects non-finite entries', () => {
    expect(
      validateStrassenInput(
        [
          [1, NaN],
          [3, 4],
        ],
        [
          [1, 2],
          [3, 4],
        ],
      ).valid,
    ).toBe(false);
    expect(
      validateStrassenInput(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 'x'],
          [3, 4],
        ],
      ).valid,
    ).toBe(false);
  });
});

describe('strassenRun correctness', () => {
  it('1×1 matrices', () => {
    expectProduct([[7]], [[3]]);
    expect(strassenProduct([[7]], [[3]])).toEqual([[21]]);
    expectProduct([[-5]], [[4]]);
  });

  it('2×2 matrices', () => {
    const a = [
      [1, 2],
      [3, 4],
    ];
    const b = [
      [5, 6],
      [7, 8],
    ];
    expectProduct(a, b);
    expect(strassenProduct(a, b)).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });

  it('4×4 matrices', () => {
    const a = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    const b = [
      [2, 0, 1, 3],
      [4, 1, 5, 2],
      [0, 3, 2, 1],
      [1, 2, 4, 5],
    ];
    expectProduct(a, b);
  });

  it('identity matrix', () => {
    const a = [
      [1, 2],
      [3, 4],
    ];
    const id = [
      [1, 0],
      [0, 1],
    ];
    expect(strassenProduct(a, id)).toEqual(a);
    expect(strassenProduct(id, a)).toEqual(a);

    const id4 = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    expectProduct(
      [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ],
      id4,
    );
  });

  it('zero matrix', () => {
    const zero = [
      [0, 0],
      [0, 0],
    ];
    const a = [
      [1, 2],
      [3, 4],
    ];
    expect(strassenProduct(zero, a)).toEqual(zero);
    expect(strassenProduct(a, zero)).toEqual(zero);
  });

  it('negative values', () => {
    expectProduct(
      [
        [-1, 2],
        [3, -4],
      ],
      [
        [5, -6],
        [-7, 8],
      ],
    );
    expectProduct(
      [
        [-2, 1, 3, -1],
        [4, -5, -6, 2],
        [1, 1, -1, 1],
        [-3, 0, 2, -2],
      ],
      [
        [1, -2, 3, 4],
        [-5, 6, -7, 8],
        [9, -10, 11, -12],
        [-13, 14, -15, 16],
      ],
    );
  });

  it('8×8 matrices (max supported size)', () => {
    // Deterministic pseudo-random values.
    let seed = 42;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return ((seed >>> 0) % 21) - 10; // −10..10
    };
    const a = Array.from({ length: 8 }, () => Array.from({ length: 8 }, rnd));
    const b = Array.from({ length: 8 }, () => Array.from({ length: 8 }, rnd));
    expectProduct(a, b);
  });

  it('cross-checks many random small matrices against naive multiplication', () => {
    let seed = 987;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) | 0;
      return ((seed >>> 0) % 19) - 9; // −9..9
    };
    for (let trial = 0; trial < 30; trial += 1) {
      const n = [1, 2, 4][trial % 3];
      const a = Array.from({ length: n }, () => Array.from({ length: n }, rnd));
      const b = Array.from({ length: n }, () => Array.from({ length: n }, rnd));
      expectProduct(a, b);
    }
  });
});

describe('recursive event structure', () => {
  it('emits the D&C vocabulary with seven recursive products', () => {
    // 4×4 so the recursion is genuinely multi-level.
    const events = strassenDebug(
      [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ],
      [
        [1, 0, 1, 0],
        [0, 1, 0, 1],
        [1, 0, 1, 0],
        [0, 1, 0, 1],
      ],
    );
    const types = events.map((e) => e.type);

    expect(types).toContain('enter');
    expect(types).toContain('divide');
    expect(types).toContain('recurse');
    expect(types).toContain('baseCase');
    expect(types).toContain('combine');
    expect(types).toContain('return');

    // Must actually recurse — a silent a*b shortcut would be flat.
    expect(Math.max(...events.map((e) => e.depth))).toBeGreaterThan(1);

    // Exactly the seven Strassen targets, in order.
    const targets = events
      .filter((e) => e.type === 'recurse' && e.parentId === 's-0')
      .map((e) => e.meta.target);
    expect(targets).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7']);
  });

  it('uses node ids forming a 7-ary recursion tree', () => {
    const events = strassenDebug(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ],
    );
    const first = events[0];
    expect(first.nodeId).toBe('s-0');
    expect(first.parentId).toBeNull();

    const childIds = new Set(
      events
        .filter((e) => e.parentId === 's-0' && e.nodeId !== 's-0')
        .map((e) => e.nodeId),
    );
    expect(childIds).toEqual(
      new Set([
        's-0-M1',
        's-0-M2',
        's-0-M3',
        's-0-M4',
        's-0-M5',
        's-0-M6',
        's-0-M7',
      ]),
    );

    // 2×2 split produces 7 children of 1×1 base cases.
    const baseCases = events.filter((e) => e.type === 'baseCase');
    expect(baseCases.length).toBe(7);
  });

  it('1×1 never splits', () => {
    const events = strassenDebug([[7]], [[3]]);
    expect(events.some((e) => e.type === 'divide')).toBe(false);
    expect(events.some((e) => e.type === 'baseCase')).toBe(true);
  });

  it('recursion depth grows with matrix size', () => {
    const d2 = Math.max(...strassenDebug([[1, 2], [3, 4]], [[5, 6], [7, 8]]).map((e) => e.depth));
    const d4 = Math.max(
      ...strassenDebug(
        [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
        [
          [1, 0, 1, 0],
          [0, 1, 0, 1],
          [1, 0, 1, 0],
          [0, 1, 0, 1],
        ],
      ).map((e) => e.depth),
    );
    expect(d4).toBe(d2 + 1);
  });
});

describe('partition / M1–M7 / recombination semantics', () => {
  it('divide event reports the quadrant partitions', () => {
    const events = strassenDebug(A, B);
    const divide = events.find((e) => e.type === 'divide');
    expect(divide).toBeDefined();
    expect(divide.meta.n).toBe(2);
    expect(divide.meta.qn).toBe(1);
    expect(divide.meta.quadrants.a11).toEqual([[1]]);
    expect(divide.meta.quadrants.a12).toEqual([[2]]);
    expect(divide.meta.quadrants.a21).toEqual([[3]]);
    expect(divide.meta.quadrants.a22).toEqual([[4]]);
    expect(divide.meta.quadrants.b11).toEqual([[5]]);
    expect(divide.meta.quadrants.b12).toEqual([[6]]);
    expect(divide.meta.quadrants.b21).toEqual([[7]]);
    expect(divide.meta.quadrants.b22).toEqual([[8]]);
    expect(divide.stateSnapshot.qn).toBe(1);
  });

  it('addition events cover S1..S10 with correct operands', () => {
    const events = strassenDebug(A, B);
    const additions = events.filter(
      (e) => e.type === 'combine' && e.meta && e.meta.stage === 'addition',
    );
    expect(additions.length).toBe(10);
    const byLabel = Object.fromEntries(additions.map((e) => [e.meta.label, e]));

    // S1 = A11 + A22 = [[1]] + [[4]] = [[5]]
    expect(byLabel.S1.meta.expression).toBe('A11 + A22');
    expect(byLabel.S1.meta.result).toEqual([[5]]);
    // S4 = B12 − B22 = [[6]] − [[8]] = [[−2]]
    expect(byLabel.S4.meta.expression).toBe('B12 − B22');
    expect(byLabel.S4.meta.result).toEqual([[-2]]);
    // S7 = A21 − A11 = [[3]] − [[1]] = [[2]]
    expect(byLabel.S7.meta.result).toEqual([[2]]);
    expect(byLabel.S7.meta.left).toEqual([[3]]);
    expect(byLabel.S7.meta.right).toEqual([[1]]);
  });

  it('recurse events carry the M1..M7 expressions and matrices', () => {
    const events = strassenDebug(A, B);
    const byTarget = Object.fromEntries(
      events
        .filter((e) => e.type === 'recurse' && e.parentId === 's-0')
        .map((e) => [e.meta.target, e]),
    );

    expect(byTarget.M1.meta.expression).toBe('(A11 + A22) × (B11 + B22)');
    expect(byTarget.M1.meta.a).toEqual([[5]]); // S1
    expect(byTarget.M1.meta.b).toEqual([[13]]); // S2 = 5 + 8
    expect(byTarget.M7.meta.expression).toBe('(A12 − A22) × (B21 + B22)');
    expect(byTarget.M7.meta.a).toEqual([[-2]]); // A12 − A22 = 2 − 4
    expect(byTarget.M7.meta.b).toEqual([[15]]); // B21 + B22 = 7 + 8
  });

  it('M1..M7 products are correct', () => {
    const events = strassenDebug(A, B);
    const results = {};
    for (const e of events) {
      if (e.type === 'recurse' && e.parentId === 's-0') {
        // The child's baseCase meta carries the scalar product.
        const childId = e.nodeId;
        const base = events.find(
          (ev) => ev.nodeId === childId && ev.type === 'baseCase',
        );
        results[e.meta.target] = base.meta.product[0][0];
      }
    }
    // Verified against the hand-computed Strassen formulas:
    expect(results).toEqual({
      M1: 5 * 13, // 65  (A11+A22)(B11+B22)
      M2: 7 * 5, // 35   (A21+A22)·B11
      M3: 1 * -2, // −2   A11·(B12−B22)
      M4: 4 * 2, // 8    A22·(B21−B11)
      M5: 3 * 8, // 24   (A11+A12)·B22
      M6: 2 * 11, // 22   (A21−A11)(B11+B12)
      M7: -2 * 15, // −30  (A12−A22)(B21+B22)
    });
  });

  it('recombination formulas reconstruct C correctly', () => {
    const events = strassenDebug(A, B);
    const recombine = events.find(
      (e) => e.type === 'combine' && e.meta && e.meta.stage === 'recombine',
    );
    expect(recombine).toBeDefined();

    const m = recombine.meta;
    expect(m.m1).toEqual([[65]]);
    expect(m.m2).toEqual([[35]]);
    expect(m.m3).toEqual([[-2]]);
    expect(m.m4).toEqual([[8]]);
    expect(m.m5).toEqual([[24]]);
    expect(m.m6).toEqual([[22]]);
    expect(m.m7).toEqual([[-30]]);

    // C11 = M1 + M4 − M5 + M7 = 65 + 8 − 24 − 30 = 19
    expect(m.c11).toEqual([[19]]);
    // C12 = M3 + M5 = −2 + 24 = 22
    expect(m.c12).toEqual([[22]]);
    // C21 = M2 + M4 = 35 + 8 = 43
    expect(m.c21).toEqual([[43]]);
    // C22 = M1 − M2 + M3 + M6 = 65 − 35 − 2 + 22 = 50
    expect(m.c22).toEqual([[50]]);

    expect(m.formulas.c11).toBe('M1 + M4 − M5 + M7');
    expect(m.formulas.c22).toBe('M1 − M2 + M3 + M6');
    expect(m.result).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });

  it('stateSnapshot stays small and readable (matrices live in meta)', () => {
    const events = strassenDebug(A, B);
    for (const e of events) {
      const keys = Object.keys(e.stateSnapshot);
      for (const k of keys) {
        expect(['n', 'stage', 'qn', 'target', 'label']).toContain(k);
      }
    }
  });
});

describe('steps frames', () => {
  it('produces a frame per event with readable fields', () => {
    const frames = strassenSteps(A, B);
    expect(frames.length).toBeGreaterThan(0);

    const divide = frames.find((f) => f.phase === 'divide');
    expect(divide).toBeDefined();
    expect(divide.n).toBe(2);
    expect(divide.stage).toBe('divide');

    const firstRecurse = frames.find((f) => f.phase === 'recurse');
    expect(firstRecurse.target).toBe('M1');

    const last = frames[frames.length - 1];
    expect(last.phase).toBe('return');
    expect(last.result).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });

  it('frames are independent objects', () => {
    const frames = strassenSteps(A, B);
    frames[0].__mut = true;
    expect(frames[1].__mut).toBeUndefined();
  });
});

describe('immutable snapshots', () => {
  it('mutating an early event meta does not affect later events', () => {
    const events = strassenDebug(A, B);
    const divide = events.find((e) => e.type === 'divide');
    divide.meta.a[0][0] = 999;

    // The final result is untouched by the mutation.
    const last = events[events.length - 1];
    expect(last.meta.result).toEqual([
      [19, 22],
      [43, 50],
    ]);
    expect(last.meta.result[0][0]).toBe(19);

    // Each event owns an isolated deep clone of meta.
    const otherDivide = events.find((e) => e.type === 'divide' && e !== divide);
    if (otherDivide) expect(otherDivide.meta).not.toBe(divide.meta);

    // And the original caller operand object was never mutated.
    expect(A[0][0]).toBe(1);
  });

  it('strassenRun does not mutate its inputs', () => {
    const a = [
      [1, 2],
      [3, 4],
    ];
    const b = [
      [5, 6],
      [7, 8],
    ];
    strassenRun(a, b);
    expect(a).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(b).toEqual([
      [5, 6],
      [7, 8],
    ]);
  });
});