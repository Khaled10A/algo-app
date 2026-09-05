/**
 * Recursion tree builder — constructs a tree representation from a
 * backtracking event stream.
 *
 * The tree is built incrementally from events. Each node represents a
 * recursive call or decision point. The tree captures:
 *   - node ID (sequential)
 *   - parent ID (null for root)
 *   - depth (recursion level)
 *   - decision (what was chosen at this node)
 *   - status (active | success | pruned | backtracked | pending)
 *   - children (ordered list of child node IDs)
 *   - state snapshot (for replay)
 *
 * Tree nodes are plain objects — no mutable references, no classes.
 * The tree is reconstructed from the flat event stream, not stored
 * as a persistent data structure.
 *
 * Performance: O(events) time, O(nodes) space. For educational inputs
 * (n ≤ 20), this is trivially fast.
 */

/**
 * Build a recursion tree from a backtracking event stream.
 *
 * @param {Array} events – from createEventCollector
 * @returns {{ nodes: Array<TreeNode>, rootId: number|null, activeNodeId: number|null }}
 */
export function buildBacktrackTree(events) {
  const nodes = [];
  const nodeById = new Map(); // O(1) lookups instead of O(n) scans
  let nextId = 0;
  let activeNodeId = null;
  let currentParentId = null;
  const depthStack = []; // maps depth → nodeId
  const activeNodeStack = []; // tracks deepest active node per depth for O(1) backtrack

  function addNode(node) {
    nodes.push(node);
    nodeById.set(node.id, node);
  }

  for (const event of events) {
    switch (event.type) {
      case "init": {
        // Create root node
        const id = nextId++;
        addNode({
          id,
          parentId: null,
          depth: 0,
          decision: null,
          status: "active",
          children: [],
          state: event.state != null ? deepCopy(event.state) : null,
          log: event.log || "Initialize",
        });
        currentParentId = id;
        activeNodeId = id;
        depthStack.length = 0;
        depthStack.push(id);
        activeNodeStack.length = 0;
        activeNodeStack.push(id);
        break;
      }

      case "enter": {
        const depth = event.depth ?? depthStack.length;
        const id = nextId++;
        const parent = currentParentId;

        // If entering at a new depth, parent is the previous active node
        // If re-entering same depth (backtrack + re-enter), parent is the node at depth-1
        const parentNode = parent != null ? nodeById.get(parent) : null;
        if (parentNode) {
          parentNode.children.push(id);
        }

        addNode({
          id,
          parentId: parent,
          depth,
          decision: null,
          status: "active",
          children: [],
          state: event.state != null ? deepCopy(event.state) : null,
          log: event.log || `Enter depth ${depth}`,
        });

        // Update depth stack
        while (depthStack.length < depth) depthStack.push(null);
        depthStack[depth - 1] = id;
        depthStack.length = depth;
        currentParentId = id;
        activeNodeId = id;
        activeNodeStack.length = depth - 1;
        activeNodeStack.push(id);
        break;
      }

      case "choose": {
        const depth = event.depth ?? depthStack.length;
        const id = nextId++;
        const parent = currentParentId;

        const parentNode = parent != null ? nodeById.get(parent) : null;
        if (parentNode) {
          parentNode.children.push(id);
        }

        addNode({
          id,
          parentId: parent,
          depth,
          decision: event.candidate != null ? deepCopy(event.candidate) : null,
          status: "active",
          children: [],
          state: event.state != null ? deepCopy(event.state) : null,
          log: event.log || `Choose ${event.candidate}`,
        });

        while (depthStack.length < depth) depthStack.push(null);
        depthStack[depth - 1] = id;
        depthStack.length = depth;
        currentParentId = id;
        activeNodeId = id;
        // Push to stack (replaces previous sibling at same depth)
        activeNodeStack.length = depth - 1;
        activeNodeStack.push(id);
        break;
      }

      case "constraint-check": {
        // Update the current active node's status
        if (activeNodeId != null) {
          const node = nodeById.get(activeNodeId);
          if (node) {
            node.log =
              event.log ||
              (event.valid
                ? `Check: ✓`
                : `Check: ✗ — ${event.reason || "invalid"}`);
          }
        }
        break;
      }

      case "solution": {
        // Mark the current node as a success, then move back to parent
        if (activeNodeId != null) {
          const node = nodeById.get(activeNodeId);
          if (node) {
            node.status = "success";
            node.log = event.log || "Solution found";
            // Move active to parent so siblings branch correctly
            activeNodeId = node.parentId;
            currentParentId = node.parentId;
          }
        }
        break;
      }

      case "prune": {
        // Mark the current active node as pruned, then move back to parent
        if (activeNodeId != null) {
          const node = nodeById.get(activeNodeId);
          if (node) {
            node.status = "pruned";
            node.log = event.log || `Pruned: ${event.reason || "infeasible"}`;
            // Move active to parent so siblings branch correctly
            activeNodeId = node.parentId;
            currentParentId = node.parentId;
          }
        }
        break;
      }

      case "backtrack": {
        // Mark the deepest active (non-terminal) node as backtracked — O(1) via stack
        while (activeNodeStack.length > 0) {
          const candidateId = activeNodeStack[activeNodeStack.length - 1];
          const candidate = nodeById.get(candidateId);
          if (candidate && candidate.status === "active") {
            candidate.status = "backtracked";
            candidate.log = event.log || "Backtracked";
            activeNodeStack.pop();
            break;
          }
          activeNodeStack.pop(); // skip stale entries
        }

        // Move back up
        const newDepth = event.depth ?? Math.max(0, depthStack.length - 1);
        depthStack.length = newDepth || 0;
        activeNodeStack.length = newDepth;
        currentParentId =
          newDepth > 0 ? depthStack[newDepth - 1] : depthStack[0];
        activeNodeId = currentParentId;
        break;
      }

      case "complete": {
        // Do not modify root status — only solution events mark nodes as success
        activeNodeId = null;
        break;
      }

      default:
        break;
    }
  }

  return { nodes, rootId: nodes.length > 0 ? 0 : null, activeNodeId };
}

