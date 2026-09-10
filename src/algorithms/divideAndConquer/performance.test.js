import { describe, it, expect } from 'vitest';
import { closestPairOfPointsDebug } from './closestPair';
import { karatsubaDebug } from './karatsuba';
import { strassenDebug } from './strassen';
import { projectDNCEvents } from './dncSteps';

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 14), 61 | a)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Performance baseline at the maximum UI input sizes. Event-count ceilings
 * are deterministic guards against accidental exponential event growth. The
 * wall-clock budgets are generous blow-up guards (not strict benchmarks —
 * timing varies heavily under parallel test load); they only fail if
 * projection becomes pathologically slow.
 */
describe('D&C performance (max UI inputs)', () => {
  it('closest pair projects within budget at 64 points', () => {
    const rng = mulberry32(42);
    const pts = Array.from({ length: 64 }, () => ({
      x: Math.floor(rng() * 100),
      y: Math.floor(rng() * 100),
    }));
    const events = closestPairOfPointsDebug(pts);
    const t0 = performance.now();
    const snaps = projectDNCEvents(events);
    const ms = performance.now() - t0;
    expect(snaps.length).toBe(events.length);
    console.log(
      `[perf] closest-pair n=64: events=${events.length} projectMs=${ms.toFixed(1)}`,
    );
    expect(events.length).toBeLessThan(3000);
    expect(ms).toBeLessThan(1000);
  });

  it('karatsuba projects within budget at 16 digits', () => {
    const events = karatsubaDebug('1234567812345678', '8765432187654321');
    const t0 = performance.now();
    const snaps = projectDNCEvents(events);
    const ms = performance.now() - t0;
    expect(snaps.length).toBe(events.length);
    console.log(
      `[perf] karatsuba 16-digit: events=${events.length} projectMs=${ms.toFixed(1)}`,
    );
    expect(events.length).toBeLessThan(2000);
    expect(ms).toBeLessThan(1000);
  });

  it('strassen projects within budget at 8x8', () => {
    const rng = mulberry32(7);
    const m = () =>
      Array.from({ length: 8 }, () =>
        Array.from({ length: 8 }, () => Math.floor(rng() * 15) - 5),
      );
    const events = strassenDebug(m(), m());
    const t0 = performance.now();
    const snaps = projectDNCEvents(events);
    const ms = performance.now() - t0;
    expect(snaps.length).toBe(events.length);
    console.log(
      `[perf] strassen 8x8: events=${events.length} projectMs=${ms.toFixed(1)}`,
    );
    // 400 nodes (1+7+49+343) × ~5 events ≈ 2200; ceiling guards against
    // accidental exponential growth, not against this linear-ish baseline.
    expect(events.length).toBeLessThan(2600);
    expect(ms).toBeLessThan(2000);
  });
});
