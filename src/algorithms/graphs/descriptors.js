import { bfsDebug } from './bfs';
import { dfsDebug } from './dfs';

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
