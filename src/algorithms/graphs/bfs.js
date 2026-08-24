/**
 * BFS — Breadth First Search  
 * Time: O(V + E) | Space: O(V)
 */
export function bfsDebug(graph, start) {
  const steps = [];
  const visited = new Set();
  const queue = [];
  const visitOrder = [];

  const snap = (activeLine, current, vars, log) => steps.push({
    activeLine,
    visited: new Set(visited),
    queue: [...queue],
    visitOrder: [...visitOrder],
    current,
    vars,
    log,
  });

  visited.add(start);
  queue.push(start);
  snap(0, start, { queue: `[${start}]` }, `Start BFS from ${start}`);

  while (queue.length > 0) {
    const node = queue.shift();
    visitOrder.push(node);
    snap(2, node, { node, queue: `[${queue.join(",")}]` }, `Dequeue ${node}`);

    for (const neighbor of (graph[node] || [])) {
      snap(4, node, { node, v: neighbor }, `Check neighbor ${neighbor}`);
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        snap(5, node, { node, v: neighbor, queue: `[${queue.join(",")}]` },
          `${neighbor} not visited → enqueue`);
      } else {
        snap(5, node, { node, v: neighbor }, `${neighbor} already visited → skip`);
      }
    }
  }

  snap(6, null, {}, `BFS complete! Visit order: ${visitOrder.join(" → ")}`);
  return steps;
}