/**
 * Get the path from root to a given node.
 *
 * @param {Array} nodes – tree nodes
 * @param {number} nodeId – target node ID
 * @returns {Array<number>} – array of node IDs from root to target
 */
export function getPathToNode(nodes, nodeId) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const path = [];
  let current = nodeId;
  while (current != null) {
    path.unshift(current);
    const node = nodeById.get(current);
    current = node ? node.parentId : null;
  }
  return path;
}

/**
 * Get all solution paths in the tree.
 *
 * @param {Array} nodes – tree nodes
 * @returns {Array<Array<number>>} – array of paths (each path is node IDs from root to solution)
 */
export function getSolutionPaths(nodes) {
  const solutionNodes = nodes.filter((n) => n.status === "success");
  return solutionNodes.map((n) => getPathToNode(nodes, n.id));
}

/**
 * Get summary statistics for the tree.
 *
 * @param {Array} nodes – tree nodes
 * @returns {{ total: number, solutions: number, pruned: number, backtracked: number, maxDepth: number }}
 */
export function getTreeStats(nodes) {
  let solutions = 0;
  let pruned = 0;
  let backtracked = 0;
  let maxDepth = 0;

  for (const node of nodes) {
    if (node.status === "success") solutions++;
    if (node.status === "pruned") pruned++;
    if (node.status === "backtracked") backtracked++;
    if (node.depth > maxDepth) maxDepth = node.depth;
  }

  return {
    total: nodes.length,
    solutions,
    pruned,
    backtracked,
    maxDepth,
  };
}

// ── Helpers ──────────────────────────────────────────────────

function deepCopy(val) {
  if (val == null) return val;
  if (Array.isArray(val)) return val.map((item) => deepCopy(item));
  if (typeof val === "object") {
    const copy = {};
    for (const [k, v] of Object.entries(val)) {
      copy[k] = deepCopy(v);
    }
    return copy;
  }
  return val;
}
