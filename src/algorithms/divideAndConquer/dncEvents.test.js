import { describe, expect, it } from 'vitest';
import {
  createDncEvent,
  createDivideEvent,
  createRecurseEvent,
  createBaseCaseEvent,
  createCompareEvent,
  createCombineEvent,
  createReturnEvent,
  createCompleteEvent,
  createEnterEvent,
  createDncCollector,
  deepClone,
  deepFreezeSnapshot,
  isPlainSnapshot,
  isImmutableSnapshot,
  makeEventId,
  DOMAIN,
  EVENT_TYPES,
  TREE_EVENT_TYPES,
  SUBPROBLEM_SHAPES,
  RECOGNIZED_SUBPROBLEM_SHAPES,
} from './dncEvents';


describe('dnc event contract: fundamentals', () => {
  it('DOMAIN is divideAndConquer', () => {
    expect(DOMAIN).toBe('divideAndConquer');
  });

  it('EVENT_TYPES includes the approved vocabulary', () => {
    expect(EVENT_TYPES).toEqual([
      'enter',
      'divide',
      'recurse',
      'baseCase',
      'compare',
      'combine',
      'return',
      'complete',
    ]);
  });

  it('TREE_EVENT_TYPES excludes compare and includes the rest', () => {
    expect(TREE_EVENT_TYPES.has('compare')).toBe(false);
    expect(TREE_EVENT_TYPES.has('enter')).toBe(true);
    expect(TREE_EVENT_TYPES.has('divide')).toBe(true);
    expect(TREE_EVENT_TYPES.has('recurse')).toBe(true);
    expect(TREE_EVENT_TYPES.has('baseCase')).toBe(true);
    expect(TREE_EVENT_TYPES.has('combine')).toBe(true);
    expect(TREE_EVENT_TYPES.has('return')).toBe(true);
    expect(TREE_EVENT_TYPES.has('complete')).toBe(true);
  });

  it('SUBPROBLEM_SHAPES exposes the supported foundation shapes', () => {
    expect(SUBPROBLEM_SHAPES).toEqual({
      NUMERIC: 'numeric',
      ARRAY_RANGE: 'array-range',
      POINT_SET: 'point-set',
      MATRIX_BLOCK: 'matrix-block',
    });
  });

  it('RECOGNIZED_SUBPROBLEM_SHAPES matches SUBPROBLEM_SHAPES values', () => {
    expect(RECOGNIZED_SUBPROBLEM_SHAPES).toEqual(
      new Set(Object.values(SUBPROBLEM_SHAPES)),
    );
  });

  it('makeEventId produces deterministic e-N identifiers', () => {
    expect(makeEventId(1)).toBe('e-1');
    expect(makeEventId(7)).toBe('e-7');
    expect(makeEventId(100)).toBe('e-100');
  });
});

describe('dnc event contract: required event fields', () => {
  const base = {
    type: 'divide',
    eventId: 'e-1',
    depth: 2,
    subproblem: 'range[0..7]',
    action: 'divide: mid = 3',
    stateSnapshot: { lo: 0, hi: 7 },
  };

  it('produces every required field', () => {
    const event = createDncEvent({ ...base, nodeId: 'n-1', parentId: 'n-0' });

    expect(event.eventId).toBe('e-1');
    expect(event.type).toBe('divide');
    expect(event.depth).toBe(2);
    expect(event.subproblem).toBe('range[0..7]');
    expect(event.action).toBe('divide: mid = 3');
    expect(event.stateSnapshot).toEqual({ lo: 0, hi: 7 });
    expect(event.nodeId).toBe('n-1');
    expect(event.parentId).toBe('n-0');
  });

  it('defaults optional tree fields to null when omitted', () => {
    const event = createDncEvent({ ...base });

    expect(event.meta).toBe(null);
    expect(event.nodeId).toBe(null);
    expect(event.parentId).toBe(null);
  });

  it('allows meta to be omitted or null', () => {
    const without = createDncEvent({ ...base });
    const explicitNull = createDncEvent({ ...base, meta: null });

    expect(without.meta).toBe(null);
    expect(explicitNull.meta).toBe(null);
  });

  it('parentId is optional and only populated where applicable', () => {
    const root = createDncEvent({ ...base, nodeId: 'n-0' });
    const child = createDncEvent({ ...base, nodeId: 'n-1', parentId: 'n-0' });

    expect(root.parentId).toBe(null);
    expect(child.parentId).toBe('n-0');
  });
});

