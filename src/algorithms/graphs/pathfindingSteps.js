import { edgeKey } from "./graph";

/**
 * Projects pathfinding event sequences (Dijkstra today, Bellman-Ford
 * tomorrow) into the existing debugger step schema:
 *
 *   { activeLine, log, vars, memory, callStack, visited, visitOrder,
 *     current, heap, queue, distances, previous, currentEdge,
 *     relaxedEdge, complete }
 *
 * Pure and deterministic: one event maps to exactly one snapshot.
 *
 * lineMap: { init, select, dequeue, skipNode, visit, inspect,
 *            skipEdge, relax, passStart, passComplete,
 *            negativeCycleCheck, negativeCycleDetected, complete }
 * label:   algorithm name used in the call stack root.
 *
 * Options:
 *   knownFromDistances — nodes enter `visited` when they first receive a
 *     finite distance (Bellman-Ford semantics) instead of on visit events
 *     (Dijkstra semantics).
 *   passTracking — snapshots carry `updatedPass` (nodes relaxed in the
 *     current pass) and `pass`/`total`, for pass-based algorithms.
 */
export function projectPathfindingEvents(
  events,
  {
    lineMap,
    label = "algorithm",
    knownFromDistances = false,
    passTracking = false,
  },
) {
  const visited = new Set();
  const visitOrder = [];
  const distances = {};
  const previous = {};
  const heap = [];
  const updatedPass = new Set();
  let currentPass = 0;
  let currentTotal = 0;
  let negativeCycle = false;
  let negativeCycleEdge = null;

  const fmtDist = (d) =>
    d === undefined || !Number.isFinite(d) ? "∞" : String(d);

  const fmtValue = (v) => (v === null ? "∅" : fmtDist(v));
  const fmtMap = (m) =>
    "{ " +
    Object.keys(m)
      .map((k) => `${k}: ${fmtValue(m[k])}`)
      .join(", ") +
    " }";

  const steps = [];

  const snapshot = (event) => {
    const vars = {};
    const memory = {};
    const callStack = [`${label}(graph, start)`];
    let current = null;
    let currentEdge = null;
    let relaxedEdge = null;
    let complete = false;
    let log = "";

    switch (event.type) {
      case "init": {
        for (const n of event.nodes || []) {
          distances[n] = Infinity;
          previous[n] = null;
        }
        distances[event.start] = 0;
        if (knownFromDistances) {
          visited.add(event.start);
          visitOrder.push(event.start);
        }
        Object.assign(vars, {
          start: event.start,
          nodes: String(event.nodeCount),
        });
        Object.assign(memory, { distances: "all ∞", previous: "all ∅" });
        callStack.push(`  └ init from ${event.start}`);
        log = `Initialize: dist[${event.start}] = 0, all others ∞`;
        break;
      }
      case "select-node": {
        heap.push(event.node);
        Object.assign(vars, {
          node: event.node,
          dist: fmtDist(event.distance),
        });
        Object.assign(memory, { heap: `[${heap.join(", ")}]` });
        callStack.push(
          `  └ PQ.push((${event.node}, ${fmtDist(event.distance)}))`,
        );
        log = `Push ${event.node} (d=${fmtDist(event.distance)}) into the priority queue`;
        break;
      }
      case "dequeue": {
        const idx = heap.indexOf(event.node);
        if (idx !== -1) heap.splice(idx, 1);
        current = event.node;
        Object.assign(vars, {
          node: event.node,
          dist: fmtDist(event.distance),
        });
        Object.assign(memory, { heap: `[${heap.join(", ")}]` });
        callStack.push(`  └ PQ.pop() → ${event.node}`);
        log = `Pop ${event.node} (d=${fmtDist(event.distance)}) — min of the queue`;
        break;
      }
      case "skip-node": {
        current = event.node;
        Object.assign(vars, { node: event.node, reason: event.reason });
        callStack.push(`  └ stale entry for ${event.node}`);
        log = `${event.node} already visited — stale queue entry skipped`;
        break;
      }
      case "visit-node": {
        visited.add(event.node);
        visitOrder.push(event.node);
        current = event.node;
        distances[event.node] = event.distance;
        Object.assign(vars, {
          node: event.node,
          dist: fmtDist(event.distance),
        });
        Object.assign(memory, {
          visited: `[${[...visited].join(", ")}]`,
          "dist[node]": fmtDist(event.distance),
        });
        callStack.push(`  └ visit ${event.node}`);
        log = `Visit ${event.node} — shortest distance ${fmtDist(event.distance)} confirmed`;
        break;
      }
      case "inspect-edge": {
        currentEdge = [event.from, event.to];
        Object.assign(vars, {
          from: event.from,
          to: event.to,
          weight: String(event.weight),
        });
        callStack.push(
          `  └ edge ${event.from} → ${event.to} (w=${event.weight})`,
        );
        log = `Inspect edge ${event.from} → ${event.to} (w=${event.weight})`;
        break;
      }
      case "skip-edge": {
        currentEdge = [event.from, event.to];
        Object.assign(vars, {
          from: event.from,
          to: event.to,
          reason: event.reason,
        });
        callStack.push(`  └ skip ${event.from} → ${event.to}`);
        log = `Skip ${event.from} → ${event.to} (${event.reason})`;
        break;
      }
      case "relax-edge": {
        currentEdge = [event.from, event.to];
        relaxedEdge = [event.from, event.to];
        distances[event.to] = event.newDistance;
        previous[event.to] = event.from;
        if (event.enqueue) heap.push(event.to);
        if (knownFromDistances && !visited.has(event.to)) {
          visited.add(event.to);
          visitOrder.push(event.to);
        }
        if (passTracking) updatedPass.add(event.to);
        Object.assign(vars, {
          from: event.from,
          to: event.to,
          "old dist": fmtDist(event.oldDistance),
          "new dist": fmtDist(event.newDistance),
        });
        Object.assign(memory, {
          distances: fmtMap(distances),
          "prev[to]": event.from,
        });
        callStack.push(`  └ relax ${event.from} → ${event.to}`);
        log = `Relax ${event.from} → ${event.to}: ${fmtDist(event.oldDistance)} → ${fmtDist(event.newDistance)}`;
        break;
      }
      case "pass-start": {
        if (passTracking) updatedPass.clear();
        currentPass = event.pass;
        currentTotal = event.total;
        Object.assign(vars, { pass: `${event.pass} / ${event.total}` });
        Object.assign(memory, { distances: fmtMap(distances) });
        callStack.push(`  └ pass ${event.pass} of ${event.total}`);
        log = `Pass ${event.pass} of ${event.total} — relaxing every edge`;
        break;
      }
      case "pass-complete": {
        Object.assign(vars, {
          pass: `${event.pass} / ${event.total}`,
          changes: String(event.changes),
        });
        Object.assign(memory, { distances: fmtMap(distances) });
        callStack.push(`  └ pass ${event.pass} complete`);
        log =
          event.changes > 0
            ? `Pass ${event.pass} complete — ${event.changes} distance update${event.changes === 1 ? "" : "s"}`
            : `Pass ${event.pass} complete — no changes (early stop)`;
        break;
      }
      case "skip-unreachable": {
        currentEdge = [event.from, event.to];
        Object.assign(vars, {
          from: event.from,
          to: event.to,
          reason: event.reason,
        });
        callStack.push(`  └ skip ${event.from} → ${event.to}`);
        log = `Skip ${event.from} → ${event.to} — ${event.from} is unreachable`;
        break;
      }
      case "negative-cycle-check": {
        Object.assign(vars, { check: "extra pass" });
        callStack.push(`  └ negative-cycle check`);
        log = `Extra pass — checking for reachable negative cycles`;
        break;
      }
      case "negative-cycle-detected": {
        negativeCycle = true;
        negativeCycleEdge = [event.from, event.to];
        currentEdge = [event.from, event.to];
        Object.assign(vars, {
          from: event.from,
          to: event.to,
          weight: String(event.weight),
        });
        callStack.push(`  └ negative cycle via ${event.from} → ${event.to}`);
        log = `Negative cycle detected: ${event.from} → ${event.to} still relaxable`;
        break;
      }
      case "complete": {
        complete = true;
        if (event.negativeCycle) {
          Object.assign(vars, {
            "negative cycle": "yes",
            visited: String(event.visitedCount),
            unreachable: String(event.unreachableCount),
          });
          Object.assign(memory, { distances: "invalid (negative cycle)" });
          callStack.push(`  └ negative cycle found`);
          log = `Done with warnings — reachable negative cycle detected, distances are not well-defined`;
        } else {
          Object.assign(vars, {
            visited: String(event.visitedCount),
            unreachable: String(event.unreachableCount),
          });
          Object.assign(memory, {
            distances: fmtMap(distances),
            previous: fmtMap(previous),
          });
          callStack.push(`  └ shortest-path tree complete`);
          log = `Done — ${event.visitedCount} nodes visited, ${event.unreachableCount} unreachable`;
        }
        break;
      }
      default:
        log = event.type;
    }

    steps.push({
      activeLine: lineMap[event.type] ?? lineMap.complete,
      log,
      vars,
      memory,
      callStack,
      visited: new Set(visited),
      visitOrder: [...visitOrder],
      current,
      heap: [...heap],
      queue: [...heap],
      distances: { ...distances },
      previous: { ...previous },
      currentEdge: currentEdge ? [...currentEdge] : null,
      relaxedEdge: relaxedEdge ? [...relaxedEdge] : null,
      negativeCycle,
      negativeCycleEdge: negativeCycleEdge ? [...negativeCycleEdge] : null,
      pass: passTracking ? currentPass : undefined,
      totalPasses: passTracking ? currentTotal : undefined,
      updatedPass: passTracking ? [...updatedPass] : undefined,
      complete,
    });
  };

  for (const event of events) snapshot(event);
  return steps;
}

export { edgeKey };
