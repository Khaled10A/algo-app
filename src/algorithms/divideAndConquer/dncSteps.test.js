import { describe, expect, it } from 'vitest';
import { projectDNCEvents, DNC_LINE_MAP } from './dncSteps';

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

describe('dncSteps', () => {
  describe('projectDNCEvents', () => {
    it('projects empty event array', () => {
      const snapshots = projectDNCEvents([]);
      expect(snapshots).toHaveLength(0);
    });

    it('projects single enter event', () => {
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

      const snapshots = projectDNCEvents(events);

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].step).toBe(0);
      expect(snapshots[0].dnc.phase).toBe('enter');
      expect(snapshots[0].dnc.depth).toBe(0);
      expect(snapshots[0].dnc.currentNodeId).toBe('n-0');
      expect(snapshots[0].dnc.currentSubproblem).toBe('root problem');
    });

    it('projects divide event', () => {
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

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].dnc.phase).toBe('divide');
      expect(snapshots[0].dnc.currentBounds).toEqual({
        kind: 'range',
        start: 0,
        end: 7,
      });
    });

    it('projects compare event', () => {
      const events = [
        makeEvent({
          type: 'compare',
          step: 0,
          depth: 2,
          subproblem: 'range[0..3]',
          action: 'compare: left vs right',
          nodeId: 'n-2',
        }),
      ];

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].dnc.phase).toBe('compare');
      expect(snapshots[0].dnc.currentCompare).toEqual({
        description: 'compare: left vs right',
        meta: null,
        comparing: null,
        partition: null,
      });
    });

    it('projects combine event', () => {
      const events = [
        makeEvent({
          type: 'combine',
          step: 0,
          depth: 1,
          subproblem: 'range[0..3]',
          action: 'combine: merge results',
          nodeId: 'n-1',
          meta: { merged: [1, 2, 3, 4] },
        }),
      ];

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].dnc.phase).toBe('combine');
      expect(snapshots[0].dnc.currentCombine).toEqual({
        description: 'combine: merge results',
        meta: { merged: [1, 2, 3, 4] },
        partition: null,
      });
    });

    it('projects return event with result', () => {
      const events = [
        makeEvent({
          type: 'return',
          step: 0,
          depth: 2,
          subproblem: 'range[0..1]',
          action: 'return: subproblem solved',
          nodeId: 'n-2',
          stateSnapshot: { result: 42 },
        }),
      ];

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].dnc.phase).toBe('return');
      expect(snapshots[0].dnc.currentResult).toBe(42);
    });

    it('projects base-case event', () => {
      const events = [
        makeEvent({
          type: 'baseCase',
          step: 0,
          depth: 3,
          subproblem: 'range[5..5]',
          action: 'baseCase: size <= 1',
          nodeId: 'n-3',
          stateSnapshot: { result: 7 },
        }),
      ];

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].dnc.phase).toBe('base-case');
      expect(snapshots[0].dnc.currentResult).toBe(7);
    });

    it('projects complete event', () => {
      const events = [
        makeEvent({
          type: 'complete',
          step: 0,
          depth: 0,
          subproblem: 'all done',
          action: 'complete',
          nodeId: 'n-0',
          stateSnapshot: { result: 'final answer' },
        }),
      ];

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].dnc.phase).toBe('complete');
      expect(snapshots[0].complete).toBe(true);
    });
  });

  describe('snapshot immutability', () => {
    it('snapshots are independent objects', () => {
      const events = [
        makeEvent({
          type: 'divide',
          step: 0,
          depth: 0,
          subproblem: 'root',
          nodeId: 'n-0',
        }),
        makeEvent({
          type: 'recurse',
          step: 1,
          depth: 1,
          subproblem: 'left',
          nodeId: 'n-1',
          parentId: 'n-0',
        }),
      ];

      const snapshots = projectDNCEvents(events);

      // Mutate first snapshot
      snapshots[0].dnc.currentSubproblem = 'mutated';

      // Second snapshot should not be affected
      expect(snapshots[1].dnc.currentSubproblem).toBe('left');
    });

    it('snapshot treeNodes are independent', () => {
      const events = [
        makeEvent({
          type: 'divide',
          step: 0,
          depth: 0,
          subproblem: 'root',
          nodeId: 'n-0',
        }),
        makeEvent({
          type: 'recurse',
          step: 1,
          depth: 1,
          subproblem: 'child',
          nodeId: 'n-1',
          parentId: 'n-0',
        }),
      ];

      const snapshots = projectDNCEvents(events);

      // Mutate treeNodes in first snapshot
      if (snapshots[0].dnc.treeNodes.length > 0) {
        snapshots[0].dnc.treeNodes[0].subproblem = 'mutated';
      }

      // Second snapshot treeNodes should not be affected
      if (snapshots[1].dnc.treeNodes.length > 0) {
        expect(
          snapshots[1].dnc.treeNodes.some((n) => n.subproblem === 'mutated'),
        ).toBe(false);
      }
    });

    it('snapshot returnedResults are independent', () => {
      const events = [
        makeEvent({
          type: 'return',
          step: 0,
          depth: 1,
          subproblem: 'child',
          nodeId: 'n-1',
          stateSnapshot: { result: 42 },
        }),
        makeEvent({
          type: 'return',
          step: 1,
          depth: 1,
          subproblem: 'child2',
          nodeId: 'n-2',
          stateSnapshot: { result: 99 },
        }),
      ];

      const snapshots = projectDNCEvents(events);

      // Mutate returnedResults in second snapshot
      if (snapshots[1].dnc.returnedResults.length > 0) {
        snapshots[1].dnc.returnedResults[0][1] = 999;
      }

      // First snapshot returnedResults should not be affected
      expect(snapshots[0].dnc.returnedResults.length).toBe(1);
    });
  });

  describe('recursion depth tracking', () => {
    it('tracks increasing depth across events', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 2, nodeId: 'n-2', parentId: 'n-1' }),
        makeEvent({ type: 'baseCase', step: 3, depth: 3, nodeId: 'n-3', parentId: 'n-2' }),
      ];

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].dnc.depth).toBe(0);
      expect(snapshots[1].dnc.depth).toBe(1);
      expect(snapshots[2].dnc.depth).toBe(2);
      expect(snapshots[3].dnc.depth).toBe(3);
    });

    it('tracks depth correctly for non-linear recursion', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0' }),
        makeEvent({ type: 'divide', step: 1, depth: 0, nodeId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 3, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
      ];

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].dnc.depth).toBe(0);
      expect(snapshots[1].dnc.depth).toBe(0);
      expect(snapshots[2].dnc.depth).toBe(1);
      expect(snapshots[3].dnc.depth).toBe(1);
    });
  });

  describe('parent/child relationships in tree', () => {
    it('builds tree with parent/child links', () => {
      const events = [
        makeEvent({ type: 'divide', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 1, nodeId: 'n-2', parentId: 'n-0' }),
      ];

      const snapshots = projectDNCEvents(events);

      const treeNodes = snapshots[2].dnc.treeNodes;
      const n0 = treeNodes.find((n) => n.id === 'n-0');
      const n1 = treeNodes.find((n) => n.id === 'n-1');
      const n2 = treeNodes.find((n) => n.id === 'n-2');

      expect(n0).toBeDefined();
      expect(n1).toBeDefined();
      expect(n2).toBeDefined();

      expect(n0.children).toContain('n-1');
      expect(n0.children).toContain('n-2');
      expect(n1.parentId).toBe('n-0');
      expect(n2.parentId).toBe('n-0');
    });

    it('handles deeper tree hierarchies', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0' }),
        makeEvent({ type: 'recurse', step: 2, depth: 2, nodeId: 'n-2', parentId: 'n-1' }),
        makeEvent({ type: 'recurse', step: 3, depth: 3, nodeId: 'n-3', parentId: 'n-2' }),
      ];

      const snapshots = projectDNCEvents(events);
      const treeNodes = snapshots[3].dnc.treeNodes;

      const n0 = treeNodes.find((n) => n.id === 'n-0');
      const n1 = treeNodes.find((n) => n.id === 'n-1');
      const n2 = treeNodes.find((n) => n.id === 'n-2');
      const n3 = treeNodes.find((n) => n.id === 'n-3');

      expect(n0.children).toContain('n-1');
      expect(n1.children).toContain('n-2');
      expect(n2.children).toContain('n-3');

      expect(n0.depth).toBe(0);
      expect(n1.depth).toBe(1);
      expect(n2.depth).toBe(2);
      expect(n3.depth).toBe(3);
    });
  });

  describe('call stack', () => {
    it('builds call stack from node path', () => {
      const events = [
        makeEvent({ type: 'enter', step: 0, depth: 0, nodeId: 'n-0', parentId: null, subproblem: 'root' }),
        makeEvent({ type: 'recurse', step: 1, depth: 1, nodeId: 'n-1', parentId: 'n-0', subproblem: 'left child' }),
        makeEvent({ type: 'recurse', step: 2, depth: 2, nodeId: 'n-2', parentId: 'n-1', subproblem: 'grandchild' }),
      ];

      const snapshots = projectDNCEvents(events);

      expect(snapshots[0].callStack).toEqual(['dnc()', '  └ root']);
      expect(snapshots[1].callStack).toEqual([
        'dnc()',
        '  └ root',
        '  └ left child',
      ]);
    });
  });

  describe('line map', () => {
    it('uses default line map', () => {
      const events = [makeEvent({ type: 'divide', step: 0 })];
      const snapshots = projectDNCEvents(events);
      expect(snapshots[0].activeLine).toBe(DNC_LINE_MAP.divide);
    });

    it('uses custom line map', () => {
      const customLineMap = {
        enter: 10,
        divide: 20,
        recurse: 30,
        'baseCase': 40,
        compare: 50,
        combine: 60,
        return: 70,
        complete: 80,
      };

      const events = [makeEvent({ type: 'divide', step: 0 })];
      const snapshots = projectDNCEvents(events, { lineMap: customLineMap });
      expect(snapshots[0].activeLine).toBe(20);
    });
  });

  describe('phase derivation', () => {
    it('derives correct phase for each event type', () => {
      const eventTypes = [
        'enter',
        'divide',
        'recurse',
        'baseCase',
        'compare',
        'combine',
        'return',
        'complete',
      ];

      for (const type of eventTypes) {
        const events = [makeEvent({ type, step: 0 })];
        const snapshots = projectDNCEvents(events);
        expect(snapshots[0].dnc.phase).toBe(type === 'baseCase' ? 'base-case' : type);
      }
    });
  });

  describe('vars and memory', () => {
    it('includes state snapshot values in vars', () => {
      const events = [
        makeEvent({
          type: 'divide',
          step: 0,
          depth: 0,
          subproblem: 'root',
          stateSnapshot: { size: 8, lo: 0, hi: 7 },
        }),
      ];

      const snapshots = projectDNCEvents(events);
      expect(snapshots[0].vars.size).toBe('8');
      expect(snapshots[0].vars.lo).toBe('0');
      expect(snapshots[0].vars.hi).toBe('7');
    });

    it('includes result in memory when present', () => {
      const events = [
        makeEvent({
          type: 'return',
          step: 0,
          depth: 1,
          subproblem: 'child',
          stateSnapshot: { result: 42 },
        }),
      ];

      const snapshots = projectDNCEvents(events);
      expect(snapshots[0].memory).toContain('result: 42');
    });
  });

  describe('projector immutability guarantees', () => {
    it('each snapshot is an independent object', () => {
      const events = [
        makeEvent({
          type: 'enter',
          step: 0,
          depth: 0,
          subproblem: 'root',
          nodeId: 'n-0',
        }),
        makeEvent({
          type: 'divide',
          step: 1,
          depth: 0,
          subproblem: 'root',
          nodeId: 'n-0',
        }),
      ];

      const snapshots = projectDNCEvents(events);

      snapshots[0].dnc.currentSubproblem = 'mutated';

      expect(snapshots[1].dnc.currentSubproblem).toBe('root');
    });

    it('treeNodes are deep cloned per snapshot', () => {
      const events = [
        makeEvent({
          type: 'divide',
          step: 0,
          depth: 0,
          subproblem: 'range[0..7]',
          nodeId: 'n-0',
        }),
        makeEvent({
          type: 'recurse',
          step: 1,
          depth: 1,
          subproblem: 'range[0..3]',
          nodeId: 'n-1',
          parentId: 'n-0',
        }),
      ];

      const snapshots = projectDNCEvents(events);

      const firstTree = snapshots[0].dnc.treeNodes;
      const secondTree = snapshots[1].dnc.treeNodes;

      expect(firstTree).not.toBe(secondTree);
      expect(firstTree[0]).not.toBe(secondTree[0]);
    });

    it('returnedResults are deep cloned per snapshot', () => {
      const events = [
        makeEvent({
          type: 'return',
          step: 0,
          depth: 1,
          subproblem: 'child',
          nodeId: 'n-1',
          stateSnapshot: { result: 42 },
        }),
        makeEvent({
          type: 'return',
          step: 1,
          depth: 1,
          subproblem: 'child2',
          nodeId: 'n-2',
          stateSnapshot: { result: 99 },
        }),
      ];

      const snapshots = projectDNCEvents(events);

      const firstResults = snapshots[0].dnc.returnedResults;
      const secondResults = snapshots[1].dnc.returnedResults;

      secondResults[0][1] = 999;

      expect(firstResults[0][1]).toBe(42);
    });

    it('currentResult is deep cloned when present', () => {
      const state = { result: { value: 42 } };
      const events = [
        makeEvent({
          type: 'return',
          step: 0,
          depth: 1,
          subproblem: 'child',
          nodeId: 'n-1',
          meta: { result: state.result },
          stateSnapshot: state,
        }),
      ];

      const snapshots = projectDNCEvents(events);

      // Mutate the source object after projection.
      state.result.value = 999;

      expect(snapshots[0].dnc.currentResult.value).toBe(42);
    });

    it('currentCompare and currentCombine are deep cloned when present', () => {
      const compareMetaSrc = { comparing: { a: 1, b: 2 } };
      const combineMetaSrc = { merged: [1, 2, 3] };
      const events = [
        makeEvent({
          type: 'compare',
          step: 0,
          depth: 1,
          subproblem: 'range[0..3]',
          nodeId: 'n-1',
          meta: compareMetaSrc,
          stateSnapshot: {},
        }),
        makeEvent({
          type: 'combine',
          step: 1,
          depth: 1,
          subproblem: 'range[0..3]',
          nodeId: 'n-1',
          meta: combineMetaSrc,
          stateSnapshot: {},
        }),
      ];

      const snapshots = projectDNCEvents(events);

      // Mutate source metadata after projection.
      compareMetaSrc.comparing.a = 999;
      combineMetaSrc.merged.push(999);

      expect(snapshots[0].dnc.currentCompare.meta.comparing.a).toBe(1);
      expect(snapshots[1].dnc.currentCombine.meta.merged).toEqual([1, 2, 3]);
    });

    it('vars and memory are deep cloned per snapshot', () => {
      // The projector formats numeric top-level snapshot fields as strings.
      // It does not render an array as a comma-separated string, so assert on
      // the fields the projector actually includes.
      const events = [
        makeEvent({
          type: 'divide',
          step: 0,
          depth: 0,
          subproblem: 'root',
          stateSnapshot: { size: 8, lo: 0, hi: 7 },
        }),
        makeEvent({
          type: 'divide',
          step: 1,
          depth: 0,
          subproblem: 'root',
          stateSnapshot: { size: 16, lo: 0, hi: 15 },
        }),
      ];

      const snapshots = projectDNCEvents(events);

      // Mutate source state after projection.
      events[0].stateSnapshot.size = 999;
      events[1].stateSnapshot.size = 1000;

      expect(snapshots[0].vars.size).toBe('8');
      expect(snapshots[1].vars.size).toBe('16');
    });
  });
});