describe('dnc event contract: event creator helpers', () => {
  const base = {
    counter: 10,
    depth: 1,
    subproblem: 'range[0..3]',
    stateSnapshot: { arr: [1, 2] },
    nodeId: 'n-2',
    parentId: 'n-1',
  };

  it('createEnterEvent', () => {
    expect(
      createEnterEvent({ ...base }).action,
    ).toBe('enter');
  });

  it('createDivideEvent action includes split description', () => {
    const event = createDivideEvent({
      ...base,
      splitDescription: 'mid = 1',
    });
    expect(event.type).toBe('divide');
    expect(event.action).toBe('divide: mid = 1');
  });

  it('createRecurseEvent action includes child description', () => {
    const event = createRecurseEvent({
      ...base,
      childDescription: 'left half',
    });
    expect(event.type).toBe('recurse');
    expect(event.action).toBe('recurse: left half');
  });

  it('createBaseCaseEvent action includes reason', () => {
    const event = createBaseCaseEvent({
      ...base,
      reason: 'size <= 1',
      result: 7,
    });
    expect(event.type).toBe('baseCase');
    expect(event.action).toBe('baseCase: size <= 1');
  });

  it('createCompareEvent action includes description', () => {
    const event = createCompareEvent({
      ...base,
      description: 'left vs right',
      a: 1,
      b: 2,
    });
    expect(event.type).toBe('compare');
    expect(event.action).toBe('compare: left vs right');
  });

  it('createCombineEvent action includes description', () => {
    const event = createCombineEvent({
      ...base,
      description: 'merge halves',
      intermediate: [1, 2, 3],
    });
    expect(event.type).toBe('combine');
    expect(event.action).toBe('combine: merge halves');
  });

  it('createReturnEvent action includes reason', () => {
    const event = createReturnEvent({
      ...base,
      reason: 'solved',
      result: 42,
    });
    expect(event.type).toBe('return');
    expect(event.action).toBe('return: solved');
  });

  it('createCompleteEvent action is "complete"', () => {
    const event = createCompleteEvent({
      ...base,
      result: 'done',
    });
    expect(event.type).toBe('complete');
    expect(event.action).toBe('complete');
  });
});

describe('dnc event contract: immutability of snapshots', () => {
  it('stateSnapshot is deep cloned at event creation time', () => {
    const state = { arr: [1, 2, 3], nested: { value: 42 } };
    const event = createDncEvent({
      type: 'divide',
      eventId: 'e-1',
      depth: 0,
      subproblem: 'test',
      action: 'divide',
      stateSnapshot: state,
    });

    state.arr.push(99);
    state.nested.value = 100;

    expect(event.stateSnapshot.arr).toEqual([1, 2, 3]);
    expect(event.stateSnapshot.nested.value).toBe(42);
  });

  it('meta is deep cloned when provided', () => {
    const meta = { items: [1, 2], nested: { x: 1 } };
    const event = createDncEvent({
      type: 'divide',
      eventId: 'e-1',
      depth: 0,
      subproblem: 'test',
      action: 'divide',
      stateSnapshot: {},
      meta,
    });

    meta.items.push(99);
    meta.nested.x = 100;

    expect(event.meta.items).toEqual([1, 2]);
    expect(event.meta.nested.x).toBe(1);
  });

  it('collector deep clones stateSnapshot on emit', () => {
    const collector = createDncCollector();
    const state = { arr: [1, 2] };

    collector.emit('divide', {
      depth: 0,
      subproblem: 'root',
      action: 'divide',
      stateSnapshot: state,
    });

    state.arr.push(99);

    expect(collector.events[0].stateSnapshot.arr).toEqual([1, 2]);
  });

  it('collector deep clones meta on emit', () => {
    const collector = createDncCollector();
    const meta = { split: 3 };

    collector.emit('divide', {
      depth: 0,
      subproblem: 'root',
      action: 'divide',
      stateSnapshot: {},
      meta,
    });

    meta.split = 999;

    expect(collector.events[0].meta.split).toBe(3);
  });

  it('events are not shared by reference after creation', () => {
    const state = { value: 1 };
    const event = createDncEvent({
      type: 'enter',
      eventId: 'e-1',
      depth: 0,
      subproblem: 'root',
      action: 'enter',
      stateSnapshot: state,
    });

    // Replacing the source reference must not alter the event.
    const _state2 = { value: 2 };
    // (state is still the same object; but the event has its own copy)
    expect(event.stateSnapshot).not.toBe(state);
  });
});

