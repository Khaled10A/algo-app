import { MinHeap } from "../../core/structures/minHeap";
import { createEventCollector } from "../../core/execution/events";
import { normalizeGraph } from "./graph";

/**
 * Prim's minimum spanning tree (forest for disconnected graphs).
 *
 * Consumes the normalized adjacency model. Edges are treated as
 * undirected (matching the playground/editor convention): a frontier
 * edge connects a visited node to an unvisited node.
 *
 * Disconnected graphs: when the frontier empties with unvisited nodes
 * remaining, a new tree is grown from the smallest-id unvisited node
 * and a `disconnected` event marks the forest boundary — the result is
 * a minimum spanning forest, never a silently-claimed single MST.
 *
 * Emits a deterministic event sequence:
 *   init | start-node | visit-node | enqueue-edge | inspect-edge |
 *   reject-edge | select-edge | disconnected | complete
 *
 * Returns { edges, totalWeight, visited, visitedOrder, treeCount,
 * connected, events } — no UI coupling.
 */
export function prim(graph, start) {
  if (!graph || typeof graph !== "object") {
    throw new Error("Prim requires a graph object");
  }
  const { nodes, adjacency } = normalizeGraph(graph);
  if (nodes.length === 0) {
    throw new Error("Prim requires a non-empty graph");
  }
  if (!nodes.includes(start)) {
    throw new Error(`Unknown start node: ${start}`);
  }

  const collector = createEventCollector();
  const { emit, events } = collector;

  const visited = new Set();
  const visitedOrder = [];
  const mstEdges = [];
  let totalWeight = 0;
  let treeCount = 1;

  const heap = new MinHeap(
    (a, b) =>
      a.weight - b.weight ||
      (a.from < b.from ? -1 : a.from > b.from ? 1 : 0) ||
      (a.to < b.to ? -1 : 1),
  );

  emit("init", { nodeCount: nodes.length, start });

  function enqueueFrontier(from) {
    for (const { to, weight } of adjacency[from]) {
      if (!visited.has(to)) {
        heap.push({ from, to, weight });
        emit("enqueue-edge", { from, to, weight });
      }
    }
  }

  function growTree(origin) {
    visited.add(origin);
    visitedOrder.push(origin);
    emit("start-node", { node: origin });
    emit("visit-node", { node: origin });
    enqueueFrontier(origin);
  }

  growTree(start);

  while (true) {
    if (heap.size === 0) {
      const unvisited = nodes.filter((n) => !visited.has(n));
      if (unvisited.length === 0) break;
      emit("disconnected", {
        unvisited: [...unvisited],
        treeCount: treeCount + 1,
      });
      treeCount++;
      growTree(unvisited[0]);
      continue;
    }

    const edge = heap.pop();
    emit("inspect-edge", { from: edge.from, to: edge.to, weight: edge.weight });

    if (visited.has(edge.to) && visited.has(edge.from)) {
      emit("reject-edge", {
        from: edge.from,
        to: edge.to,
        weight: edge.weight,
        reason: "both endpoints already in the tree",
      });
      continue;
    }
    if (visited.has(edge.to)) {
      emit("reject-edge", {
        from: edge.from,
        to: edge.to,
        weight: edge.weight,
        reason: "target already in the tree",
      });
      continue;
    }

    visited.add(edge.to);
    visitedOrder.push(edge.to);
    mstEdges.push({ from: edge.from, to: edge.to, weight: edge.weight });
    totalWeight += edge.weight;
    emit("select-edge", {
      from: edge.from,
      to: edge.to,
      weight: edge.weight,
      totalWeight,
    });
    enqueueFrontier(edge.to);
  }

  const connected = treeCount === 1;
  emit("complete", {
    edgeCount: mstEdges.length,
    totalWeight,
    connected,
    treeCount,
  });

  return {
    edges: mstEdges,
    totalWeight,
    visited,
    visitedOrder,
    treeCount,
    connected,
    events,
  };
}
