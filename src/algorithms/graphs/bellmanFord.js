import { createEventCollector } from "../../core/execution/events";
import { normalizeGraph } from "./graph";

/**
 * Bellman-Ford shortest paths from a single source.
 *
 * Unlike Dijkstra, negative edge weights are allowed. After V-1
 * relaxation passes, one extra pass detects reachable negative cycles;
 * unreachable negative cycles do not affect the result.
 *
 * Emits a deterministic event sequence:
 *   init | pass-start | inspect-edge | skip-unreachable | skip-edge |
 *   relax-edge | pass-complete | negative-cycle-check |
 *   negative-cycle-detected | complete
 *
 * Returns { distances, previous, visitedOrder, events, negativeCycle,
 * negativeCycleEdge, earlyStopped, passes } — no UI coupling.
 */
export function bellmanFord(graph, start) {
  if (!graph || typeof graph !== "object") {
    throw new Error("Bellman-Ford requires a graph object");
  }
  const { nodes, adjacency } = normalizeGraph(graph);
  if (!nodes.includes(start)) {
    throw new Error(`Unknown start node: ${start}`);
  }

  const collector = createEventCollector();
  const { emit, events } = collector;

  const distances = {};
  const previous = {};
  for (const node of nodes) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[start] = 0;

  const knownOrder = [start];
  const known = new Set([start]);

  const edgeList = [];
  for (const [from, nbs] of Object.entries(adjacency)) {
    for (const { to, weight } of nbs) {
      edgeList.push({ from, to, weight });
    }
  }

  emit("init", { start, nodeCount: nodes.length, nodes: [...nodes] });

  const totalPasses = Math.max(nodes.length - 1, 0);
  let earlyStopped = false;
  let pass = 0;

  for (pass = 1; pass <= totalPasses; pass++) {
    emit("pass-start", { pass, total: totalPasses });

    let changes = 0;
    for (const { from, to, weight } of edgeList) {
      emit("inspect-edge", { from, to, weight, pass });

      if (!Number.isFinite(distances[from])) {
        emit("skip-unreachable", { from, to, reason: "source unreachable", pass });
        continue;
      }

      const candidate = distances[from] + weight;
      if (candidate < distances[to]) {
        const oldDistance = distances[to];
        distances[to] = candidate;
        previous[to] = from;
        changes++;
        if (!known.has(to)) {
          known.add(to);
          knownOrder.push(to);
        }
        emit("relax-edge", {
          from,
          to,
          weight,
          oldDistance,
          newDistance: candidate,
          pass,
        });
      } else {
        emit("skip-edge", { from, to, reason: "no-improvement", pass });
      }
    }

    emit("pass-complete", { pass, total: totalPasses, changes });

    if (changes === 0) {
      earlyStopped = true;
      break;
    }
  }

  emit("negative-cycle-check", {});

  let negativeCycle = false;
  let negativeCycleEdge = null;
  for (const { from, to, weight } of edgeList) {
    if (
      Number.isFinite(distances[from]) &&
      distances[from] + weight < distances[to]
    ) {
      negativeCycle = true;
      negativeCycleEdge = [from, to];
      emit("negative-cycle-detected", { from, to, weight });
      break;
    }
  }

  const unreachableCount = nodes.filter(
    (n) => !Number.isFinite(distances[n])
  ).length;

  emit("complete", {
    visitedCount: known.size,
    unreachableCount,
    negativeCycle,
  });

  return {
    distances,
    previous,
    visitedOrder: knownOrder,
    events,
    negativeCycle,
    negativeCycleEdge,
    earlyStopped,
    passes: pass,
  };
}
