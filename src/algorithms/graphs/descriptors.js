import { bfsDebug } from './bfs';
import { dfsDebug } from './dfs';
import { dijkstraDebug } from './dijkstraDebug';
import { bellmanFordDebug } from './bellmanFordDebug';

export const GRAPH_BELLMAN_FORD_CODE_LINES = [
  { n: 0, code: "function bellmanFord(graph, start) {" },
  { n: 1, code: "  dist[v] = ∞ ∀v;  dist[start] = 0;  prev = ∅" },
  { n: 2, code: "  edges = all (u → v, w) in graph" },
  { n: 3, code: "  for pass = 1 .. V-1:" },
  { n: 4, code: "    changed = 0" },
  { n: 5, code: "    for each (u → v, w) in edges:" },
  { n: 6, code: "      if dist[u] = ∞: skip edge" },
  { n: 7, code: "      cand = dist[u] + w" },
  { n: 8, code: "      if cand < dist[v]:" },
  { n: 9, code: "        dist[v] = cand;  prev[v] = u;  changed++" },
  { n: 10, code: "    if changed = 0: stop early" },
  { n: 11, code: "  for each (u → v, w):  ← negative-cycle check" },
  { n: 12, code: "    if dist[u] + w < dist[v]: negative cycle" },
  { n: 13, code: "}  ← done" },
];

export const GRAPH_DIJKSTRA_CODE_LINES = [
  { n: 0, code: "function dijkstra(graph, start) {" },
  { n: 1, code: "  dist[v] = ∞ ∀v;  dist[start] = 0;  prev = ∅" },
  { n: 2, code: "  PQ = MinHeap;  PQ.push((start, 0))" },
  { n: 3, code: "  while PQ not empty:" },
  { n: 4, code: "    (u, d) = PQ.pop()" },
  { n: 5, code: "    if u visited: continue   ← stale entry" },
  { n: 6, code: "    visit u;  mark u visited" },
  { n: 7, code: "    for each edge (u → v, w):" },
  { n: 8, code: "      if v visited: skip edge" },
  { n: 9, code: "      cand = d + w" },
  { n: 10, code: "      if cand < dist[v]:" },
  { n: 11, code: "        dist[v] = cand;  prev[v] = u;  PQ.push((v, cand))" },
  { n: 12, code: "}  ← shortest-path tree complete" },
];

export const GRAPH_BFS_CODE_LINES = [
  { n: 0, code: "function bfs(graph, start) {" },
  { n: 1, code: "  visited = {start};  queue = [start]" },
  { n: 2, code: "  node = queue.dequeue();  visit(node)" },
  { n: 3, code: "" },
  { n: 4, code: "  for v in adj[node]: check neighbor v" },
  { n: 5, code: "    if not visited[v] → enqueue(v); else skip" },
  { n: 6, code: "}" },
];

export const GRAPH_DFS_CODE_LINES = [
  { n: 0, code: "function dfs(graph, start) {" },
  { n: 1, code: "  visited = ∅;  callStack = []" },
  { n: 2, code: "  visit(u): mark visited, push(u)" },
  { n: 3, code: "" },
  { n: 4, code: "  for v in adj[u]: check neighbor v" },
  { n: 5, code: "    if not visited[v] → dfs(v); else skip" },
  { n: 6, code: "  pop(u)  ← u fully explored" },
  { n: 7, code: "}" },
];

export const graphDescriptors = [
  {
    id: "dfs",
    name: "DFS",
    category: "graphs",
    color: "#0a84ff",
    complexity: {
      best: "O(V + E)",
      average: "O(V + E)",
      worst: "O(V + E)",
      space: "O(V)",
      paradigm: "Graph Traversal",
    },
    run: null,
    steps: null,
    debug: (graph, start) => dfsDebug(graph, start),
    pseudocode: `DFS(graph, start):
  visited = empty set
  stack = [start]

 visit(u):
   mark u as visited
   push u onto callStack
   for each neighbor v of u:
     if v is not visited:
       visit(v)
   pop u from callStack`,
    codeLines: GRAPH_DFS_CODE_LINES,
  },
  {
    id: "dijkstra",
    name: "Dijkstra",
    category: "graphs",
    color: "#30d158",
    complexity: {
      best: "O((V + E) log V)",
      average: "O((V + E) log V)",
      worst: "O((V + E) log V)",
      space: "O(V + E)",
      paradigm: "Greedy / Shortest Paths",
    },
    run: null,
    steps: null,
    debug: (graph, start) => dijkstraDebug(graph, start),
    pseudocode: `Dijkstra(graph, start):
  dist[v] = ∞ for all v;  dist[start] = 0
  prev[v] = ∅;  visited = ∅
  PQ = MinHeap;  PQ.push((start, 0))
  while PQ is not empty:
    (u, d) = PQ.pop()
    if u is visited: continue        (stale entry)
    visit u;  mark u visited
    for each edge (u → v, w):
      if v is visited: skip edge
      cand = d + w
      if cand < dist[v]:
        dist[v] = cand
        prev[v] = u;  PQ.push((v, cand))
  ← shortest-path tree complete`,
    codeLines: GRAPH_DIJKSTRA_CODE_LINES,
  },
  {
    id: "bellman-ford",
    name: "Bellman-Ford",
    category: "graphs",
    color: "#bf5af2",
    complexity: {
      best: "O(V · E)",
      average: "O(V · E)",
      worst: "O(V · E) — plus O(V · E) cycle check",
      space: "O(V)",
      paradigm: "Dynamic Programming / Shortest Paths",
    },
    run: null,
    steps: null,
    debug: (graph, start) => bellmanFordDebug(graph, start),
    pseudocode: `BellmanFord(graph, start):
  dist[v] = ∞ for all v;  dist[start] = 0
  prev[v] = ∅
  edges = all edges (u → v, w)
  repeat V-1 times:
    changed = 0
    for each edge (u → v, w):
      if dist[u] = ∞: skip edge
      cand = dist[u] + w
      if cand < dist[v]:
        dist[v] = cand
        prev[v] = u;  changed++
    if changed = 0: stop early
  for each edge (u → v, w):
    if dist[u] + w < dist[v]:
      report reachable negative cycle
  ← done`,
    codeLines: GRAPH_BELLMAN_FORD_CODE_LINES,
  },
  {
    id: "bfs",
    name: "BFS",
    category: "graphs",
    color: "#ff375f",
    complexity: {
      best: "O(V + E)",
      average: "O(V + E)",
      worst: "O(V + E)",
      space: "O(V)",
      paradigm: "Graph Traversal",
    },
    run: null,
    steps: null,
    debug: (graph, start) => bfsDebug(graph, start),
    pseudocode: `BFS(graph, start):
  visited = {start}
  queue = [start]
  while queue is not empty:
    node = queue.dequeue()
    visit(node)
    for each neighbor v of node:
      if v is not visited:
        visited.add(v)
        queue.enqueue(v)`,
    codeLines: GRAPH_BFS_CODE_LINES,
  },
];
