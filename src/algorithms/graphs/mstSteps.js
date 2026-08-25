import { edgeKey } from "./graph";

/**
 * Projects MST event sequences (Prim today, Kruskal tomorrow) into the
 * existing debugger step schema:
 *
 *   { activeLine, log, vars, memory, callStack, visited, visitOrder,
 *     current, frontier, mstEdges, totalWeight, candidateEdge,
 *     rejectedEdge, treeCount, connected, complete }
 *
 * Frontier mirror: enqueue-edge adds, inspect/select/reject remove the
 * matching edge — mirroring the algorithm's priority queue deterministically.
 *
 * Pure and deterministic: one event maps to exactly one snapshot.
 *
 * lineMap: { init, startNode, visitNode, enqueueEdge, inspectEdge,
 *            rejectEdge, selectEdge, disconnected, complete }
 */
export function projectMstEvents(events, { lineMap, label = "algorithm" }) {
  const visited = new Set();
  const visitOrder = [];
  const mstEdges = [];
  const frontier = [];
  let totalWeight = 0;
  let treeCount = 1;
  let connected = true;
  let current = null;
  let candidateEdge = null;
  let rejectedEdge = null;
  let complete = false;

  const steps = [];

  const snapshot = (event) => {
    const vars = {};
    const memory = {};
    const callStack = [`${label}(graph, start)`];
    let log = "";

    const popFrontier = () => {
      const idx = frontier.findIndex(
        (e) => e.from === event.from && e.to === event.to && e.weight === event.weight
      );
      if (idx !== -1) frontier.splice(idx, 1);
    };

    switch (event.type) {
      case "init": {
        Object.assign(vars, { nodes: String(event.nodeCount) });
        callStack.push("  └ init");
        log = `Initialize — ${event.nodeCount} nodes, growth origin ${event.start ?? "TBD"}`;
        break;
      }
      case "start-node": {
        visited.add(event.node);
        visitOrder.push(event.node);
        current = event.node;
        Object.assign(vars, { origin: event.node });
        Object.assign(memory, { visited: `[${[...visited].join(", ")}]` });
        callStack.push(`  └ growth origin ${event.node}`);
        log = `Tree grows from ${event.node}`;
        break;
      }
      case "visit-node": {
        visited.add(event.node);
        visitOrder.push(event.node);
        current = event.node;
        Object.assign(vars, { node: event.node });
        Object.assign(memory, {
          visited: `[${[...visited].join(", ")}]`,
          "tree edges": String(mstEdges.length),
        });
        callStack.push(`  └ visit ${event.node}`);
        log = `Visit ${event.node} — joins the tree`;
        break;
      }
      case "enqueue-edge": {
        frontier.push({ from: event.from, to: event.to, weight: event.weight });
        Object.assign(vars, {
          edge: `${event.from} — ${event.to}`,
          weight: String(event.weight),
        });
        Object.assign(memory, { "frontier size": String(frontier.length) });
        callStack.push(`  └ enqueue ${event.from} — ${event.to}`);
        log = `Enqueue candidate ${event.from} — ${event.to} (w=${event.weight})`;
        break;
      }
      case "inspect-edge": {
        popFrontier();
        current = event.from;
        candidateEdge = [event.from, event.to];
        Object.assign(vars, {
          edge: `${event.from} — ${event.to}`,
          weight: String(event.weight),
        });
        Object.assign(memory, { "frontier size": String(frontier.length) });
        callStack.push(`  └ inspect ${event.from} — ${event.to}`);
        log = `Inspect minimum edge ${event.from} — ${event.to} (w=${event.weight})`;
        break;
      }
      case "reject-edge": {
        popFrontier();
        rejectedEdge = [event.from, event.to];
        Object.assign(vars, {
          edge: `${event.from} — ${event.to}`,
          reason: event.reason,
        });
        callStack.push(`  └ reject ${event.from} — ${event.to}`);
        log = `Reject ${event.from} — ${event.to} (${event.reason})`;
        break;
      }
      case "select-edge": {
        popFrontier();
        mstEdges.push({ from: event.from, to: event.to, weight: event.weight });
        totalWeight += event.weight;
        candidateEdge = null;
        rejectedEdge = null;
        visited.add(event.from);
        visited.add(event.to);
        if (!visitOrder.includes(event.from)) visitOrder.push(event.from);
        if (!visitOrder.includes(event.to)) visitOrder.push(event.to);
        current = event.to;
        Object.assign(vars, {
          edge: `${event.from} — ${event.to}`,
          weight: String(event.weight),
          "MST total": String(totalWeight),
        });
        Object.assign(memory, {
          "tree edges": String(mstEdges.length),
          "MST total": String(totalWeight),
        });
        callStack.push(`  └ select ${event.from} — ${event.to}`);
        log = `Select ${event.from} — ${event.to} (w=${event.weight}) — MST total ${totalWeight}`;
        break;
      }
      case "disconnected": {
        connected = false;
        treeCount = event.treeCount;
        Object.assign(vars, { unvisited: (event.unvisited || []).join(", ") });
        Object.assign(memory, { trees: String(treeCount) });
        callStack.push(`  └ graph disconnected — new tree`);
        log = `Graph disconnected — growing tree ${treeCount} from ${(event.unvisited || [])[0] ?? "?"}`;
        break;
      }
      case "complete": {
        complete = true;
        Object.assign(vars, {
          "MST edges": String(event.edgeCount),
          "MST total": String(event.totalWeight),
          trees: String(event.treeCount),
        });
        Object.assign(memory, {
          "MST total": String(event.totalWeight),
          connected: event.connected ? "yes" : "no (forest)",
        });
        callStack.push(
          event.connected
            ? "  └ minimum spanning tree complete"
            : "  └ minimum spanning forest complete"
        );
        log = event.connected
          ? `Done — MST has ${event.edgeCount} edges, total weight ${event.totalWeight}`
          : `Done — graph disconnected: minimum spanning FOREST with ${event.treeCount} trees, total weight ${event.totalWeight}`;
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
      frontier: frontier.map((e) => ({ ...e })),
      mstEdges: mstEdges.map((e) => ({ ...e })),
      totalWeight,
      candidateEdge: candidateEdge ? [...candidateEdge] : null,
      rejectedEdge: rejectedEdge ? [...rejectedEdge] : null,
      treeCount,
      connected,
      complete,
    });
  };

  for (const event of events) snapshot(event);
  return steps;
}

export { edgeKey };
