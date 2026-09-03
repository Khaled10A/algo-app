import { MinHeap } from "../../core/structures/minHeap";
import { createEventCollector } from "../../core/execution/events";
import { normalizeGraph } from "./graph";

/**
 * Dijkstra's shortest paths from a single source.
 *
 * Consumes the normalized adjacency model (string entries = weight 1,
 * [to, weight] pairs = weighted). Directed: only listed edges are used.
 *
 * Emits a deterministic event sequence:
 *   init | select-node | dequeue | skip-node | visit-node |
 *   inspect-edge | skip-edge | relax-edge | complete
 *
 * Returns { distances, previous, visitedOrder, events } — no UI coupling.
 */
export function dijkstra(graph, start) {
  if (!graph || typeof graph !== "object") {
    throw new Error("Dijkstra requires a graph object");
  }
  const { nodes, adjacency } = normalizeGraph(graph);
  if (!nodes.includes(start)) {
    throw new Error(`Unknown start node: ${start}`);
  }

  for (const [node, nbs] of Object.entries(adjacency)) {
    for (const { to, weight } of nbs) {
      if (weight < 0) {
        throw new Error(
          `Dijkstra does not support negative weights (edge ${node} → ${to}: ${weight})`,
        );
      }
    }
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

  const visited = new Set();
  const visitedOrder = [];
  const heap = new MinHeap(
    (a, b) => a.dist - b.dist || (a.node < b.node ? -1 : 1),
  );

  emit("init", { start, nodeCount: nodes.length, nodes: [...nodes] });

  heap.push({ node: start, dist: 0 });
  emit("select-node", { node: start, distance: 0 });

  while (heap.size > 0) {
    const { node, dist } = heap.pop();
    emit("dequeue", { node, distance: dist });

    if (visited.has(node)) {
      emit("skip-node", { node, distance: dist, reason: "stale" });
      continue;
    }

    visited.add(node);
    visitedOrder.push(node);
    emit("visit-node", { node, distance: dist });

    for (const { to, weight } of adjacency[node]) {
      emit("inspect-edge", { from: node, to, weight });

      if (visited.has(to)) {
        emit("skip-edge", { from: node, to, reason: "visited" });
        continue;
      }

      const candidate = dist + weight;
      if (candidate < distances[to]) {
        const oldDistance = distances[to];
        distances[to] = candidate;
        previous[to] = node;
        heap.push({ node: to, dist: candidate });
        emit("relax-edge", {
          from: node,
          to,
          weight,
          oldDistance,
          newDistance: candidate,
          enqueue: true,
        });
      } else {
        emit("skip-edge", { from: node, to, reason: "no-improvement" });
      }
    }
  }

  emit("complete", {
    visitedCount: visited.size,
    unreachableCount: nodes.filter((n) => !Number.isFinite(distances[n]))
      .length,
  });

  return { distances, previous, visitedOrder, events };
}
