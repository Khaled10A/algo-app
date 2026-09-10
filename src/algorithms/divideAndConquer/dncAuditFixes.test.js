import { describe, it, expect } from 'vitest';
import { strassenDebug } from './strassen';
import { closestPairOfPointsDebug } from './closestPair';
import { karatsubaDebug } from './karatsuba';
import { projectDNCEvents } from './dncSteps';
import { createDncCollector } from './dncEvents';
import { buildDNCTree, getTreeStats } from './dncTree';

/**
 * Regression tests for issues found during the D&C deep audit. Each test
 * pins the FIXED behavior so the bugs cannot silently return.
 */
describe('D&C audit fixes: call stack', () => {
  it('does not repeat identical frames while a child subproblem runs', () => {
    // Strassen 2×2: parent s-0 announces each child, then the child enters
    // with the same subproblem text. The call stack must not show the same
    // frame twice in a row.
    const snaps = projectDNCEvents(
      strassenDebug(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ),
    );

    for (const s of snaps) {
      const frames = s.callStack.slice(1);
      for (let i = 1; i < frames.length; i++) {
        expect(frames[i]).not.toBe(frames[i - 1]);
      }
    }
  });

  it('closest pair has no duplicate consecutive frames at any step', () => {
    const pts = Array.from({ length: 8 }, (_, i) => ({
      x: i * 3,
      y: (i % 4) * 7,
    }));
    const snaps = projectDNCEvents(closestPairOfPointsDebug(pts));

    for (const s of snaps) {
      const frames = s.callStack.slice(1);
      for (let i = 1; i < frames.length; i++) {
        expect(frames[i]).not.toBe(frames[i - 1]);
      }
    }
  });

  it('still shows nested frames for genuinely nested subproblems', () => {
    // Karatsuba 12345 × 6789 nests 3 levels deep (root → z0 → grandchild).
    const snaps = projectDNCEvents(karatsubaDebug('12345', '6789'));
    const deepest = Math.max(...snaps.map((s) => s.callStack.length));
    expect(deepest).toBeGreaterThan(2); // 'f()' + root + child
  });

  it('empties the stack after the top-level frame returns (null parentId)', () => {
    const events = [
      {
        type: 'enter',
        eventId: 'e-1',
        depth: 0,
        subproblem: 'root',
        action: 'enter',
        stateSnapshot: {},
        meta: null,
        nodeId: 'n-0',
        parentId: null,
      },
      {
        type: 'return',
        eventId: 'e-2',
        depth: 0,
        subproblem: 'root',
        action: 'return',
        stateSnapshot: { result: 1 },
        meta: null,
        nodeId: 'n-0',
        parentId: null,
      },
    ];
    const snaps = projectDNCEvents(events);
    expect(snaps[1].callStack).toEqual(['dnc()']);
  });
});

describe('D&C audit fixes: action text survives the collector', () => {
  it('falls back to the most descriptive payload field when action is omitted', () => {
    const collector = createDncCollector();
    collector.emit('divide', {
      depth: 0,
      subproblem: 'root',
      splitDescription: 'mid = 3',
      stateSnapshot: {},
    });
    collector.emit('recurse', {
      depth: 0,
      subproblem: 'root',
      childDescription: 'left half',
      stateSnapshot: {},
    });
    collector.emit('baseCase', {
      depth: 1,
      subproblem: 'left',
      reason: 'size <= 1',
      stateSnapshot: {},
    });
    collector.emit('combine', {
      depth: 0,
      subproblem: 'root',
      description: 'merge halves',
      stateSnapshot: {},
    });

    const [divide, recurse, baseCase, combine] = collector.events;
    expect(divide.action).toBe('mid = 3');
    expect(recurse.action).toBe('left half');
    expect(baseCase.action).toBe('size <= 1');
    expect(combine.action).toBe('merge halves');
  });

  it('keeps an explicit action untouched', () => {
    const collector = createDncCollector();
    collector.emit('divide', {
      depth: 0,
      subproblem: 'root',
      action: 'explicit',
      splitDescription: 'ignored',
      stateSnapshot: {},
    });
    expect(collector.events[0].action).toBe('explicit');
  });
});

