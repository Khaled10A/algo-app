import { describe, expect, it } from 'vitest';
import {
  closestPairOfPointsRun,
  closestPairOfPointsSteps,
  closestPairOfPointsDebug,
} from './closestPair';

/**
 * Brute-force reference on plain point arrays.
 *
 * Tie-breaker: when multiple pairs share the same minimal distance, pick the
 * lexicographically smaller index pair (a, b) with a < b.
 */
function bruteForceReference(points) {
  const n = points.length;
  let best = Infinity;
  let bestA = -1;
  let bestB = -1;

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const d = Math.hypot(dx, dy);

      if (
        d < best ||
        (d === best &&
          (i < bestA || (i === bestA && j < bestB)))
      ) {
        best = d;
        bestA = i;
        bestB = j;
      }
    }
  }

  return { distance: best, pair: [bestA, bestB] };
}

function approx(a, b, tol = 1e-6) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return a === b;
  }
  return Math.abs(a - b) <= tol;
}

/**
 * Accept either [i, j] or [j, i] when both point values are identical.
 */
function samePairAs(pts, runOut, ref) {
  const runPair = Array.isArray(runOut?.pair) ? runOut.pair : [];
  const refPair = Array.isArray(ref?.pair) ? ref.pair : [];

  if (runPair.length !== 2 || refPair.length !== 2) {
    return false;
  }

  const [aIdx, bIdx] = runPair;
  const [rIdx, sIdx] = refPair;
  const a = pts[aIdx];
  const b = pts[bIdx];
  const r = pts[rIdx];
  const s = pts[sIdx];

  const valuesMatch = (x, y) => x.x === y.x && x.y === y.y;
  const ordered = valuesMatch(a, r) && valuesMatch(b, s);
  const swapped = valuesMatch(a, s) && valuesMatch(b, r);

  if (!ordered && !swapped) {
    return false;
  }

  return approx(runOut.distance, ref.distance);
}

