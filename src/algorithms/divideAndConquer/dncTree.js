/**
 * Divide & Conquer recursion-tree builder.
 *
 * Builds a recursion tree from a D&C event stream.
 * Each node represents a subproblem in the recursion hierarchy.
 *
 * The tree is built incrementally from events. Each node captures:
 *   - node ID
 *   - parent ID (null for root)
 *   - depth (recursion level)
 *   - subproblem (description)
 *   - action (last action on this node)
 *   - status (active | splitting | recursing | base | combining | returned | done | pending)
 *   - children (ordered list of child node IDs)
 *   - result (returned value, if any)
 *   - active state (whether this node is currently active in playback)
 *   - eventIndex (index of last event affecting this node)
 *
 * Tree nodes are plain objects — no mutable references, no classes.
 * The tree is reconstructed from the flat event stream, not stored
 * as a persistent data structure.
 *
 * Performance: O(events) time, O(nodes) space.
 */

/**
 * Build a recursion tree from a D&C event stream.
 *
 * @param {Array<object>} events — array of D&C events with nodeId/parentId fields
 * @returns {{ nodes: Array<DncTreeNode>, rootId: number | null, activeNodeId: number | null }}
 */
export function buildDNCTree(events) {
  const nodes = [];
  const nodeById = new Map();
  let activeNodeId = null;
  let rootId = null;

  for (let eventIdx = 0; eventIdx < events.length; eventIdx++) {
    const event = events[eventIdx];
    const nodeId = event.nodeId;
    const parentId = event.parentId;
    const type = event.type;

    if (nodeId == null) {
      // Events without nodeId are still tracked for completeness
      continue;
    }

    // Create or update node
    if (!nodeById.has(nodeId)) {
      const newNode = {
        id: nodeId,
        parentId: parentId ?? null,
        depth: event.depth ?? 0,
        subproblem: event.subproblem ?? '',
        action: event.action ?? type,
        status: deriveNodeStatus(type),
        children: [],
        result: null,
        active: false,
        eventIndex: eventIdx,
      };
      nodes.push(newNode);
      nodeById.set(nodeId, newNode);

      // Link to parent
      if (parentId != null && parentId !== nodeId) {
        if (!nodeById.has(parentId)) {
          const parentNode = {
            id: parentId,
            parentId: null,
            depth: (event.depth ?? 0) - 1,
            subproblem: '',
            action: '',
            status: 'pending',
            children: [],
            result: null,
            active: false,
            eventIndex: eventIdx,
          };
          nodes.push(parentNode);
          nodeById.set(parentId, parentNode);
        }
        const parent = nodeById.get(parentId);
        if (parent && !parent.children.includes(nodeId)) {
          parent.children.push(nodeId);
        }
      }
    }

    const node = nodeById.get(nodeId);
    if (node) {
      node.depth = event.depth ?? node.depth;
      node.subproblem = event.subproblem ?? node.subproblem;
      node.action = event.action ?? node.action;
      node.status = deriveNodeStatus(type);
      node.eventIndex = eventIdx;

      // Update result if present in meta or state
      if (event.meta && event.meta.result !== undefined) {
        node.result = event.meta.result;
      } else if (type === 'return' || type === 'baseCase') {
        if (event.stateSnapshot && event.stateSnapshot.result !== undefined) {
          node.result = event.stateSnapshot.result;
        }
      }

      // Mark as active for current event
      markNodeActive(nodeId, nodes, nodeById);
      activeNodeId = nodeId;
    }

    // The root is the top-level subproblem: the first node whose parentId is
    // null (not simply nodes[0], which may be an auto-created parent placeholder).
    if (rootId == null && event.parentId == null) {
      rootId = nodeId;
    }
  }

  return { nodes, rootId, activeNodeId };
}

/**
 * Mark a node as active and all its ancestors as active.
 */
function markNodeActive(nodeId, nodes, nodeById) {
  // Clear previous active state
  for (const node of nodes) {
    node.active = false;
  }

  // Mark node and ancestors as active
  let current = nodeById.get(nodeId);
  while (current != null) {
    current.active = true;
    current = nodeById.get(current.parentId);
  }
}

/**
 * Map event type to node status.
 */
function deriveNodeStatus(type) {
  switch (type) {
    case 'enter':
      return 'active';
    case 'divide':
      return 'splitting';
    case 'recurse':
      return 'recursing';
    case 'baseCase':
      return 'base';
    case 'compare':
      return 'comparing';
    case 'combine':
      return 'combining';
    case 'return':
      return 'returned';
    case 'complete':
      return 'done';
    default:
      return 'pending';
  }
}

/**
 * Get the path from root to a given node.
 *
 * @param {Array<DncTreeNode>} nodes — tree nodes
 * @param {number} nodeId — target node ID
 * @returns {Array<number>} — array of node IDs from root to target
 */
export function getPathToNode(nodes, nodeId) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const path = [];
  let current = nodeId;

  // If node doesn't exist in tree, return array with just the queried id
  // to indicate the path couldn't be resolved
  if (!nodeById.has(nodeId)) {
    return [nodeId];
  }

  while (current != null) {
    path.unshift(current);
    const node = nodeById.get(current);
    current = node ? node.parentId : null;
  }

  return path;
}

/**
 * Get all nodes at a specific depth.
 *
 * @param {Array<DncTreeNode>} nodes — tree nodes
 * @param {number} depth — target depth
 * @returns {Array<DncTreeNode>}
 */
export function getNodesAtDepth(nodes, depth) {
  return nodes.filter((n) => n.depth === depth);
}

/**
 * Get the current active path from root to active node.
 *
 * @param {Array<DncTreeNode>} nodes — tree nodes
 * @param {number | null} activeNodeId — currently active node ID
 * @returns {Array<number>}
 */
export function getActivePath(nodes, activeNodeId) {
  if (activeNodeId == null) return [];
  return getPathToNode(nodes, activeNodeId);
}

/**
 * Get summary statistics for the tree.
 *
 * @param {Array<DncTreeNode>} nodes — tree nodes
 * @returns {{ total: number, leafCount: number, maxDepth: number, nodesByStatus: Record<string, number> }}
 */
export function getTreeStats(nodes) {
  let leafCount = 0;
  let maxDepth = 0;
  const nodesByStatus = {};

  for (const node of nodes) {
    if (node.depth > maxDepth) maxDepth = node.depth;

    if (node.children.length === 0) {
      leafCount++;
    }

    const status = node.status;
    nodesByStatus[status] = (nodesByStatus[status] ?? 0) + 1;
  }

  return {
    total: nodes.length,
    leafCount,
    maxDepth,
    nodesByStatus,
  };
}

/**
 * Find a node by ID.
 *
 * @param {Array<DncTreeNode>} nodes — tree nodes
 * @param {number} nodeId — node ID to find
 * @returns {DncTreeNode | undefined}
 */
export function findNodeById(nodes, nodeId) {
  return nodes.find((n) => n.id === nodeId);
}

/**
 * Get all descendant node IDs for a given node.
 *
 * @param {Array<DncTreeNode>} nodes — tree nodes
 * @param {number} nodeId — root node ID
 * @returns {Array<number>}
 */
export function getDescendants(nodes, nodeId) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const descendants = [];
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    const node = nodeById.get(currentId);
    if (node) {
      for (const childId of node.children) {
        descendants.push(childId);
        stack.push(childId);
      }
    }
  }

  return descendants;
}
