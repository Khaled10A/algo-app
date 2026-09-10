import { createDncCollector } from './dncEvents';

/**
 * Closest Pair of Points — O(n log n) Divide & Conquer.
 *
 * Educational implementation intended for visualization/debugging, not for
 * large inputs. It intentionally follows the textbook recursive structure:
 *
 *   1. Sort points by x once.
 *   2. Recursively solve left and right halves by index range.
 *   3. delta = min(leftBest, rightBest).
 *   4. Build the vertical strip around the dividing x.
 *   5. Scan the strip with the standard ≤7-nearest-neighbor merge step.
 *   6. Return the global best pair.
 *
 * A small brute-force base case (≤ 3 points) is used on tiny subproblems and
 * is clearly labeled as such. That base case is correct and deterministic; it
 * is not the main algorithm.
 *
 * Event contract:
 *   - Uses the D&C foundation event vocabulary: enter, divide, recurse,
 *     baseCase, compare, combine, return, complete.
 *   - Emits immutable per-step state via createDncCollector() so the generic
 *     projectDNCEvents() projector can derive phases, call stacks, vars,
 *     memory, and the recursion tree.
 *   - Closest-pair-specific visualization metadata is emitted through `meta`
 *     (partition, strip, comparing, delta, bestPair) and through
 *     stateSnapshot fields the projector formats into vars/memory.
 *
 * Index space:
 *   - Every event-level index (lo, hi, mid, pair indices, regionLo/regionHi)
 *     refers to the x-sorted order (`xSorted`), which is the natural frame for
 *     divide-and-conquer geometry. Points carry `_x` (x-sorted position) and
 *     `_i` (original input index). run() maps the final pair back to the
 *     original input order once, at the boundary.
 *
 * Tie-breaking:
 *   - Pairs with equal distance are compared by their original-index pair
 *     (lexicographically smaller wins), matching the brute-force reference so
 *     results are deterministic on duplicate/tie-heavy inputs.
 */

/** Euclidean distance between two points. */
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Brute-force closest pair for tiny subproblems (≤ 3 points).
 *
 * This is intentionally O(k²), but it is only ever applied to k ≤ 3, so it is
 * part of the acceptable standard closest-pair implementation, not a fallback
 * that turns the whole algorithm into O(n²).
 *
 * Returns the pair as ORIGINAL input indices (`_i`), so the tie-breaker below
 * matches the brute-force reference exactly: when multiple pairs share the
 * same minimal distance, pick the pair with the lexicographically smaller
 * original-index pair (a, b) with a < b. This makes the algorithm
 * deterministic on duplicate/tie-heavy inputs.
 */
function bruteForceClosest(points) {
  const n = points.length;
  let best = Infinity;
  let bestA = -1;
  let bestB = -1;

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const d = dist(points[i], points[j]);
      const lo = Math.min(points[i]._i, points[j]._i);
      const hi = Math.max(points[i]._i, points[j]._i);
      if (
        d < best ||
        (d === best && (lo < bestA || (lo === bestA && hi < bestB)))
      ) {
        best = d;
        bestA = lo;
        bestB = hi;
      }
    }
  }

  return { distance: best, pair: [bestA, bestB] };
}

/**
 * Original-index key of a pair (x-sorted indices) for deterministic tie-breaks.
 *
 * @param {[number, number]} pair — x-sorted indices into pointsByX
 * @param {Array<{_i: number}>} pointsByX
 * @returns {[number, number]} sorted original-index pair
 */
function origKey(pair, pointsByX) {
  const o0 = pointsByX[pair[0]]._i;
  const o1 = pointsByX[pair[1]]._i;
  return [Math.min(o0, o1), Math.max(o0, o1)];
}

/**
 * True if pair a is strictly better than pair b.
 *
 * Better = smaller distance; ties are broken by the lexicographically smaller
 * original-index pair, which is exactly the brute-force reference rule. This
 * rule is applied consistently at every combine step so the recursion returns
 * the globally best pair even on duplicate/tie-heavy inputs.
 *
 * @param {{ distance: number, pair: [number, number] }} a
 * @param {{ distance: number, pair: [number, number] }} b
 * @param {Array<{_i: number}>} pointsByX
 * @returns {boolean}
 */
