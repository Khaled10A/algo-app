import { normalizeGraph } from "./graph";

/**
 * DFS — Depth First Search
 * Time: O(V + E) | Space: O(V)
 */
export function dfsDebug(graph, start) {
  const { adjacency } = normalizeGraph(graph);
  const steps = [];
  const visited = new Set();
  const callStack = [];
  const visitOrder = [];

  const snap = (activeLine, current, vars, log) => steps.push({
    activeLine,
    visited: new Set(visited),
    callStack: [...callStack],
    visitOrder: [...visitOrder],
    current,
    vars,
    log,
  });

  function dfs(node) {
    callStack.push(node);
    visited.add(node);
    visitOrder.push(node);
    snap(2, node, { u: node, seen: [...visited].join(",") }, `Visit ${node}`);

    for (const { to: neighbor } of adjacency[node]) {
      snap(4, node, { u: node, v: neighbor }, `Check neighbor ${neighbor}`);
      if (!visited.has(neighbor)) {
        snap(5, node, { u: node, v: neighbor }, `${neighbor} not visited → go deeper`);
        dfs(neighbor);
      } else {
        snap(5, node, { u: node, v: neighbor }, `${neighbor} already visited → skip`);
      }
    }
    callStack.pop();
    snap(6, node, { u: node }, `${node} fully explored → pop from stack`);
  }

  snap(0, start, {}, `Start DFS from node ${start}`);
  dfs(start);
  snap(7, null, {}, `DFS complete! Visit order: ${visitOrder.join(" → ")}`);
  return steps;
}