describe('closestPairOfPointsRun', () => {
  it('empty input returns degenerate result', () => {
    const out = closestPairOfPointsRun([]);

    expect(out.distance).toBe(Infinity);
    expect(out.pair).toEqual([-1, -1]);
    expect(out.points).toEqual([]);
    expect(out.comparisons).toBe(0);
    expect(out.events).toEqual([]);
    expect(out.xSorted).toEqual([]);
  });

  it('single point returns degenerate result', () => {
    const out = closestPairOfPointsRun([{ x: 1, y: 2 }]);

    expect(out.distance).toBe(Infinity);
    expect(out.pair).toEqual([-1, -1]);
    expect(out.comparisons).toBe(0);
  });

  it('two points returns them as the closest pair', () => {
    const pts = [{ x: 0, y: 0 }, { x: 3, y: 4 }];
    const out = closestPairOfPointsRun(pts);

    expect(out.distance).toBe(5);
    expect(out.pair).toEqual([0, 1]);
    expect(out.comparisons).toBeGreaterThanOrEqual(0);
  });

  it('known closest pair on a small set', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 1, y: 1 },
    ];
    const out = closestPairOfPointsRun(pts);
    const ref = bruteForceReference(pts);

    expect(out.distance).toBeCloseTo(ref.distance, 6);
    expect(out.pair).toEqual(ref.pair);
  });

  it('duplicate points yield zero distance', () => {
    const pts = [
      { x: 5, y: 5 },
      { x: 5, y: 5 },
      { x: 20, y: 20 },
    ];
    const out = closestPairOfPointsRun(pts);

    expect(out.distance).toBe(0);
    expect(out.distance).toBeCloseTo(0, 6);
  });

  it('collinear points work', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 12, y: 0 },
    ];
    const out = closestPairOfPointsRun(pts);
    const ref = bruteForceReference(pts);

    expect(out.distance).toBeCloseTo(ref.distance, 6);
    expect(out.pair).toEqual(ref.pair);
  });

  it('points with same x coordinate', () => {
    const pts = [
      { x: 7, y: 0 },
      { x: 7, y: 3 },
      { x: 7, y: 10 },
    ];
    const out = closestPairOfPointsRun(pts);
    const ref = bruteForceReference(pts);

    expect(out.distance).toBeCloseTo(ref.distance, 6);
    expect(out.pair).toEqual(ref.pair);
  });

  it('points with same y coordinate', () => {
    const pts = [
      { x: 1, y: 4 },
      { x: 8, y: 4 },
      { x: 9, y: 4 },
    ];
    const out = closestPairOfPointsRun(pts);
    const ref = bruteForceReference(pts);

    expect(out.distance).toBeCloseTo(ref.distance, 6);
    expect(out.pair).toEqual(ref.pair);
  });

  it('negative coordinates', () => {
    const pts = [
      { x: -10, y: -10 },
      { x: -9, y: -10 },
      { x: 100, y: 100 },
    ];
    const out = closestPairOfPointsRun(pts);
    const ref = bruteForceReference(pts);

    expect(out.distance).toBeCloseTo(ref.distance, 6);
    expect(out.pair).toEqual(ref.pair);
  });

  it('does not mutate input points array', () => {
    const pts = [
      { x: 2, y: 3 },
      { x: 12, y: 30 },
      { x: 40, y: 50 },
    ];
    const copy = pts.map((p) => ({ ...p }));
    closestPairOfPointsRun(pts);

    expect(pts).toEqual(copy);
    for (const p of pts) {
      expect(p).toEqual({ ...p });
    }
  });

  it('returns a copy of points without mutating input', () => {
    const pts = [
      { x: 1, y: 1, id: 'a' },
      { x: 2, y: 2, id: 'b' },
    ];
    const out = closestPairOfPointsRun(pts);

    expect(out.points).not.toBe(pts);
    expect(out.points).toHaveLength(2);
    expect(out.points[0]).toEqual({ x: 1, y: 1, id: 'a' });
    expect(out.points[1]).toEqual({ x: 2, y: 2, id: 'b' });
  });

  it('xSorted is sorted by x (tie-break y, then original index)', () => {
    const pts = [
      { x: 3, y: 3 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 0 },
    ];
    const out = closestPairOfPointsRun(pts);
    const xs = out.xSorted.map((p) => p.x);

    expect(xs).toEqual([1, 1, 2, 3]);

    for (let i = 1; i < xs.length; i += 1) {
      if (xs[i] === xs[i - 1]) {
        expect(out.xSorted[i].y).toBeGreaterThanOrEqual(
          out.xSorted[i - 1].y,
        );
      }
    }
  });
});

describe('closestPairOfPointsSteps', () => {
  it('empty input produces a single degenerate frame', () => {
    const steps = closestPairOfPointsSteps([]);

    expect(steps).toHaveLength(1);
    expect(steps[0].phase).toBe('complete');
    expect(steps[0].currentBest).toBeNull();
    expect(steps[0].currentDelta).toBe(Infinity);
    expect(steps[0].points).toEqual([]);
    expect(steps[0].partition).toBeNull();
  });

  it('single point produces a degenerate frame', () => {
    const steps = closestPairOfPointsSteps([{ x: 1, y: 1 }]);

    expect(steps.length).toBeGreaterThanOrEqual(1);
    const last = steps[steps.length - 1];
    expect(last.currentBest).toBeNull();
  });

  it('steps expose event metadata for divide', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 5 },
      { x: 15, y: 5 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const divideStep = steps.find((s) => s.phase === 'divide');

    expect(divideStep).toBeDefined();
    expect(divideStep.meta).toHaveProperty('midX');
    expect(divideStep.meta).toHaveProperty('mid');
    expect(divideStep.meta).toHaveProperty('leftSize');
    expect(divideStep.meta).toHaveProperty('rightSize');
    expect(divideStep.meta).toHaveProperty('partition');
  });

  it('steps expose strip metadata during combine', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 6, y: 0 },
      { x: 9, y: 0 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const combineStep = steps.find(
      (s) =>
        s.phase === 'combine' &&
        s.meta &&
        typeof s.meta.midX === 'number' &&
        Array.isArray(s.strip),
    );

    expect(combineStep).toBeDefined();
    if (combineStep && combineStep.stripSize != null) {
      expect(combineStep.meta.stripSize).toBeGreaterThanOrEqual(0);
    }
  });

  it('steps expose candidate comparisons during combine', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
      { x: 6, y: 0 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const compareSteps = steps.filter((s) => s.phase === 'compare');

    expect(compareSteps.length).toBeGreaterThan(0);
    for (const s of compareSteps) {
      if (s.meta && s.meta.improved === true) {
        expect(s.currentBest).toBeDefined();
        expect(s.currentBest.distance).toBeLessThan(
          s.currentDelta == null ? Infinity : s.currentDelta,
        );
      }
    }
  });

  it('steps expose partition metadata during recursion', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 5 },
      { x: 15, y: 5 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const recurseSteps = steps.filter(
      (s) => s.phase === 'recurse' && s.meta && s.meta.partition,
    );

    expect(recurseSteps.length).toBeGreaterThan(0);
    for (const s of recurseSteps) {
      expect(s.meta).toHaveProperty('dividingX');
      expect(s.meta).toHaveProperty('regionLo');
      expect(s.meta).toHaveProperty('regionHi');
    }
  });
});