function betterPair(a, b, pointsByX) {
  if (a.distance !== b.distance) return a.distance < b.distance;
  const ka = origKey(a.pair, pointsByX);
  const kb = origKey(b.pair, pointsByX);
  return ka[0] < kb[0] || (ka[0] === kb[0] && ka[1] < kb[1]);
}

/**
 * Build the vertical strip from the y-sorted points belonging to the current
 * index window [lo..hi] (in the x-sorted order) whose x is within delta of
 * the dividing line midX.
 *
 * The filter is non-strict (|x - midX| <= delta) so that pairs lying exactly
 * delta away — including ties at the current best distance — are still
 * considered during the merge step.
 *
 * Complexity note: filtering the global byY list is O(n) per node, which keeps
 * the whole combine phase linear per level and the algorithm O(n log n). The
 * classic implementation filters a per-subproblem y-sorted list; this global
 * variant is the standard educational simplification and does not change the
 * asymptotic complexity.
 */
function buildStrip(byY, midX, delta, lo, hi) {
  const strip = [];
  for (const p of byY) {
    if (p._x < lo || p._x > hi) continue;
    if (Math.abs(p.x - midX) <= delta) {
      strip.push(p);
    }
  }
  return strip;
}

/**
 * Recursive closest-pair helper.
 *
 * Parameters:
 *   pointsByX — points sorted by x (global, never mutated)
 *   lo, hi    — inclusive index range into pointsByX for this subproblem
 *   byY       — same points as pointsByX[lo..hi], sorted by y
 *   emit      — D&C event emitter
 *   depth     — recursion depth
 *   nodeId    — current recursion-tree node id
 *   parentId  — parent node id
 *
 * Returns { distance, pair } where pair are indices into pointsByX
 * (i.e. the x-sorted order).
 */
