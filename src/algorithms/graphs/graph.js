/**
 * Graph model normalization + pure editing operations.
 *
 * The existing graph model is an adjacency object. Neighbor entries may be
 * a plain string (unweighted, weight 1) or a [to, weight] pair (weighted).
 * Normalizers let unweighted algorithms (BFS/DFS) and weighted algorithms
 * (Dijkstra, future Bellman-Ford/Prim) share one representation.
 *
 * Editing operations are pure, validate input, throw descriptive errors,
 * and follow the visual convention that edges are undirected: adding or
 * removing an edge touches both directions.
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

/* ── Editing operations ───────────────────────────────────────── */

export const DEFAULT_GRAPH = {
  A: [["B", 4], ["D", 2]],
  B: [["A", 4], ["C", 5], ["E", 10]],
  C: [["B", 5], ["F", 3]],
  D: [["A", 2], ["E", 7]],
  E: [["B", 10], ["D", 7], ["F", 4]],
  F: [["C", 3], ["E", 4]],
  G: [["D", 3]],
};

/** Fresh, independent copy of the example graph. */
export function createDefaultGraph() {
  return JSON.parse(JSON.stringify(DEFAULT_GRAPH));
}

export function createEmptyGraph() {
  return {};
}

function assertValidId(id) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Node id cannot be empty");
  }
}

function assertWeight(weight) {
  if (typeof weight !== "number" || !Number.isFinite(weight)) {
    throw new Error(`Invalid weight: ${String(weight)} — enter a finite number`);
  }
}

function hasDirectedEdge(graph, from, to) {
  return (graph[from] || []).some((e) => normalizeEdge(e).to === to);
}

export function hasEdge(graph, from, to) {
  return hasDirectedEdge(graph, from, to) || hasDirectedEdge(graph, to, from);
}

export function addNode(graph, id) {
  assertValidId(id);
  if (graph[id]) throw new Error(`Node "${id}" already exists`);
  return { ...graph, [id]: [] };
}

export function removeNode(graph, id) {
  assertValidId(id);
  if (!graph[id]) throw new Error(`Node "${id}" does not exist`);
  const next = {};
  for (const [node, nbs] of Object.entries(graph)) {
    if (node === id) continue;
    next[node] = nbs.filter((e) => normalizeEdge(e).to !== id);
  }
  return next;
}

export function addEdge(graph, from, to, weight) {
  assertValidId(from);
  assertValidId(to);
  if (!(from in graph)) throw new Error(`Node "${from}" does not exist`);
  if (!(to in graph)) throw new Error(`Node "${to}" does not exist`);
  if (from === to) throw new Error("Self-loops are not supported");
  if (hasEdge(graph, from, to)) {
    throw new Error(`Edge ${from} — ${to} already exists (edit its weight instead)`);
  }
  assertWeight(weight);
  const next = { ...graph };
  next[from] = [...(next[from] || []), [to, weight]];
  next[to] = [...(next[to] || []), [from, weight]];
  return next;
}

export function removeEdge(graph, from, to) {
  assertValidId(from);
  assertValidId(to);
  if (!hasEdge(graph, from, to)) {
    throw new Error(`Edge ${from} — ${to} does not exist`);
  }
  const removeFrom = (nbs, target) => nbs.filter((e) => normalizeEdge(e).to !== target);
  const next = { ...graph };
  if (next[from]) next[from] = removeFrom(next[from], to);
  if (next[to]) next[to] = removeFrom(next[to], from);
  return next;
}

export function setEdgeWeight(graph, from, to, weight) {
  assertWeight(weight);
  if (!hasEdge(graph, from, to)) {
    throw new Error(`Edge ${from} — ${to} does not exist`);
  }
  const setW = (nbs, target) =>
    nbs.map((e) => {
      const norm = normalizeEdge(e);
      return norm.to === target ? [norm.to, weight] : e;
    });
  const next = { ...graph };
  if (next[from]) next[from] = setW(next[from], to);
  if (next[to]) next[to] = setW(next[to], from);
  return next;
}

/** First unused single-letter id, then N1, N2, … */
export function nextNodeId(graph) {
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (!graph[letter]) return letter;
  }
  let i = 1;
  while (graph[`N${i}`]) i++;
  return `N${i}`;
}