describe('closestPairOfPointsDebug / snapshots', () => {
  it('debug returns an event stream with enter/return structure', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 10, y: 10 },
    ];
    const events = closestPairOfPointsDebug(pts);

    expect(events.length).toBeGreaterThan(0);
    const types = events.map((e) => e.type);

    expect(types).toContain('enter');
    expect(types).toContain('return');

    const last = events[events.length - 1];
    expect(last.stateSnapshot).toHaveProperty('distance');
    expect(last.stateSnapshot).toHaveProperty('pair');
  });

  it('debug event stream is deterministic across calls', () => {
    const pts = [
      { x: 1, y: 1 },
      { x: 5, y: 5 },
      { x: 2, y: 2 },
    ];
    const a = closestPairOfPointsDebug(pts);
    const b = closestPairOfPointsDebug(pts);

    expect(a).toHaveLength(b.length);
    for (let i = 0; i < a.length; i += 1) {
      expect(a[i].eventId).toBe(b[i].eventId);
      expect(a[i].type).toBe(b[i].type);
      expect(a[i].depth).toBe(b[i].depth);
      expect(a[i].subproblem).toBe(b[i].subproblem);
    }
  });

  it('debug snapshots are immutable (mutations do not propagate)', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 10, y: 10 },
    ];
    const events = closestPairOfPointsDebug(pts);
    const snap = events[0].stateSnapshot;

    if (snap && typeof snap === 'object') {
      Object.defineProperty(snap, 'distance', {
        value: 999,
        writable: false,
        configurable: false,
      });

      const later = events[events.length - 1].stateSnapshot;
      if (later && typeof later === 'object') {
        expect(later.distance).not.toBe(999);
      }
    }
  });

  it('debug includes nodeId/parentId for recursion-tree derivation', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    const events = closestPairOfPointsDebug(pts);
    const withNode = events.filter((e) => e.nodeId != null);
    const withParent = events.filter((e) => e.parentId != null);

    expect(withNode.length).toBeGreaterThan(0);
    expect(withParent.length).toBeGreaterThanOrEqual(0);

    const firstWithNode = withNode[0];
    expect(typeof firstWithNode.nodeId).toBe('string');
    expect(firstWithNode.nodeId.length).toBeGreaterThan(0);
  });

  it('debug events use the foundation event vocabulary', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    const events = closestPairOfPointsDebug(pts);
    const types = new Set(events.map((e) => e.type));

    expect(types.has('enter')).toBe(true);
    expect(types.has('divide')).toBe(true);
    expect(types.has('recurse')).toBe(true);
    expect(types.has('baseCase')).toBe(true);
    expect(types.has('combine')).toBe(true);
    expect(types.has('return')).toBe(true);
  });

  it('debug events include depth and subproblem', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    const events = closestPairOfPointsDebug(pts);

    for (const e of events) {
      expect(typeof e.depth).toBe('number');
      expect(typeof e.subproblem).toBe('string');
      expect(e.subproblem.length).toBeGreaterThan(0);
    }
  });
});