describe('D&C audit fixes: tree node results', () => {
  it('projected tree nodes carry returned results', () => {
    const snaps = projectDNCEvents(strassenDebug([[7]], [[6]]));
    const last = snaps[snaps.length - 1];
    const root = last.dnc.treeNodes.find((n) => n.id === 's-0');
    expect(root).toBeDefined();
    expect(root.result).toEqual([[42]]);
  });

  it('buildDNCTree nodes carry returned results (return event, stateSnapshot.result)', () => {
    const events = strassenDebug([[7]], [[6]]);
    const { nodes } = buildDNCTree(events);
    const root = nodes.find((n) => n.id === 's-0');
    expect(root.result).toEqual([[42]]);
  });
});

describe('D&C audit fixes: vars and BigInt', () => {
  it('exposes BigInt state fields as readable strings', () => {
    const snaps = projectDNCEvents(karatsubaDebug('12345', '6789'));
    const combine = snaps.find((s) => s.dnc.phase === 'combine');
    expect(combine).toBeDefined();
    expect(typeof combine.vars.result).toBe('string');
    expect(combine.vars.result).toMatch(/^\d+$/);
  });
});

describe('D&C audit fixes: karatsuba sign visibility', () => {
  it('carries sign on every frame; root of a negative product is -1', () => {
    // Children recurse on ABSOLUTE values (sign +1 is correct there — the
    // root applies the final sign), so the invariant is: sign is always
    // present, and the top-level frame reflects the true product sign.
    const snaps = projectDNCEvents(karatsubaDebug('-1234', '5678'));
    for (const s of snaps) {
      expect(s.vars.sign).toBeDefined();
      expect(['-1', '1']).toContain(s.vars.sign);
    }
    for (const s of snaps.filter((x) => x.dnc.depth === 0)) {
      expect(s.vars.sign).toBe('-1');
    }
  });

  it('positive operands report sign 1 on every frame', () => {
    const snaps = projectDNCEvents(karatsubaDebug('1234', '5678'));
    for (const s of snaps) {
      expect(s.vars.sign).toBe('1');
    }
  });

  it('negative × negative reports sign 1 at the root', () => {
    const snaps = projectDNCEvents(karatsubaDebug('-1234', '-5678'));
    for (const s of snaps.filter((x) => x.dnc.depth === 0)) {
      expect(s.vars.sign).toBe('1');
    }
  });
});

describe('D&C audit fixes: matrix bounds extraction', () => {
  it('extracts bounds from the human-readable Strassen subproblem', () => {
    const snaps = projectDNCEvents(
      strassenDebug(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ),
    );
    expect(snaps[0].dnc.currentBounds).toEqual({
      kind: 'matrix',
      rows: 2,
      cols: 2,
    });
  });
});

describe('D&C audit fixes: buildDNCTree root and eventIndex', () => {
  it('reports the true root when the first node is an auto-created parent', () => {
    // The child arrives before the parent ever emits an event with its own
    // nodeId first — nodes[0] would be the parent placeholder.
    const events = [
      {
        type: 'recurse',
        eventId: 'e-1',
        depth: 1,
        subproblem: 'child',
        action: 'recurse: child',
        stateSnapshot: {},
        meta: null,
        nodeId: 'child-1',
        parentId: 'root-0',
      },
      {
        type: 'enter',
        eventId: 'e-2',
        depth: 0,
        subproblem: 'root',
        action: 'enter',
        stateSnapshot: {},
        meta: null,
        nodeId: 'root-0',
        parentId: null,
      },
    ];
    const { nodes, rootId } = buildDNCTree(events);
    expect(nodes[0].id).toBe('child-1'); // auto-created parent placeholder
    expect(rootId).toBe('root-0');
  });

  it('eventIndex reflects the event position, not the node array position', () => {
    const events = strassenDebug(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ],
    );
    const { nodes } = buildDNCTree(events);
    for (const node of nodes) {
      // eventIndex must point at the event that last touched the node...
      expect(node.eventIndex).toBeGreaterThanOrEqual(0);
      expect(node.eventIndex).toBeLessThan(events.length);
      // ...and that event must reference this node.
      const ev = events[node.eventIndex];
      expect(ev.nodeId).toBe(node.id);
    }
  });

  it('tree stats stay consistent after the fixes', () => {
    const events = strassenDebug(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ],
    );
    const { nodes } = buildDNCTree(events);
    const stats = getTreeStats(nodes);
    expect(stats.total).toBe(8); // 1 root + 7 children
    expect(stats.leafCount).toBe(7);
    expect(stats.maxDepth).toBe(1);
  });
});