describe('dnc event contract: immutable snapshot validation', () => {
  it('isPlainSnapshot accepts plain structures and primitives', () => {
    expect(isPlainSnapshot(42)).toBe(true);
    expect(isPlainSnapshot(null)).toBe(true);
    expect(isPlainSnapshot(undefined)).toBe(true);
    expect(isPlainSnapshot(true)).toBe(true);
    expect(isPlainSnapshot({ a: 1 })).toBe(true);
    expect(isPlainSnapshot({ arr: [1, 2, 3] })).toBe(true);
    expect(isPlainSnapshot({ nested: { x: 1 } })).toBe(true);
  });

  it('isImmutableSnapshot accepts plain structures and primitives', () => {
    expect(isImmutableSnapshot(42)).toBe(true);
    expect(isImmutableSnapshot(null)).toBe(true);
    expect(isImmutableSnapshot({ a: 1 })).toBe(true);
    expect(isImmutableSnapshot({ arr: [1, 2, 3] })).toBe(true);
    expect(isImmutableSnapshot({ nested: { x: 1 } })).toBe(true);
  });

  it('isImmutableSnapshot rejects non-plain objects', () => {
    class Foo {}
    expect(isImmutableSnapshot(new Foo())).toBe(false);
    expect(isImmutableSnapshot(new Date())).toBe(false);
    expect(isImmutableSnapshot(new Map())).toBe(false);
    expect(isImmutableSnapshot(new Set())).toBe(false);
    expect(isImmutableSnapshot(/abc/)).toBe(false);
  });

  it('isImmutableSnapshot rejects class instances', () => {
    class Foo {}
    expect(isImmutableSnapshot(new Foo())).toBe(false);
  });

  it('isImmutableSnapshot rejects a broader set of built-in instances', () => {
    // These are not part of the snapshot contract even if some environments
    // may expose slightly different constructor names.
    expect(isImmutableSnapshot(new Date())).toBe(false);
    expect(isImmutableSnapshot(new Map())).toBe(false);
    expect(isImmutableSnapshot(new Set())).toBe(false);
    expect(isImmutableSnapshot(new Error())).toBe(false);
  });

  it('isImmutableSnapshot accepts Object.create(null)', () => {
    expect(isImmutableSnapshot(Object.create(null))).toBe(true);
  });

  it('isImmutableSnapshot rejects built-in instances recognized by constructor.name', () => {
    // The snapshot contract implementation rejects well-known built-in instance
    // types by constructor name.
    expect(isImmutableSnapshot(new Date())).toBe(false);
    expect(isImmutableSnapshot(new Map())).toBe(false);
    expect(isImmutableSnapshot(new Set())).toBe(false);
    expect(isImmutableSnapshot(new Error())).toBe(false);
  });

  it('isImmutableSnapshot still accepts plain objects when built-in tags are absent', () => {
    expect(isImmutableSnapshot({ a: 1 })).toBe(true);
    expect(isImmutableSnapshot(Object.create(null))).toBe(true);
  });

  it('isImmutableSnapshot rejects arrays of non-plain items', () => {
    expect(isImmutableSnapshot([new Date()])).toBe(false);
    expect(isImmutableSnapshot([new Map()])).toBe(false);
  });

  it('an emitted event passes isImmutableSnapshot on its snapshot', () => {
    const event = createDncEvent({
      type: 'divide',
      eventId: 'e-1',
      depth: 0,
      subproblem: 'test',
      action: 'divide',
      stateSnapshot: { arr: [1, 2], nested: { x: 1 } },
      meta: { split: 3 },
    });

    expect(isImmutableSnapshot(event.stateSnapshot)).toBe(true);
    expect(isImmutableSnapshot(event.meta)).toBe(true);
  });

  it('deepFreezeSnapshot returns an independent deep clone', () => {
    const original = { arr: [1, 2, 3] };
    const frozen = deepFreezeSnapshot(original);

    frozen.arr.push(99);

    expect(original.arr).toEqual([1, 2, 3]);
    expect(frozen.arr).toEqual([1, 2, 3, 99]);
  });
});

