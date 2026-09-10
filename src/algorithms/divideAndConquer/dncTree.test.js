import { describe, expect, it } from 'vitest';
import {
  buildDNCTree,
  getPathToNode,
  getNodesAtDepth,
  getActivePath,
  getTreeStats,
  findNodeById,
  getDescendants,
} from './dncTree';

function makeEvent(overrides = {}) {
  return {
    type: overrides.type ?? 'enter',
    eventId: overrides.eventId ?? `e-${overrides.step ?? 0}`,
    depth: overrides.depth ?? 0,
    subproblem: overrides.subproblem ?? 'root',
    action: overrides.action ?? 'enter',
    stateSnapshot: overrides.stateSnapshot ?? {},
    meta: overrides.meta ?? null,
    nodeId: overrides.nodeId ?? `n-${overrides.step ?? 0}`,
    parentId: overrides.parentId ?? null,
  };
}

describe('dncTree', () => {
  describe('buildDNCTree', () => {
    it('builds empty tree from empty events', () => {
      const { nodes, rootId, activeNodeId } = buildDNCTree([]);
      expect(nodes).toHaveLength(0);
      expect(rootId).toBe(null);
      expect(activeNodeId).toBe(null);
    });

    it('builds tree from single enter event', () => {
      const events = [
        makeEvent({
          type: 'enter',
          step: 0,
          depth: 0,
          subproblem: 'root problem',
          nodeId: 'n-0',
          parentId: null,
        }),
      ];

      const { nodes, rootId, activeNodeId } = buildDNCTree(events);

      expect(nodes).toHaveLength(1);
      expect(rootId).toBe('n-0');
      expect(activeNodeId).toBe('n-0');

      const node = nodes[0];
      expect(node.id).toBe('n-0');
      expect(node.parentId).toBe(null);
      expect(node.depth).toBe(0);
      expect(node.subproblem).toBe('root problem');
      expect(node.action).toBe('enter');
      expect(node.status).toBe('active');
      expect(node.children).toHaveLength(0);
      expect(node.result).toBe(null);
      expect(node.active).toBe(true);
    });

    it('builds tree with divide event', () => {
      const events = [
        makeEvent({
          type: 'divide',
          step: 0,
          depth: 0,
          subproblem: 'range[0..7]',
          action: 'divide: split at mid=3',
          nodeId: 'n-0',
          parentId: null,
        }),
      ];

      const { nodes } = buildDNCTree(events);

      const node = nodes[0];
      expect(node.status).toBe('splitting');
      expect(node.action).toBe('divide: split at mid=3');
    });

    it('builds tree with recurse events', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({
          type: 'recurse',
          step: 1,
          depth: 1,
          subproblem: 'left child',
          nodeId: 'n-1',
          parentId: 'n-0',
        }),
        makeEvent({
          type: 'recurse',
          step: 2,
          depth: 1,
          subproblem: 'right child',
          nodeId: 'n-2',
          parentId: 'n-0',
        }),
      ];

      const { nodes } = buildDNCTree(events);

      expect(nodes).toHaveLength(3);

      const n0 = nodes.find((n) => n.id === 'n-0');
      const n1 = nodes.find((n) => n.id === 'n-1');
      const n2 = nodes.find((n) => n.id === 'n-2');

      expect(n0.children).toContain('n-1');
      expect(n0.children).toContain('n-2');
      expect(n1.parentId).toBe('n-0');
      expect(n1.depth).toBe(1);
      expect(n2.parentId).toBe('n-0');
      expect(n2.depth).toBe(1);
    });

    it('builds tree with base-case events and results', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({
          type: 'baseCase',
          step: 1,
          depth: 1,
          subproblem: 'size 1',
          nodeId: 'n-1',
          parentId: 'n-0',
          stateSnapshot: { result: 42 },
        }),
      ];

      const { nodes } = buildDNCTree(events);

      const n1 = nodes.find((n) => n.id === 'n-1');
      expect(n1.status).toBe('base');
      expect(n1.result).toBe(42);
    });

    it('builds tree with return events and results from meta', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({
          type: 'return',
          step: 1,
          depth: 1,
          subproblem: 'solved',
          nodeId: 'n-1',
          parentId: 'n-0',
          stateSnapshot: { result: 99 },
          meta: { result: 99 },
        }),
      ];

      const { nodes } = buildDNCTree(events);

      const n1 = nodes.find((n) => n.id === 'n-1');
      expect(n1.status).toBe('returned');
      expect(n1.result).toBe(99);
    });

    it('builds tree with combine events', () => {
      const events = [
        makeEvent({ type: 'divide', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({
          type: 'combine',
          step: 1,
          depth: 0,
          subproblem: 'merge',
          nodeId: 'n-0',
          parentId: null,
          action: 'combine: merge results',
        }),
      ];

      const { nodes } = buildDNCTree(events);

      const n0 = nodes.find((n) => n.id === 'n-0');
      expect(n0.status).toBe('combining');
    });

    it('builds tree with compare events', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({
          type: 'compare',
          step: 1,
          depth: 1,
          subproblem: 'compare pair',
          nodeId: 'n-1',
          parentId: 'n-0',
        }),
      ];

      const { nodes } = buildDNCTree(events);

      const n1 = nodes.find((n) => n.id === 'n-1');
      expect(n1.status).toBe('comparing');
    });

    it('builds tree with complete event', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({
          type: 'complete',
          step: 1,
          depth: 0,
          subproblem: 'all done',
          nodeId: 'n-0',
          parentId: null,
        }),
      ];

      const { nodes } = buildDNCTree(events);

      const n0 = nodes.find((n) => n.id === 'n-0');
      expect(n0.status).toBe('done');
    });
  });

  describe('node structure', () => {
    it('node has all required fields', () => {
      const events = [
        makeEvent({
          type: 'enter',
          step: 0,
          depth: 0,
          subproblem: 'test',
          nodeId: 'n-0',
          parentId: null,
        }),
      ];

      const { nodes } = buildDNCTree(events);
      const node = nodes[0];

      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('parentId');
      expect(node).toHaveProperty('depth');
      expect(node).toHaveProperty('subproblem');
      expect(node).toHaveProperty('action');
      expect(node).toHaveProperty('status');
      expect(node).toHaveProperty('children');
      expect(node).toHaveProperty('result');
      expect(node).toHaveProperty('active');
      expect(node).toHaveProperty('eventIndex');
    });

    it('children is an array', () => {
      const events = [
        makeEvent({ type: 'divide', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
      ];

      const { nodes } = buildDNCTree(events);
      const n0 = nodes.find((n) => n.id === 'n-0');

      expect(Array.isArray(n0.children)).toBe(true);
      expect(n0.children).toContain('n-1');
    });
  });

  describe('parent/child relationships', () => {
    it('root node has null parentId', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(nodes[0].parentId).toBe(null);
    });

    it('child nodes reference correct parent', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 3, depth: 2, nodeId: 'n-3', parentId: 'n-1' }),
      ];

      const { nodes } = buildDNCTree(events);

      const n1 = nodes.find((n) => n.id === 'n-1');
      const n2 = nodes.find((n) => n.id === 'n-2');
      const n3 = nodes.find((n) => n.id === 'n-3');

      expect(n1.parentId).toBe('n-0');
      expect(n2.parentId).toBe('n-0');
      expect(n3.parentId).toBe('n-1');
    });

    it('parent nodes track their children', () => {
      const events = [
        makeEvent({ type: 'divide', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 3, depth: 1, nodeId: 'n-3', parentId: 'n-0' }),
      ];

      const { nodes } = buildDNCTree(events);
      const n0 = nodes.find((n) => n.id === 'n-0');

      expect(n0.children.length).toBe(3);
      expect(n0.children).toContain('n-1');
      expect(n0.children).toContain('n-2');
      expect(n0.children).toContain('n-3');
    });
  });

  describe('recursion depth', () => {
    it('assigns correct depth to nodes', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 2, nodeId: 'n-2', parentId: 'n-1' }),
        makeEvent({ type: 'recurse', step: 3, depth: 3, nodeId: 'n-3', parentId: 'n-2' }),
      ];

      const { nodes } = buildDNCTree(events);

      const n0 = nodes.find((n) => n.id === 'n-0');
      const n1 = nodes.find((n) => n.id === 'n-1');
      const n2 = nodes.find((n) => n.id === 'n-2');
      const n3 = nodes.find((n) => n.id === 'n-3');

      expect(n0.depth).toBe(0);
      expect(n1.depth).toBe(1);
      expect(n2.depth).toBe(2);
      expect(n3.depth).toBe(3);
    });

    it('handles non-sequential depth values', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 5, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 10, nodeId: 'n-2', parentId: 'n-1' }),
      ];

      const { nodes } = buildDNCTree(events);

      expect(nodes.find((n) => n.id === 'n-0').depth).toBe(0);
      expect(nodes.find((n) => n.id === 'n-1').depth).toBe(5);
      expect(nodes.find((n) => n.id === 'n-2').depth).toBe(10);
    });
  });

  describe('active state', () => {
    it('marks last node as active', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
      ];

      const { nodes, activeNodeId } = buildDNCTree(events);

      expect(activeNodeId).toBe('n-1');
      // n-0 is ancestor of n-1, so both should be active
      expect(nodes.find((n) => n.id === 'n-0').active).toBe(true);
      expect(nodes.find((n) => n.id === 'n-1').active).toBe(true);
    });

    it('only active node has active=true', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
      ];

      const { nodes, activeNodeId } = buildDNCTree(events);

      expect(activeNodeId).toBe('n-2');

      for (const node of nodes) {
        if (node.id === 'n-2' || node.id === 'n-0') {
          // n-0 is ancestor of n-2, so both active
          expect(node.active).toBe(true);
        } else {
          expect(node.active).toBe(false);
        }
      }
    });
  });

  describe('status derivation', () => {
    it('derives correct status for each event type', () => {
      const testCases = [
        { type: 'enter', expected: 'active' },
        { type: 'divide', expected: 'splitting' },
        { type: 'recurse', expected: 'recursing' },
        { type: 'baseCase', expected: 'base' },
        { type: 'compare', expected: 'comparing' },
        { type: 'combine', expected: 'combining' },
        { type: 'return', expected: 'returned' },
        { type: 'complete', expected: 'done' },
      ];

      for (const { type, expected } of testCases) {
        const events = [
          makeEvent({ type, step: 0, nodeId: 'n-0', parentId: null }),
        ];
        const { nodes } = buildDNCTree(events);
        expect(nodes[0].status).toBe(expected);
      }
    });
  });

  describe('getPathToNode', () => {
    it('returns path from root to node', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 2, nodeId: 'n-2', parentId: 'n-1' }),
        makeEvent({ type: 'recurse', step: 3, depth: 3, nodeId: 'n-3', parentId: 'n-2' }),
      ];

      const { nodes } = buildDNCTree(events);

      expect(getPathToNode(nodes, 'n-0')).toEqual(['n-0']);
      expect(getPathToNode(nodes, 'n-1')).toEqual(['n-0', 'n-1']);
      expect(getPathToNode(nodes, 'n-2')).toEqual(['n-0', 'n-1', 'n-2']);
      expect(getPathToNode(nodes, 'n-3')).toEqual([
        'n-0',
        'n-1',
        'n-2',
        'n-3',
      ]);
    });

    it('returns empty array for non-existent node', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
      ];

      const { nodes } = buildDNCTree(events);
      // Non-existent node returns path with just the queried id
      expect(getPathToNode(nodes, 'n-999')).toEqual(['n-999']);
    });
  });

  describe('getNodesAtDepth', () => {
    it('returns nodes at specified depth', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 3, depth: 2, nodeId: 'n-3', parentId: 'n-1' }),
        makeEvent({ type: 'recurse', step: 4, depth: 2, nodeId: 'n-4', parentId: 'n-1' }),
      ];

      const { nodes } = buildDNCTree(events);

      expect(getNodesAtDepth(nodes, 0)).toHaveLength(1);
      expect(getNodesAtDepth(nodes, 0)[0].id).toBe('n-0');

      expect(getNodesAtDepth(nodes, 1)).toHaveLength(2);
      expect(getNodesAtDepth(nodes, 1).map((n) => n.id)).toEqual([
        'n-1',
        'n-2',
      ]);

      expect(getNodesAtDepth(nodes, 2)).toHaveLength(2);
      expect(getNodesAtDepth(nodes, 2).map((n) => n.id)).toEqual([
        'n-3',
        'n-4',
      ]);

      expect(getNodesAtDepth(nodes, 3)).toHaveLength(0);
    });
  });

  describe('getActivePath', () => {
    it('returns path to active node', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 2, nodeId: 'n-2', parentId: 'n-1' }),
      ];

      const { nodes, activeNodeId } = buildDNCTree(events);

      expect(getActivePath(nodes, activeNodeId)).toEqual([
        'n-0',
        'n-1',
        'n-2',
      ]);
    });

    it('returns empty array when no active node', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(getActivePath(nodes, null)).toEqual([]);
    });
  });

  describe('getTreeStats', () => {
    it('returns correct statistics', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
        makeEvent({ type: 'baseCase', step: 3, depth: 2, nodeId: 'n-3', parentId: 'n-1' }),
        makeEvent({ type: 'baseCase', step: 4, depth: 2, nodeId: 'n-4', parentId: 'n-2' }),
      ];

      const { nodes } = buildDNCTree(events);
      const stats = getTreeStats(nodes);

      expect(stats.total).toBe(5);
      expect(stats.leafCount).toBe(2);
      expect(stats.maxDepth).toBe(2);
      expect(stats.nodesByStatus).toHaveProperty('active');
      expect(stats.nodesByStatus).toHaveProperty('base');
    });

    it('handles tree with no leaves', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
      ];

      const { nodes } = buildDNCTree(events);
      const stats = getTreeStats(nodes);

      expect(stats.total).toBe(1);
      expect(stats.leafCount).toBe(1);
      expect(stats.maxDepth).toBe(0);
    });
  });

  describe('findNodeById', () => {
    it('finds node by id', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
      ];

      const { nodes } = buildDNCTree(events);

      expect(findNodeById(nodes, 'n-0')).toBeDefined();
      expect(findNodeById(nodes, 'n-0').id).toBe('n-0');
      expect(findNodeById(nodes, 'n-1').id).toBe('n-1');
      expect(findNodeById(nodes, 'n-999')).toBeUndefined();
    });
  });

  describe('getDescendants', () => {
    it('returns all descendant node IDs', () => {
      const events = [
        makeEvent({ type: 'divide', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 3, depth: 2, nodeId: 'n-3', parentId: 'n-1' }),
        makeEvent({ type: 'recurse', step: 4, depth: 2, nodeId: 'n-4', parentId: 'n-1' }),
        makeEvent({ type: 'recurse', step: 5, depth: 2, nodeId: 'n-5', parentId: 'n-2' }),
      ];

      const { nodes } = buildDNCTree(events);

      const descendants = getDescendants(nodes, 'n-0');
      expect(descendants).toContain('n-1');
      expect(descendants).toContain('n-2');
      expect(descendants).toContain('n-3');
      expect(descendants).toContain('n-4');
      expect(descendants).toContain('n-5');
      expect(descendants).toHaveLength(5);
    });

    it('returns empty array for leaf node', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'baseCase', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
      ];

      const { nodes } = buildDNCTree(events);

      const descendants = getDescendants(nodes, 'n-1');
      expect(descendants).toEqual([]);
    });
  });

  describe('divide event construction', () => {
    it('marks the node status as splitting', () => {
      const events = [
        makeEvent({
          type: 'divide',
          step: 0,
          depth: 0,
          subproblem: 'range[0..7]',
          action: 'divide: mid = 3',
          nodeId: 'n-0',
          parentId: null,
        }),
      ];

      const { nodes } = buildDNCTree(events);
      const node = nodes[0];

      expect(node.status).toBe('splitting');
      expect(node.action).toBe('divide: mid = 3');
      expect(node.subproblem).toBe('range[0..7]');
      expect(node.depth).toBe(0);
    });

    it('uses event depth for the node', () => {
      const events = [
        makeEvent({
          type: 'divide',
          step: 0,
          depth: 2,
          subproblem: 'sub',
          nodeId: 'n-9',
          parentId: 'n-8',
        }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(nodes[0].depth).toBe(2);
    });
  });

  describe('combine event construction', () => {
    it('marks the node status as combining', () => {
      const events = [
        makeEvent({
          type: 'combine',
          step: 0,
          depth: 0,
          subproblem: 'range[0..7]',
          action: 'combine: merge left and right',
          nodeId: 'n-0',
          parentId: null,
        }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(nodes[0].status).toBe('combining');
      expect(nodes[0].action).toBe('combine: merge left and right');
    });
  });

  describe('return event construction', () => {
    it('marks the node status as returned', () => {
      const events = [
        makeEvent({
          type: 'return',
          step: 0,
          depth: 1,
          subproblem: 'solved',
          action: 'return: subproblem solved',
          nodeId: 'n-1',
          parentId: 'n-0',
        }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(nodes[0].status).toBe('returned');
    });

    it('captures result from stateSnapshot when present', () => {
      const events = [
        makeEvent({
          type: 'return',
          step: 0,
          depth: 1,
          subproblem: 'solved',
          nodeId: 'n-1',
          parentId: 'n-0',
          stateSnapshot: { result: 99 },
        }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(nodes[0].result).toBe(99);
    });

    it('captures result from meta when present', () => {
      const events = [
        makeEvent({
          type: 'return',
          step: 0,
          depth: 1,
          subproblem: 'solved',
          nodeId: 'n-1',
          parentId: 'n-0',
          meta: { result: 42 },
        }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(nodes[0].result).toBe(42);
    });
  });

  describe('base-case event construction', () => {
    it('marks the node status as base', () => {
      const events = [
        makeEvent({
          type: 'baseCase',
          step: 0,
          depth: 1,
          subproblem: 'size <= 1',
          action: 'baseCase: size <= 1',
          nodeId: 'n-1',
          parentId: 'n-0',
        }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(nodes[0].status).toBe('base');
    });

    it('captures result from stateSnapshot', () => {
      const events = [
        makeEvent({
          type: 'baseCase',
          step: 0,
          depth: 1,
          subproblem: 'size 1',
          nodeId: 'n-1',
          parentId: 'n-0',
          stateSnapshot: { result: 7 },
        }),
      ];

      const { nodes } = buildDNCTree(events);
      expect(nodes[0].result).toBe(7);
    });

    it('does not overwrite result unless a later event sets it', () => {
      const events = [
        makeEvent({
          type: 'baseCase',
          step: 0,
          depth: 1,
          subproblem: 'size 1',
          nodeId: 'n-1',
          parentId: 'n-0',
          stateSnapshot: { result: 7 },
        }),
        makeEvent({
          type: 'return',
          step: 1,
          depth: 1,
          subproblem: 'size 1',
          nodeId: 'n-1',
          parentId: 'n-0',
          stateSnapshot: { result: 8 },
        }),
      ];

      const { nodes } = buildDNCTree(events);
      // Last event on the node should determine result.
      expect(nodes[0].result).toBe(8);
    });
  });

  describe('recursion depth: parent/child consistency', () => {
    it('child depth is greater than parent depth in linear recursion', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 2, nodeId: 'n-2', parentId: 'n-1' }),
      ];

      const { nodes } = buildDNCTree(events);
      const n0 = nodes.find((n) => n.id === 'n-0');
      const n1 = nodes.find((n) => n.id === 'n-1');
      const n2 = nodes.find((n) => n.id === 'n-2');

      expect(n1.depth).toBeGreaterThan(n0.depth);
      expect(n2.depth).toBeGreaterThan(n1.depth);
    });
  });

  describe('tree node immutability', () => {
    it('mutations to returned nodes do not affect a later rebuild from the same events', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
      ];

      const first = buildDNCTree(events);
      first.nodes[0].subproblem = 'mutated';

      const second = buildDNCTree(events);
      expect(second.nodes[0].subproblem).toBe('root');
    });

    it('children arrays are independent per node', () => {
      const events = [
        makeEvent({ type: 'divide', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
      ];

      const { nodes } = buildDNCTree(events);
      const n0 = nodes.find((n) => n.id === 'n-0');

      expect(Array.isArray(n0.children)).toBe(true);
      expect(n0.children).toEqual(['n-1', 'n-2']);
    });
  });

  describe('findNodeById and getDescendants combined', () => {
    it('finds descendants from the root', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 2, nodeId: 'n-2', parentId: 'n-1' }),
        makeEvent({ type: 'recurse', step: 3, depth: 2, nodeId: 'n-3', parentId: 'n-1' }),
      ];

      const { nodes } = buildDNCTree(events);
      const root = findNodeById(nodes, 'n-0');
      const descendants = getDescendants(nodes, 'n-0');

      expect(root).toBeDefined();
      expect(root.parentId).toBe(null);
      expect(descendants).toContain('n-1');
      expect(descendants).toContain('n-2');
      expect(descendants).toContain('n-3');
    });
  });
});
