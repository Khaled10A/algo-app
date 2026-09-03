import { DisjointSet } from "../../core/structures/disjointSet";
import { createEventCollector } from "../../core/execution/events";
import { normalizeGraph, edgeKey } from "./graph";

/**
 * Kruskal's minimum spanning tree (forest for disconnected graphs).
 *
 * Consumes the normalized adjacency model; parallel two-way entries are
 * deduplicated into one undirected edge (matching the editor's
 * undirected convention). Edges are sorted deterministically by weight,
 * then node ids; a Union-Find rejects cycle-forming candidates.
 *
 * Emits the shared MST event vocabulary (no start node — Kruskal orders
 * every edge globally):
 *   init | inspect-edge | reject-edge | select-edge |
 *   disconnected | visit-node | complete
 * `visit-node` marks isolated nodes joining the forest as singleton trees.
 *
 * Returns { edges, totalWeight, visited, visitedOrder, treeCount,
 * connected, events } — no UI coupling.
 */
export function kruskal(graph) {
  if (!graph || typeof graph !== "object") {
    throw new Error("Kruskal requires a graph object");
  }
  const collector = createEventCollector();
  const { emit, events } = collector;

  const { nodes, adjacency } = normalizeGraph(graph);

  const edgeList = [];
  const seen = new Set();
  for (const [from, nbs] of Object.entries(adjacency)) {
    for (const { to, weight } of nbs) {
      const key = edgeKey(from, to);
      if (seen.has(key)) continue;
      seen.add(key);
      edgeList.push({ from, to, weight });
    }
  }

  edgeList.sort(
    (a, b) =>
      a.weight - b.weight ||
      (a.from < b.from ? -1 : a.from > b.from ? 1 : 0) ||
      (a.to < b.to ? -1 : a.to > b.to ? 1 : 0),
  );

  emit("init", { nodeCount: nodes.length, edgeCount: edgeList.length });

  const dsu = new DisjointSet(nodes);
  const mstEdges = [];
  const visitedOrder = [];
  const joined = new Set();
  let totalWeight = 0;

  for (const { from, to, weight } of edgeList) {
    emit("inspect-edge", { from, to, weight });

    if (dsu.connected(from, to)) {
      emit("reject-edge", {
        from,
        to,
        weight,
        reason: "endpoints are already connected — creates a cycle",
      });
      continue;
    }

    dsu.union(from, to);
    mstEdges.push({ from, to, weight });
    totalWeight += weight;
    for (const endpoint of [from, to]) {
      if (!joined.has(endpoint)) {
        joined.add(endpoint);
        visitedOrder.push(endpoint);
      }
    }
    emit("select-edge", { from, to, weight, totalWeight });
  }

  const treeCount = dsu.components;
  const connected = treeCount === 1;

  if (!connected) {
    const mainRoot = nodes.length > 0 ? dsu.find(nodes[0]) : null;
    const outside = nodes.filter((n) => dsu.find(n) !== mainRoot);
    emit("disconnected", { unvisited: outside, treeCount });
  }

  for (const node of nodes) {
    if (!joined.has(node)) {
      joined.add(node);
      visitedOrder.push(node);
      emit("visit-node", { node });
    }
  }

  emit("complete", {
    edgeCount: mstEdges.length,
    totalWeight,
    connected,
    treeCount,
  });

  return {
    edges: mstEdges,
    totalWeight,
    visited: new Set(nodes),
    visitedOrder,
    treeCount,
    connected,
    events,
  };
}