function closestRec(pointsByX, lo, hi, byY, emit, depth, nodeId, parentId) {
  const count = hi - lo + 1;
  const leftPt = pointsByX[lo];
  const rightPt = pointsByX[hi];
  const subproblem = `points:${count}  x[${leftPt.x}..${rightPt.x}]`;

  emit('enter', {
    depth,
    subproblem,
    action: 'enter',
    stateSnapshot: {
      count,
      lo,
      hi,
      leftX: leftPt.x,
      rightX: rightPt.x,
    },
    nodeId,
    parentId,
  });

  // ── Base case: brute force on tiny subproblems ────────────────────────────
  if (count <= 3) {
    const slice = pointsByX.slice(lo, hi + 1);
    const local = bruteForceClosest(slice);
    // bruteForceClosest returns ORIGINAL indices (_i); map back to global
    // x-sorted indices so every pair in the event stream stays in x-space.
    const xOf = (origIdx) => slice.findIndex((p) => p._i === origIdx) + lo;
    const pair = [
      Math.min(xOf(local.pair[0]), xOf(local.pair[1])),
      Math.max(xOf(local.pair[0]), xOf(local.pair[1])),
    ];
    const distance = local.distance;

    emit('baseCase', {
      depth,
      subproblem,
      reason: 'size ≤ 3 → brute-force base case (k ≤ 3)',
      stateSnapshot: {
        count,
        lo,
        hi,
        leftX: leftPt.x,
        rightX: rightPt.x,
        distance,
        pair,
        baseCase: true,
        result: { distance, pair },
      },
      result: { distance, pair },
      nodeId,
      parentId,
      meta: { baseCase: true, bruteForce: true, distance, pair },
    });

    emit('return', {
      depth,
      subproblem,
      reason: 'base-case result',
      stateSnapshot: {
        count,
        lo,
        hi,
        leftX: leftPt.x,
        rightX: rightPt.x,
        distance,
        pair,
        result: { distance, pair },
      },
      result: { distance, pair },
      nodeId,
      parentId,
      meta: { distance, pair },
    });

    return { distance, pair };
  }

  // ── Divide ──────────────────────────────────────────────────────────────────
  const mid = Math.floor((lo + hi) / 2);
  const midX = pointsByX[mid].x;
  const leftSize = mid - lo + 1;
  const rightSize = hi - mid;

  const partition = {
    dividingX: midX,
    regionLo: lo,
    regionHi: hi,
    left: { lo, hi: mid, count: leftSize },
    right: { lo: mid + 1, hi, count: rightSize },
  };

  emit('divide', {
    depth,
    subproblem,
    splitDescription: `mid index ${mid}, dividing line x ≈ ${midX.toFixed(3)}`,
    stateSnapshot: {
      count,
      lo,
      hi,
      mid,
      midX,
      leftSize,
      rightSize,
      leftX: pointsByX[lo].x,
      rightX: pointsByX[hi].x,
      partition,
    },
    nodeId,
    parentId,
    meta: {
      mid,
      midX,
      leftSize,
      rightSize,
      partition,
    },
  });

  // Partition byY into leftY / rightY while preserving y-order.
  // The split is on the x-sorted position (`_x`), which is the same index
  // space as lo/mid/hi — never the original input index (`_i`).
  const leftY = [];
  const rightY = [];
  for (const p of byY) {
    if (p._x <= mid) {
      leftY.push(p);
    } else {
      rightY.push(p);
    }
  }

  // ── Recurse: left ───────────────────────────────────────────────────────────
  emit('recurse', {
    depth,
    subproblem,
    childDescription: `left  points:${leftSize}  x[..${midX.toFixed(3)}]`,
    stateSnapshot: {
      count,
      lo,
      hi,
      mid,
      midX,
      recurseTarget: 'left',
      targetCount: leftSize,
    },
    nodeId,
    parentId,
    meta: {
      recurseTarget: 'left',
      targetCount: leftSize,
      midX,
      dividingX: midX,
      regionLo: lo,
      regionHi: hi,
      partition,
    },
  });

  const leftResult = closestRec(
    pointsByX,
    lo,
    mid,
    leftY,
    emit,
    depth + 1,
    `${nodeId}-L`,
    nodeId,
  );

  // ── Recurse: right ──────────────────────────────────────────────────────────
  emit('recurse', {
    depth,
    subproblem,
    childDescription: `right points:${rightSize}  x[${midX.toFixed(3)}..]`,
    stateSnapshot: {
      count,
      lo,
      hi,
      mid,
      midX,
      recurseTarget: 'right',
      targetCount: rightSize,
    },
    nodeId,
    parentId,
    meta: {
      recurseTarget: 'right',
      targetCount: rightSize,
      midX,
      dividingX: midX,
      regionLo: lo,
      regionHi: hi,
      partition,
    },
  });

  const rightResult = closestRec(
    pointsByX,
    mid + 1,
    hi,
    rightY,
    emit,
    depth + 1,
    `${nodeId}-R`,
    nodeId,
  );

  // ── Combine: pick smaller delta ─────────────────────────────────────────────
  // Tie-break by the deterministic betterPair() rule (distance, then original
  // index pair) so equal-distance halves resolve consistently.
  const leftBetter = betterPair(leftResult, rightResult, pointsByX);
  // `let` (not const): the strip scan below may replace the incumbent pair.
  let best = leftBetter ? leftResult : rightResult;
  const delta = best.distance;

  emit('combine', {
    depth,
    subproblem,
    description: `delta = min(left=${leftResult.distance.toFixed(3)}, right=${rightResult.distance.toFixed(3)}) = ${delta.toFixed(3)}`,
    stateSnapshot: {
      count,
      lo,
      hi,
      mid,
      midX,
      leftDist: leftResult.distance,
      rightDist: rightResult.distance,
      delta,
      bestPair: best.pair,
      combineStage: 'choose-delta',
    },
    nodeId,
    parentId,
    meta: {
      delta,
      leftDist: leftResult.distance,
      rightDist: rightResult.distance,
      bestPair: best.pair,
      partition,
    },
  });

  // ── Strip ───────────────────────────────────────────────────────────────────
  const strip = buildStrip(byY, midX, delta, lo, hi);

  emit('combine', {
    depth,
    subproblem,
    description: `strip: ${strip.length} candidate point(s) within delta of x=${midX.toFixed(3)}`,
    stateSnapshot: {
      count,
      lo,
      hi,
      mid,
      midX,
      delta,
      stripSize: strip.length,
      bestPair: best.pair,
      bestDist: best.distance,
      combineStage: 'strip',
    },
    nodeId,
    parentId,
    meta: {
      delta,
      midX,
      stripSize: strip.length,
      strip: strip.map((p) => ({ x: p.x, y: p.y, _i: p._i, _x: p._x })),
      bestPair: best.pair,
      partition,
    },
  });

  // ── Strip scan ──────────────────────────────────────────────────────────────
  for (let i = 0; i < strip.length; i += 1) {
    const pi = strip[i];
    const limit = Math.min(strip.length, i + 8);

    for (let j = i + 1; j < limit; j += 1) {
      const pj = strip[j];

      if (pj.y - pi.y > delta) {
        emit('compare', {
          depth,
          subproblem,
          description: `strip: y-gap > delta (${pi.y.toFixed(2)} → ${pj.y.toFixed(2)} > ${delta.toFixed(3)}) → stop inner loop`,
          stateSnapshot: {
            count,
            lo,
            hi,
            mid,
            midX,
            delta,
            stripSize: strip.length,
            comparing: { a: pi, b: pj, d: pj.y - pi.y },
            bestPair: best.pair,
            bestDist: best.distance,
            combineStage: 'strip-scan',
          },
          nodeId,
          parentId,
          meta: {
            delta,
            comparing: { a: pi, b: pj, d: pj.y - pi.y, reason: 'y-gap' },
            bestPair: best.pair,
            partition,
          },
        });
        break;
      }

      const d = dist(pi, pj);

      emit('compare', {
        depth,
        subproblem,
        description: `candidate (${pi.x.toFixed(2)},${pi.y.toFixed(2)}) ↔ (${pj.x.toFixed(2)},${pj.y.toFixed(2)}) = ${d.toFixed(3)}`,
        stateSnapshot: {
          count,
          lo,
          hi,
          mid,
          midX,
          delta,
          stripSize: strip.length,
          comparing: { a: pi, b: pj, d },
          bestPair: best.pair,
          bestDist: best.distance,
          combineStage: 'strip-scan',
        },
        nodeId,
        parentId,
        meta: {
          delta,
          comparing: { a: pi, b: pj, d },
          comparingPairIndices: [pi._x, pj._x],
          bestPair: best.pair,
          improved: d < best.distance,
          partition,
        },
      });

      const candidate = { distance: d, pair: [pi._x, pj._x] };

      if (betterPair(candidate, best, pointsByX)) {
        best = candidate;

        emit('combine', {
          depth,
          subproblem,
          description: `new best pair: distance ${d.toFixed(3)}  (indices ${best.pair[0]}, ${best.pair[1]})`,
          stateSnapshot: {
            count,
            lo,
            hi,
            mid,
            midX,
            delta: best.distance,
            stripSize: strip.length,
            bestPair: best.pair,
            bestDist: best.distance,
            combineStage: 'new-best',
            result: { distance: best.distance, pair: best.pair },
          },
          nodeId,
          parentId,
          meta: {
            delta: best.distance,
            newDist: d,
            newPair: best.pair,
            bestPair: best.pair,
            partition,
          },
        });
      }
    }
  }

  // ── Return combined result ──────────────────────────────────────────────────
  emit('return', {
    depth,
    subproblem,
    reason: `combined result: distance ${best.distance.toFixed(3)}`,
    stateSnapshot: {
      count,
      lo,
      hi,
      mid,
      midX,
      leftDist: leftResult.distance,
      rightDist: rightResult.distance,
      distance: best.distance,
      pair: best.pair,
      result: { distance: best.distance, pair: best.pair },
    },
    result: { distance: best.distance, pair: best.pair },
    nodeId,
    parentId,
    meta: {
      leftDist: leftResult.distance,
      rightDist: rightResult.distance,
      distance: best.distance,
      pair: best.pair,
      partition,
    },
  });

  return best;
}

