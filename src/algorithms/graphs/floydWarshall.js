import { createEventCollector } from "../../core/execution/events";
import { normalizeGraph } from "./graph";

/**
 * Floyd-Warshall all-pairs shortest paths.
 *
 * Consumes the normalized adjacency model (string entries = weight 1,
 * [to, weight] pairs = weighted). Directed semantics: only listed edges
 * are used — an undirected negative edge therefore yields a negative
 * cycle (i — j — i = 2w < 0), which the diagonal check reports.
 *
 * Emits a deterministic event sequence:
 *   init | k-start | inspect-pair | update-distance | k-complete |
 *   negative-cycle-check | negative-cycle-detected | complete
 *
 * Returns { nodes, matrix, next, events, negativeCycle, negativeCycleNodes }
 * — matrix and next are V×V structures keyed by node id; next supports
 * path reconstruction. No UI coupling.
 */
export function floydWarshall(graph) {
  if (!graph || typeof graph !== "object") {
    throw new Error("Floyd-Warshall requires a graph object");
  }

  const collector = createEventCollector();
  const { emit, events } = collector;

  const nodes = Object.keys(graph);
  const size = nodes.length;

  const matrix = {};
  const next = {};
  for (const i of nodes) {
    matrix[i] = {};
    next[i] = {};
    for (const j of nodes) {
      matrix[i][j] = i === j ? 0 : Infinity;
      next[i][j] = null;
    }
  }
  const { adjacency } = normalizeGraph(graph);
  for (const [from, nbs] of Object.entries(adjacency)) {
    for (const { to, weight } of nbs) {
      if (weight < matrix[from][to]) {
        matrix[from][to] = weight;
        next[from][to] = to;
      }
    }
  }

  emit("init", {
    nodes: [...nodes],
    size,
    matrix: snapshotMatrix(matrix),
    next: snapshotMatrix(next),
  });

  let updates = 0;

  for (const k of nodes) {
    emit("k-start", { k, node: k, total: size });

    updates = 0;
    const updatedCells = [];

    for (const i of nodes) {
      for (const j of nodes) {
        const currentDist = matrix[i][j];
        const viaK = matrix[i][k] + matrix[k][j];

        if (!Number.isFinite(matrix[i][k]) || !Number.isFinite(matrix[k][j])) {
          continue;
        }

        emit("inspect-pair", {
          k,
          kNode: k,
          i,
          j,
          currentDist,
          candidate: viaK,
        });

        if (viaK < currentDist) {
          matrix[i][j] = viaK;
          next[i][j] = next[i][k];
          updates++;
          updatedCells.push([i, j]);
          emit("update-distance", {
            k,
            i,
            j,
            oldDistance: currentDist,
            newDistance: viaK,
          });
        }
      }
    }

    emit("k-complete", { k, node: k, updates });
  }

  emit("negative-cycle-check", {});

  const negativeCycleNodes = [];
  for (const node of nodes) {
    if (matrix[node][node] < 0) {
      negativeCycleNodes.push(node);
      emit("negative-cycle-detected", { node, distance: matrix[node][node] });
    }
  }
  const negativeCycle = negativeCycleNodes.length > 0;

  emit("complete", {
    size,
    negativeCycle,
    negativeCycleNodes: [...negativeCycleNodes],
  });

  return {
    nodes,
    matrix,
    next,
    events,
    negativeCycle,
    negativeCycleNodes,
  };
}

/** Reconstructs the shortest path from `from` to `to` via the next-hop
 *  matrix. Returns null for unreachable pairs (or when a negative cycle
 *  makes the path undefined). */
export function reconstructPath(next, nodes, from, to) {
  if (!next[from] || !next[to]) return null;
  if (from === to) return [from];
  if (next[from][to] == null) return null;
  const path = [from];
  let current = from;
  for (let guard = 0; guard <= nodes.length; guard++) {
    current = next[current][to];
    if (current == null) return null;
    path.push(current);
    if (current === to) return path;
  }
  return null;
}

function snapshotMatrix(matrix) {
  const copy = {};
  for (const [i, row] of Object.entries(matrix)) {
    copy[i] = { ...row };
  }
  return copy;
}