describe('dnc event contract: subproblem shapes', () => {
  it('numeric subproblems are valid', () => {
    const event = createDncEvent({
      type: 'enter',
      eventId: 'e-1',
      depth: 0,
      subproblem: 'n = 8',
      action: 'enter',
      stateSnapshot: { n: 8 },
    });

    expect(SUBPROBLEM_SHAPES.NUMERIC).toBe('numeric');
    expect(RECOGNIZED_SUBPROBLEM_SHAPES.has(SUBPROBLEM_SHAPES.NUMERIC)).toBe(true);
    expect(event.subproblem).toBe('n = 8');
  });

  it('array-range subproblems are valid', () => {
    const event = createDncEvent({
      type: 'divide',
      eventId: 'e-2',
      depth: 1,
      subproblem: 'range[0..7]',
      action: 'divide: mid = 3',
      stateSnapshot: { lo: 0, hi: 7 },
    });

    expect(SUBPROBLEM_SHAPES.ARRAY_RANGE).toBe('array-range');
    expect(RECOGNIZED_SUBPROBLEM_SHAPES.has(SUBPROBLEM_SHAPES.ARRAY_RANGE)).toBe(true);
    expect(event.subproblem).toBe('range[0..7]');
  });

  it('point-set subproblems are valid', () => {
    const event = createDncEvent({
      type: 'enter',
      eventId: 'e-3',
      depth: 0,
      subproblem: 'points:8',
      action: 'enter',
      stateSnapshot: { count: 8 },
    });

    expect(SUBPROBLEM_SHAPES.POINT_SET).toBe('point-set');
    expect(RECOGNIZED_SUBPROBLEM_SHAPES.has(SUBPROBLEM_SHAPES.POINT_SET)).toBe(true);
    expect(event.subproblem).toBe('points:8');
  });

  it('matrix-block subproblems are valid', () => {
    const event = createDncEvent({
      type: 'enter',
      eventId: 'e-4',
      depth: 0,
      subproblem: 'matrix:2x2',
      action: 'enter',
      stateSnapshot: { rows: 2, cols: 2 },
    });

    expect(SUBPROBLEM_SHAPES.MATRIX_BLOCK).toBe('matrix-block');
    expect(RECOGNIZED_SUBPROBLEM_SHAPES.has(SUBPROBLEM_SHAPES.MATRIX_BLOCK)).toBe(true);
    expect(event.subproblem).toBe('matrix:2x2');
  });

  it('unrecognized subproblems are still accepted', () => {
    const event = createDncEvent({
      type: 'enter',
      eventId: 'e-5',
      depth: 0,
      subproblem: 'custom shape',
      action: 'enter',
      stateSnapshot: {},
    });

    expect(event.subproblem).toBe('custom shape');
    expect(RECOGNIZED_SUBPROBLEM_SHAPES.has('custom shape')).toBe(false);
  });
});

describe('dnc event contract: collector', () => {
  it('emits events with auto-incrementing IDs', () => {
    const collector = createDncCollector();

    collector.emit('enter', {
      depth: 0,
      subproblem: 'root',
      action: 'enter',
      stateSnapshot: {},
    });

    collector.emit('divide', {
      depth: 0,
      subproblem: 'root',
      action: 'divide',
      stateSnapshot: {},
    });

    expect(collector.events).toHaveLength(2);
    expect(collector.events[0].eventId).toBe('e-1');
    expect(collector.events[1].eventId).toBe('e-2');
  });

  it('collector preserves optional tree fields', () => {
    const collector = createDncCollector();

    collector.emit('recurse', {
      depth: 1,
      subproblem: 'left',
      action: 'recurse: left',
      stateSnapshot: {},
      nodeId: 'n-1',
      parentId: 'n-0',
      meta: { target: 'left' },
    });

    expect(collector.events[0].nodeId).toBe('n-1');
    expect(collector.events[0].parentId).toBe('n-0');
    expect(collector.events[0].meta).toEqual({ target: 'left' });
  });

  it('collector defaults omitted payload fields', () => {
    const collector = createDncCollector();

    collector.emit('enter', {});

    const event = collector.events[0];
    expect(event.type).toBe('enter');
    expect(event.depth).toBe(0);
    expect(event.subproblem).toBe('');
    expect(event.action).toBe('enter');
    expect(event.stateSnapshot).toEqual({});
    expect(event.meta).toBe(null);
    expect(event.nodeId).toBe(null);
    expect(event.parentId).toBe(null);
  });
});

describe('dnc event contract: deepClone', () => {
  it('returns primitives unchanged', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('abc')).toBe('abc');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBeUndefined();
  });

  it('clones arrays independently', () => {
    const original = [1, 2, [3, 4]];
    const cloned = deepClone(original);

    cloned[2][0] = 99;

    expect(original[2][0]).toBe(3);
    expect(cloned[2][0]).toBe(99);
  });

  it('clones objects independently', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);

    cloned.b.c = 99;

    expect(original.b.c).toBe(2);
    expect(cloned.b.c).toBe(99);
  });

  it('clones mixed nested structures independently', () => {
    const original = {
      arr: [1, { nested: true }],
      obj: { deep: { deeper: [1, 2, 3] } },
    };

    const cloned = deepClone(original);

    cloned.arr[1].nested = false;
    cloned.obj.deep.deeper[0] = 99;

    expect(original.arr[1].nested).toBe(true);
    expect(original.obj.deep.deeper[0]).toBe(1);
    expect(cloned.arr[1].nested).toBe(false);
    expect(cloned.obj.deep.deeper[0]).toBe(99);
  });
});