/**
 * Public run(): compute closest pair, returning output and raw stats.
 *
 * Contract:
 *   - Input points are plain {x, y} objects.
 *   - Returned pair indices refer to the original input array order.
 *   - The implementation is O(n log n) with a brute-force base case only for
 *     subproblems of size ≤ 3.
 */
export function closestPairOfPointsRun(points) {
  const n = points.length;

  if (n < 2) {
    return {
      distance: Infinity,
      pair: [-1, -1],
      points: points.map((p) => ({ ...p })),
      comparisons: 0,
      events: [],
      xSorted: [],
    };
  }

  // Re-attach a stable original index on a cloned copy so the algorithm can
  // map results back to the original input order without mutating the input.
  const pts = points.map((p, i) => ({ x: p.x, y: p.y, _i: i }));

  // Sort by x once. Tie-break by y, then by original index for stability.
  // `_x` records the x-sorted position — the index space used by the recursion
  // for windows, partitions, and reported pairs.
  const xSorted = [...pts]
    .sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      if (a.y !== b.y) return a.y - b.y;
      return a._i - b._i;
    })
    .map((p, idx) => ({ ...p, _x: idx }));

  // Stable y-order for the whole set.
  const byY = [...xSorted].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a._i - b._i;
  });

  const collector = createDncCollector();

  const result = closestRec(
    xSorted,
    0,
    xSorted.length - 1,
    byY,
    collector.emit.bind(collector),
    0,
    'n-0',
    null,
  );

  // Map x-sorted indices back to original input indices.
  const toOrig = (idx) => {
    if (Number.isInteger(idx) && idx >= 0 && idx < xSorted.length) {
      return xSorted[idx]._i;
    }
    return -1;
  };

  let a = toOrig(result.pair[0]);
  let b = toOrig(result.pair[1]);

  if (a === -1 || b === -1) {
    a = result.pair[0];
    b = result.pair[1];
  }
  if (a > b) {
    const t = a;
    a = b;
    b = t;
  }

  return {
    distance: result.distance,
    pair: [a, b],
    points: points.map((p) => ({ ...p })),
    comparisons: collector.events.filter((e) => e.type === 'compare').length,
    events: collector.events,
    xSorted: xSorted.map((p) => ({ x: p.x, y: p.y, _i: p._i, _x: p._x })),
  };
}

