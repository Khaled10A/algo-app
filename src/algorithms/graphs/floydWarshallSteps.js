/**
 * Projects Floyd-Warshall event sequences into debugger snapshots.
 * Matrix-oriented counterpart of projectPathfindingEvents — same
 * event → projector → snapshot seam, domain-specific state.
 *
 * Snapshot shape:
 *   { activeLine, log, vars, memory, callStack,
 *     nodes, matrix, next, k, kNode, i, j, pair,
 *     candidate, oldDistance, updated, updatedCells,
 *     negativeCycle, negativeCycleNodes, complete }
 *
 * Pure and deterministic: one event maps to exactly one snapshot.
 *
 * lineMap: { init, kStart, inspectPair, updateDistance, kComplete,
 *            negativeCycleCheck, negativeCycleDetected, complete }
 */
const fmtDist = (d) =>
  d === undefined || !Number.isFinite(d) ? "∞" : String(d);

export function projectMatrixEvents(events, { lineMap, label = "algorithm" }) {
  let nodes = [];
  let matrix = {};
  let next = {};
  let negativeCycleNodes = [];
  let negativeCycle = false;

  const steps = [];

  const snapshot = (event) => {
    const vars = {};
    const memory = {};
    const callStack = [`${label}(graph)`];
    let k = null;
    let kNode = null;
    let i = null;
    let j = null;
    let pair = null;
    let candidate = null;
    let oldDistance = null;
    let updated = false;
    let complete = false;
    let log = "";

    switch (event.type) {
      case "init": {
        nodes = [...event.nodes];
        matrix = copyMatrix(event.matrix);
        next = copyMatrix(event.next);
        Object.assign(vars, { nodes: String(event.size) });
        Object.assign(memory, { matrix: "direct weights, diagonal 0" });
        callStack.push("  └ init matrix from edges");
        log = `Initialize ${event.size}×${event.size} matrix: direct edge weights, diagonal 0, unreachable ∞`;
        break;
      }
      case "k-start": {
        k = event.k;
        kNode = event.node;
        Object.assign(vars, {
          k: event.node,
          pass: `${k + 1} / ${nodes.length}`,
        });
        Object.assign(memory, { "via node": event.node });
        callStack.push(`  └ intermediate node ${event.node}`);
        log = `Intermediate node ${event.node} — paths may now route through it`;
        break;
      }
      case "inspect-pair": {
        k = event.k;
        kNode = event.kNode;
        i = event.i;
        j = event.j;
        pair = [event.i, event.j];
        candidate = event.candidate;
        oldDistance = event.currentDist;
        Object.assign(vars, {
          pair: `${event.i} → ${event.j}`,
          via: event.kNode,
          current: fmtDist(event.currentDist),
          candidate: fmtDist(event.candidate),
        });
        Object.assign(memory, {
          "D[i][k]": fmtDist(matrix[event.i][event.kNode]),
          "D[k][j]": fmtDist(matrix[event.kNode][event.j]),
        });
        callStack.push(
          `  └ compare ${event.i} → ${event.j} via ${event.kNode}`,
        );
        log = `Compare ${event.i} → ${event.j}: ${fmtDist(event.currentDist)} vs ${fmtDist(event.i)} → ${event.kNode} → ${event.j} (${fmtDist(event.candidate)})`;
        break;
      }
      case "update-distance": {
        k = event.k;
        kNode = event.k;
        i = event.i;
        j = event.j;
        pair = [event.i, event.j];
        candidate = event.newDistance;
        oldDistance = event.oldDistance;
        updated = true;
        matrix[event.i][event.j] = event.newDistance;
        Object.assign(vars, {
          pair: `${event.i} → ${event.j}`,
          via: event.kNode,
          "old dist": fmtDist(event.oldDistance),
          "new dist": fmtDist(event.newDistance),
        });
        Object.assign(memory, {
          "D[i][j]": fmtDist(event.newDistance),
          "next[i][j]": next[event.i] ? next[event.i][event.j] : "∅",
        });
        callStack.push(`  └ update ${event.i} → ${event.j} via ${event.kNode}`);
        log = `Update ${event.i} → ${event.j}: ${fmtDist(event.oldDistance)} → ${fmtDist(event.newDistance)} via ${event.kNode}`;
        break;
      }
      case "k-complete": {
        k = event.k;
        kNode = event.node;
        Object.assign(vars, { k: event.node, updates: String(event.updates) });
        callStack.push(`  └ intermediate ${event.node} done`);
        log = `Node ${event.node} processed — ${event.updates} distance update${event.updates === 1 ? "" : "s"}`;
        break;
      }
      case "negative-cycle-check": {
        Object.assign(vars, { check: "diagonal D[i][i] < 0" });
        callStack.push(`  └ negative-cycle check on diagonal`);
        log = `Checking diagonal for negative cycles`;
        break;
      }
      case "negative-cycle-detected": {
        negativeCycle = true;
        if (!negativeCycleNodes.includes(event.node))
          negativeCycleNodes.push(event.node);
        Object.assign(vars, {
          node: event.node,
          "D[i][i]": fmtDist(event.distance),
        });
        Object.assign(memory, { "D[i][i]": fmtDist(event.distance) });
        callStack.push(`  └ negative cycle through ${event.node}`);
        log = `Negative cycle detected through ${event.node} (D[${event.node}][${event.node}] = ${fmtDist(event.distance)})`;
        break;
      }
      case "complete": {
        complete = true;
        if (event.negativeCycle) {
          Object.assign(vars, {
            "negative cycle": "yes",
            affected: (event.negativeCycleNodes || []).join(", ") || "none",
          });
          Object.assign(memory, { distances: "invalid (negative cycle)" });
          callStack.push(`  └ negative cycle found`);
          log = `Done with warnings — negative cycle through ${(event.negativeCycleNodes || []).join(", ")}, distances not well-defined`;
        } else {
          Object.assign(vars, { pairs: String(event.size * event.size) });
          Object.assign(memory, {
            matrix: `${event.size}×${event.size} complete`,
          });
          callStack.push(`  └ all-pairs matrix complete`);
          log = `Done — all-pairs shortest distances computed for ${event.size} nodes`;
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
      nodes: [...nodes],
      matrix: copyMatrix(matrix),
      next: copyMatrix(next),
      k,
      kNode,
      i,
      j,
      pair: pair ? [...pair] : null,
      candidate,
      oldDistance,
      updated,
      negativeCycle,
      negativeCycleNodes: [...negativeCycleNodes],
      complete,
    });
  };

  for (const event of events) snapshot(event);
  return steps;
}

function copyMatrix(m) {
  const copy = {};
  for (const [i, row] of Object.entries(m)) copy[i] = { ...row };
  return copy;
}

function fmtMap(m, order) {
  const keys = order || Object.keys(m);
  return "{ " + keys.map((k) => `${k}: ${fmtDist(m[k])}`).join(", ") + " }";
}