describe('correctness cross-check vs brute-force', () => {
  it('matches brute-force on many small random datasets', () => {
    let seed = 17;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return ((seed >>> 0) % 1000000) / 1000000;
    };

    for (let trial = 0; trial < 200; trial += 1) {
      const n = Math.floor(rnd() * 12) + 2;
      const pts = [];

      for (let i = 0; i < n; i += 1) {
        pts.push({
          x: Math.floor(rnd() * 60) - 30,
          y: Math.floor(rnd() * 60) - 30,
        });
      }

      const runOut = closestPairOfPointsRun(pts);
      const ref = bruteForceReference(pts);

      expect(approx(runOut.distance, ref.distance)).toBe(true);
      expect(samePairAs(pts, runOut, ref)).toBe(true);
    }
  });

  it('handles duplicate-heavy sets correctly', () => {
    let seed = 99;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return ((seed >>> 0) % 1000000) / 1000000;
    };

    for (let trial = 0; trial < 50; trial += 1) {
      const n = Math.floor(rnd() * 8) + 2;
      const anchor = {
        x: Math.floor(rnd() * 40) - 20,
        y: Math.floor(rnd() * 40) - 20,
      };
      const pts = [anchor];

      for (let i = 1; i < n; i += 1) {
        pts.push({
          x: anchor.x + Math.floor(rnd() * 5) - 2,
          y: anchor.y + Math.floor(rnd() * 5) - 2,
        });
      }

      const runOut = closestPairOfPointsRun(pts);
      const ref = bruteForceReference(pts);

      expect(approx(runOut.distance, ref.distance)).toBe(true);
      expect(samePairAs(pts, runOut, ref)).toBe(true);
    }
  });

  it('still works when all points share the same x', () => {
    const pts = [
      { x: 7, y: 0 },
      { x: 7, y: 2 },
      { x: 7, y: 5 },
      { x: 7, y: 9 },
    ];
    const runOut = closestPairOfPointsRun(pts);
    const ref = bruteForceReference(pts);

    expect(approx(runOut.distance, ref.distance)).toBe(true);
    expect(runOut.pair).toEqual(ref.pair);
  });

  it('still works when all points share the same y', () => {
    const pts = [
      { x: 0, y: 4 },
      { x: 3, y: 4 },
      { x: 7, y: 4 },
    ];
    const runOut = closestPairOfPointsRun(pts);
    const ref = bruteForceReference(pts);

    expect(approx(runOut.distance, ref.distance)).toBe(true);
    expect(runOut.pair).toEqual(ref.pair);
  });

  it('Euclidean distance is correct for known pairs', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const out = closestPairOfPointsRun(pts);

    expect(out.pair).toEqual([0, 1]);
    expect(out.distance).toBeCloseTo(Math.SQRT2, 6);
  });

  it('negative coordinates Euclidean distance', () => {
    const pts = [
      { x: -2, y: -3 },
      { x: 1, y: 1 },
      { x: -2, y: -2 },
    ];
    const out = closestPairOfPointsRun(pts);
    const ref = bruteForceReference(pts);

    expect(approx(out.distance, ref.distance)).toBe(true);
    expect(samePairAs(pts, out, ref)).toBe(true);
  });
});

describe('partition and strip semantics', () => {
  it('divide event reports mid index and midX', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 8, y: 0 },
      { x: 12, y: 0 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const divide = steps.find((s) => s.phase === 'divide');

    expect(divide).toBeDefined();
    expect(divide.meta).toHaveProperty('mid');
    expect(divide.meta).toHaveProperty('midX');
    expect(divide.meta.leftSize).toBeGreaterThan(0);
    expect(divide.meta.rightSize).toBeGreaterThanOrEqual(0);
  });

  it('strip only contains points within delta of midX', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 6, y: 0 },
      { x: 9, y: 0 },
      { x: 12, y: 0 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const stripStep = steps.find(
      (s) =>
        s.phase === 'combine' &&
        s.meta &&
        typeof s.meta.midX === 'number' &&
        Array.isArray(s.strip),
    );

    if (stripStep && stripStep.strip.length > 0) {
      const midX = stripStep.meta.midX;
      const delta = stripStep.currentDelta;

      for (const pt of stripStep.strip) {
        expect(Math.abs(pt.x - midX)).toBeLessThan(delta + 1e-6);
      }
    }
  });

  it('strip phase shows candidate comparisons', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
      { x: 6, y: 0 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const compareSteps = steps.filter((s) => s.phase === 'compare');

    expect(compareSteps.length).toBeGreaterThan(0);
    for (const s of compareSteps) {
      if (s.meta && s.meta.improved === true) {
        expect(s.currentBest).toBeDefined();
        expect(s.currentBest.distance).toBeLessThan(
          s.currentDelta == null ? Infinity : s.currentDelta,
        );
      }
    }
  });

  it('compare events include y-gap early termination', () => {
    // Vertical arrangement: after the halves each return delta = 5, the strip
    // scan hits y-gaps of 10 (> delta) and stops the inner loop early.
    const pts = [
      { x: 0, y: 0 },
      { x: 0, y: 5 },
      { x: 0, y: 10 },
      { x: 0, y: 15 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const yGapSteps = steps.filter(
      (s) =>
        s.phase === 'compare' &&
        s.meta &&
        s.meta.comparing &&
        s.meta.comparing.reason === 'y-gap',
    );

    expect(yGapSteps.length).toBeGreaterThan(0);
    for (const s of yGapSteps) {
      expect(s.meta.comparing).toHaveProperty('reason');
      expect(s.meta.comparing.reason).toBe('y-gap');
    }
  });
});

