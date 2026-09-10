/* Temporary audit script — measures event counts and projection cost. */
import { closestPairOfPointsDebug, closestPairOfPointsRun } from '../src/algorithms/divideAndConquer/closestPair.js';
import { karatsubaDebug } from '../src/algorithms/divideAndConquer/karatsuba.js';
import { strassenDebug } from '../src/algorithms/divideAndConquer/strassen.js';
import { projectDNCEvents } from '../src/algorithms/divideAndConquer/dncSteps.js';

function measure(name, events) {
  const t0 = performance.now();
  const snaps = projectDNCEvents(events);
  const t1 = performance.now();
  let bytes = 0;
  try {
    bytes = JSON.stringify(snaps).length;
  } catch {
    bytes = -1;
  }
  const types = {};
  for (const e of events) types[e.type] = (types[e.type] || 0) + 1;
  console.log(
    `${name}: events=${events.length} snapshotMs=${(t1 - t0).toFixed(1)} snapshotJSON=${(bytes / 1e6).toFixed(1)}MB nodes=${snaps[snaps.length - 1].dnc.treeNodes.length}`,
  );
  console.log('  types:', JSON.stringify(types));
}

// Closest pair, max UI input (64 points)
{
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const pts = Array.from({ length: 64 }, () => ({
    x: Math.floor(rnd() * 100),
    y: Math.floor(rnd() * 100),
  }));
  measure('closest-pair n=64', closestPairOfPointsDebug(pts));
}

// Karatsuba, max UI input (16 digits each)
measure('karatsuba 16-digit', karatsubaDebug('1234567812345678', '8765432187654321'));

// Strassen, max UI input (8×8)
{
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return Math.floor(seed / 2147483648 * 15) - 5;
  };
  const m = () => Array.from({ length: 8 }, () => Array.from({ length: 8 }, rnd));
  measure('strassen 8x8', strassenDebug(m(), m()));
}