/**
 * steps(): produce a frame-per-event list for the coordinate-plane visualizer.
 *
 * Each frame exposes:
 *   - phase, depth, subproblem, log
 *   - meta: the raw event metadata (mid/midX/partition/strip/comparing/…)
 *   - points / xSorted (immutable copies)
 *   - currentBest / currentDelta: the incumbent best pair seen so far
 *   - strip, comparing, partition: carry-forward visualization state
 *
 * Snapshots are deeply immutable: every frame clones whatever it carries.
 */
export function closestPairOfPointsSteps(points) {
  const run = closestPairOfPointsRun(points);
  const frames = [];

  if (run.events.length === 0) {
    frames.push({
      step: 0,
      phase: 'complete',
      points: run.points,
      xSorted: run.xSorted,
      currentBest: null,
      currentDelta: Infinity,
      strip: [],
      comparing: null,
      partition: null,
      subproblem: 'no points (n < 2)',
      depth: 0,
      activeLine: 0,
      log: 'Input has fewer than 2 points; nothing to compare.',
      meta: null,
      event: null,
    });
    return frames;
  }

  let currentBest = null;
  let currentDelta = Infinity;
  let lastPartition = null;
  let lastStrip = [];
  let lastCompare = null;

  for (let i = 0; i < run.events.length; i += 1) {
    const event = run.events[i];
    const snap = event.stateSnapshot;
    const meta = event.meta ?? null;

    if (event.type === 'enter') {
      // A new subproblem starts with fresh visualization state; the parent's
      // partition must not bleed into the child's frames.
      lastPartition = null;
      lastStrip = [];
      lastCompare = null;
    }

    if (
      event.type === 'divide' ||
      event.type === 'recurse'
    ) {
      if (meta && meta.partition) {
        lastPartition = {
          dividingX: meta.partition.dividingX,
          regionLo: meta.partition.regionLo,
          regionHi: meta.partition.regionHi,
          left: meta.partition.left
            ? { ...meta.partition.left }
            : null,
          right: meta.partition.right
            ? { ...meta.partition.right }
            : null,
        };
      } else if (snap && snap.partition) {
        lastPartition = { ...snap.partition };
      }
    }

    // Incumbent best: adopt any concrete pair/distance this event reports.
    // Returned/base-case events finalize a subproblem's answer; combine
    // new-best events already carry the updated best pair.
    if (
      (event.type === 'baseCase' || event.type === 'return') &&
      snap.distance != null &&
      snap.pair &&
      snap.pair.length === 2
    ) {
      currentBest = { distance: snap.distance, pair: [...snap.pair] };
      currentDelta = snap.distance;
    }

    if (event.type === 'combine') {
      if (meta && meta.delta != null) {
        currentDelta = meta.delta;
      } else if (snap.delta != null) {
        currentDelta = snap.delta;
      }

      if (meta && meta.bestPair && meta.bestPair.length === 2) {
        currentBest = { distance: currentDelta, pair: [...meta.bestPair] };
      } else if (snap.bestPair && snap.bestPair.length === 2) {
        currentBest = { distance: currentDelta, pair: [...snap.bestPair] };
      }

      if (meta && meta.partition) {
        lastPartition = {
          dividingX: meta.partition.dividingX,
          regionLo: meta.partition.regionLo,
          regionHi: meta.partition.regionHi,
          left: meta.partition.left
            ? { ...meta.partition.left }
            : null,
          right: meta.partition.right
            ? { ...meta.partition.right }
            : null,
        };
      }

      if (Array.isArray(meta && meta.strip)) {
        lastStrip = meta.strip.map((p) => ({ x: p.x, y: p.y, _i: p._i }));
      } else if (Array.isArray(snap && snap.strip)) {
        lastStrip = snap.strip.map((p) => ({ x: p.x, y: p.y, _i: p._i }));
      }
    }

    if (event.type === 'compare') {
      if (meta && meta.comparing) {
        lastCompare = {
          a: { x: meta.comparing.a.x, y: meta.comparing.a.y },
          b: { x: meta.comparing.b.x, y: meta.comparing.b.y },
          d: meta.comparing.d,
        };
      } else if (snap.comparing) {
        lastCompare = {
          a: { x: snap.comparing.a.x, y: snap.comparing.a.y },
          b: { x: snap.comparing.b.x, y: snap.comparing.b.y },
          d: snap.comparing.d,
        };
      }

      if (meta && meta.delta != null) {
        currentDelta = meta.delta;
      }
    }

    frames.push({
      step: i,
      phase: event.type,
      points: run.points,
      xSorted: run.xSorted,
      currentBest: currentBest
        ? { distance: currentBest.distance, pair: [...currentBest.pair] }
        : null,
      currentDelta,
      strip: lastStrip.map((p) => ({ x: p.x, y: p.y, _i: p._i })),
      comparing: lastCompare
        ? {
            a: { x: lastCompare.a.x, y: lastCompare.a.y },
            b: { x: lastCompare.b.x, y: lastCompare.b.y },
            d: lastCompare.d,
          }
        : null,
      partition: lastPartition
        ? {
            dividingX: lastPartition.dividingX,
            regionLo: lastPartition.regionLo,
            regionHi: lastPartition.regionHi,
            left: lastPartition.left ? { ...lastPartition.left } : null,
            right: lastPartition.right ? { ...lastPartition.right } : null,
          }
        : null,
      subproblem: event.subproblem,
      depth: event.depth,
      activeLine: i,
      log: event.action,
      meta: meta == null ? null : JSON.parse(JSON.stringify(meta)),
      event,
    });
  }

  return frames;
}

/**
 * debug(): produce a D&C event stream consumable by projectDNCEvents().
 *
 * This reruns the algorithm through the foundation collector so the generic
 * projector can derive phases, call stacks, vars, memory, and the recursion
 * tree.
 *
 * Each event's stateSnapshot also carries `pts` — the full x-sorted point set
 * ({x, y, _i, _x}) — so the coordinate-plane visualizer can render all points
 * at every step. `pts` is deep-cloned per event to preserve snapshot
 * immutability.
 */
export function closestPairOfPointsDebug(points) {
  const run = closestPairOfPointsRun(points);
  const pts = run.xSorted.map((p) => ({ x: p.x, y: p.y, _i: p._i, _x: p._x }));
  return run.events.map((e) => ({
    ...e,
    stateSnapshot: {
      ...e.stateSnapshot,
      pts: pts.map((p) => ({ ...p })),
    },
  }));
}