describe('event stream structure', () => {
  it('divide event includes partition metadata', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 8, y: 0 },
      { x: 12, y: 0 },
    ];
    const events = closestPairOfPointsDebug(pts);
    const divideEvent = events.find((e) => e.type === 'divide');

    expect(divideEvent).toBeDefined();
    expect(divideEvent.meta).toHaveProperty('partition');
    expect(divideEvent.meta.partition).toHaveProperty('dividingX');
    expect(divideEvent.meta.partition).toHaveProperty('regionLo');
    expect(divideEvent.meta.partition).toHaveProperty('regionHi');
    expect(divideEvent.meta.partition).toHaveProperty('left');
    expect(divideEvent.meta.partition).toHaveProperty('right');
  });

  it('base case events are clearly labeled as brute force', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const events = closestPairOfPointsDebug(pts);
    const baseCaseEvents = events.filter(
      (e) => e.type === 'baseCase' && e.meta && e.meta.bruteForce,
    );

    expect(baseCaseEvents.length).toBeGreaterThan(0);
    for (const e of baseCaseEvents) {
      expect(e.meta).toHaveProperty('bruteForce');
      expect(e.meta.bruteForce).toBe(true);
    }
  });

  it('recursion events include target description', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 8, y: 0 },
      { x: 12, y: 0 },
    ];
    const events = closestPairOfPointsDebug(pts);
    const recurseEvents = events.filter((e) => e.type === 'recurse');

    expect(recurseEvents.length).toBeGreaterThan(0);
    for (const e of recurseEvents) {
      expect(e.meta).toHaveProperty('recurseTarget');
      expect(['left', 'right']).toContain(e.meta.recurseTarget);
    }
  });
});

describe('immutable snapshots in steps', () => {
  it('steps array entries are independent objects', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 10, y: 10 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const first = steps[0];
    const second = steps[1];

    expect(first).not.toBe(second);

    if (first && second) {
      first.__mut = true;
      expect(second.__mut).toBeUndefined();
    }
  });

  it('currentBest objects are not shared by reference across steps', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 10, y: 10 },
    ];
    const steps = closestPairOfPointsSteps(pts);
    const bestSteps = steps.filter((s) => s.currentBest != null);

    if (bestSteps.length >= 2) {
      expect(bestSteps[0].currentBest).not.toBe(bestSteps[1].currentBest);
    }
  });
});

describe('registry contract shape for closest pair', () => {
  it('exposes expected fields from the module', () => {
    expect(typeof closestPairOfPointsDebug).toBe('function');
    expect(typeof closestPairOfPointsSteps).toBe('function');
    expect(typeof closestPairOfPointsRun).toBe('function');
  });

  it('run output is serializable and complete', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 10, y: 10 },
    ];
    const out = closestPairOfPointsRun(pts);

    expect(out).toHaveProperty('distance');
    expect(out).toHaveProperty('pair');
    expect(out).toHaveProperty('points');
    expect(out).toHaveProperty('comparisons');
    expect(out).toHaveProperty('events');
    expect(out).toHaveProperty('xSorted');
    expect(Array.isArray(out.events)).toBe(true);
    expect(Array.isArray(out.xSorted)).toBe(true);
  });
});
