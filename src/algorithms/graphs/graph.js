/**
 * Graph model normalization.
 *
 * The existing graph model is an adjacency object. Neighbor entries may be
 * a plain string (unweighted, weight 1) or a [to, weight] pair (weighted).
 * Normalizers let unweighted algorithms (BFS/DFS) and weighted algorithms
 * (Dijkstra, future Bellman-Ford/Prim) share one representation.
 */
export function normalizeEdge(entry) {
  if (Array.isArray(entry)) return { to: entry[0], weight: entry[1] };
  return { to: entry, weight: 1 };
}

export function normalizeGraph(graph) {
  const nodes = Object.keys(graph || {});
  const adjacency = {};
  for (const node of nodes) {
    adjacency[node] = (graph[node] || []).map(normalizeEdge);
  }
  return { nodes, adjacency };
}

export function isWeightedGraph(graph) {
  return Object.values(graph || {}).some((nbs) =>
    (nbs || []).some((e) => Array.isArray(e))
  );
}

/** Undirected edge identity, matching the existing visual dedup rule. */
export function edgeKey(a, b) {
  return a < b ? `${a}~${b}` : `${b}~${a}`;
}
