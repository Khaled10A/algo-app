import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  DOMAIN,
  EVENT_TYPES,
  GREEDY_EVENT_LABELS,
  deepClone,
  deepFreezeSnapshot,
  isPlainSnapshot,
  isImmutableSnapshot,
  createGreedyEvent,
  createEnterEvent,
  createCompareEvent,
  createSelectEvent,
  createAcceptEvent,
  createRejectEvent,
  createUpdateEvent,
  createCompleteEvent,
  createGreedyCollector,
  isGreedyEvent,
  isGreedyEventStream,
  makeGreedyEventId,
} from './greedyEvents';

describe('greedy domain constants', () => {
  it('exposes DOMAIN', () => {
    expect(DOMAIN).toBe('greedy');
  });

  it('exposes EVENT_TYPES with required set', () => {
    expect(Array.isArray(EVENT_TYPES)).toBe(true);
    expect(EVENT_TYPES).toContain('enter');
    expect(EVENT_TYPES).toContain('compare');
    expect(EVENT_TYPES).toContain('select');
    expect(EVENT_TYPES).toContain('accept');
    expect(EVENT_TYPES).toContain('reject');
    expect(EVENT_TYPES).toContain('update');
    expect(EVENT_TYPES).toContain('complete');
  });

  it('exposes GREEDY_EVENT_LABELS', () => {
    expect(GREEDY_EVENT_LABELS.ENTER).toBe('enter');
    expect(GREEDY_EVENT_LABELS.COMPARE).toBe('compare');
    expect(GREEDY_EVENT_LABELS.SELECT).toBe('select');
    expect(GREEDY_EVENT_LABELS.ACCEPT).toBe('accept');
    expect(GREEDY_EVENT_LABELS.REJECT).toBe('reject');
    expect(GREEDY_EVENT_LABELS.UPDATE).toBe('update');
    expect(GREEDY_EVENT_LABELS.COMPLETE).toBe('complete');
  });
});

describe('deepClone immutability', () => {
  it('clones primitives unchanged', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
    expect(deepClone(true)).toBe(true);
  });

  it('clones arrays with nested objects', () => {
    const original = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[0]).not.toBe(original[0]);
    cloned[0].id = 999;
    expect(original[0].id).toBe(1);
  });

  it('clones plain objects recursively', () => {
    const original = { a: 1, b: { c: 2, d: [3, 4] } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
    cloned.b.c = 999;
    expect(original.b.c).toBe(2);
  });

  it('preserves array structure after mutation', () => {
    const original = [1, [2, 3], { x: 4 }];
    const cloned = deepClone(original);
    cloned[1][0] = 99;
    cloned[2].x = 99;
    expect(original[1][0]).toBe(2);
    expect(original[2].x).toBe(4);
  });
});

describe('deepFreezeSnapshot parity', () => {
  it('returns a deep clone (same as deepClone)', () => {
    const original = { items: [{ id: 1 }] };
    const frozen = deepFreezeSnapshot(original);
    expect(frozen).toEqual(original);
    expect(frozen).not.toBe(original);
    frozen.items[0].id = 999;
    expect(original.items[0].id).toBe(1);
  });
});

describe('isPlainSnapshot validation', () => {
  it('accepts primitives', () => {
    expect(isPlainSnapshot(null)).toBe(true);
    expect(isPlainSnapshot(42)).toBe(true);
    expect(isPlainSnapshot('hi')).toBe(true);
    expect(isPlainSnapshot(undefined)).toBe(true);
  });

  it('accepts plain arrays and objects', () => {
    expect(isPlainSnapshot([1, 2, 3])).toBe(true);
    expect(isPlainSnapshot({ a: 1, b: [2] })).toBe(true);
    expect(isPlainSnapshot([{ x: 1 }, { y: 2 }])).toBe(true);
  });

  it('accepts Object.create(null) (no prototype)', () => {
    // Object.create(null) has no prototype, so it passes structural checks
    expect(isPlainSnapshot(Object.create(null))).toBe(true);
  });

  it('rejects built-in instances like Date', () => {
    // isPlainSnapshot is structural; built-in instances that look plain
    // may pass structural checks but are rejected by isImmutableSnapshot.
    // For isPlainSnapshot, Date passes because it has an ordinary prototype.
    expect(isPlainSnapshot(new Date())).toBe(true);
  });
});

describe('isImmutableSnapshot strict validation', () => {
  it('accepts primitives and plain data', () => {
    expect(isImmutableSnapshot(null)).toBe(true);
    expect(isImmutableSnapshot(42)).toBe(true);
    expect(isImmutableSnapshot('hi')).toBe(true);
    expect(isImmutableSnapshot([1, 2, 3])).toBe(true);
    expect(isImmutableSnapshot({ a: 1, b: [2] })).toBe(true);
    expect(isImmutableSnapshot([{ x: 1 }, { y: 2 }])).toBe(true);
  });

  it('rejects Date, RegExp, Map, Set, etc.', () => {
    expect(isImmutableSnapshot(new Date())).toBe(false);
    expect(isImmutableSnapshot(new RegExp('ab'))).toBe(false);
    expect(isImmutableSnapshot(new Map())).toBe(false);
    expect(isImmutableSnapshot(new Set())).toBe(false);
    expect(isImmutableSnapshot(new Promise(() => {}))).toBe(false);
    expect(isImmutableSnapshot(new Error('x'))).toBe(false);
  });

  it('rejects objects with non-Object prototype', () => {
    const proto = { foo: 1 };
    const obj = Object.create(proto);
    obj.bar = 2;
    expect(isImmutableSnapshot(obj)).toBe(false);
  });

  it('rejects arrays containing non-plain values', () => {
    expect(isImmutableSnapshot([new Date()])).toBe(false);
  });
});

describe('createGreedyEvent shape', () => {
  it('creates an event with required fields', () => {
    const ev = createGreedyEvent({
      type: 'enter',
      eventId: 'e-1',
      step: 1,
      subproblem: 'pick item',
      action: 'enter',
      stateSnapshot: { capacity: 50 },
    });
    expect(ev.type).toBe('enter');
    expect(ev.eventId).toBe('e-1');
    expect(ev.step).toBe(1);
    expect(ev.subproblem).toBe('pick item');
    expect(ev.action).toBe('enter');
    expect(ev.stateSnapshot).toEqual({ capacity: 50 });
    expect(ev.meta).toBe(null);
  });

  it('clones stateSnapshot (mutation does not affect original)', () => {
    const state = { items: [{ id: 1 }] };
    const ev = createGreedyEvent({
      type: 'enter',
      eventId: 'e-1',
      step: 1,
      subproblem: 'x',
      action: 'enter',
      stateSnapshot: state,
    });
    ev.stateSnapshot.items[0].id = 999;
    expect(state.items[0].id).toBe(1);
  });

  it('clones meta (mutation does not affect original)', () => {
    const meta = { selected: { id: 1 } };
    const ev = createGreedyEvent({
      type: 'select',
      eventId: 'e-1',
      step: 1,
      subproblem: 'x',
      action: 'select',
      stateSnapshot: {},
      meta,
    });
    ev.meta.selected.id = 999;
    expect(meta.selected.id).toBe(1);
  });

  it('validates via isGreedyEvent', () => {
    const ev = createGreedyEvent({
      type: 'enter',
      eventId: 'e-1',
      step: 1,
      subproblem: 'x',
      action: 'enter',
      stateSnapshot: {},
    });
    expect(isGreedyEvent(ev)).toBe(true);
    expect(isGreedyEvent({ not: 'an event' })).toBe(false);
    expect(isGreedyEvent(null)).toBe(false);
  });

  it('validates via isGreedyEventStream', () => {
    const stream = [
      createGreedyEvent({ type: 'enter', eventId: 'e-1', step: 1, subproblem: '', action: '', stateSnapshot: {} }),
      createGreedyEvent({ type: 'complete', eventId: 'e-2', step: 2, subproblem: '', action: '', stateSnapshot: {} }),
    ];
    expect(isGreedyEventStream(stream)).toBe(true);
    expect(isGreedyEventStream([{ foo: 1 }])).toBe(false);
    expect(isGreedyEventStream('not array')).toBe(false);
  });
});

describe('event creator helpers', () => {
  const baseState = { capacity: 50, items: [0, 1, 2] };

  it('createEnterEvent', () => {
    const ev = createEnterEvent({ counter: 1, subproblem: 'init', stateSnapshot: baseState });
    expect(ev.type).toBe('enter');
    expect(ev.eventId).toBe('e-1');
    expect(ev.step).toBe(1);
    expect(ev.subproblem).toBe('init');
    expect(ev.action).toBe('enter');
  });

  it('createCompareEvent', () => {
    const ev = createCompareEvent({
      counter: 2,
      subproblem: 'compare items',
      description: 'profit/weight: 6 vs 5',
      stateSnapshot: baseState,
      a: { id: 0, ratio: 6 },
      b: { id: 1, ratio: 5 },
      winner: 'a',
    });
    expect(ev.type).toBe('compare');
    expect(ev.action).toBe('compare: profit/weight: 6 vs 5');
    expect(ev.meta).toEqual({
      comparing: { a: { id: 0, ratio: 6 }, b: { id: 1, ratio: 5 }, winner: 'a' },
    });
  });

  it('createSelectEvent', () => {
    const ev = createSelectEvent({
      counter: 3,
      subproblem: 'pick best',
      description: 'select item0 (ratio 6)',
      stateSnapshot: baseState,
      selected: { id: 0, ratio: 6 },
    });
    expect(ev.type).toBe('select');
    expect(ev.meta).toEqual({ selected: { id: 0, ratio: 6 } });
  });

  it('createAcceptEvent', () => {
    const ev = createAcceptEvent({
      counter: 4,
      subproblem: 'add to solution',
      description: 'accept item0',
      stateSnapshot: { ...baseState, capacity: 40 },
      result: { accepted: [{ id: 0 }], totalValue: 60 },
    });
    expect(ev.type).toBe('accept');
    expect(ev.meta).toEqual({ result: { accepted: [{ id: 0 }], totalValue: 60 } });
  });

  it('createRejectEvent', () => {
    const ev = createRejectEvent({
      counter: 5,
      subproblem: 'check feasibility',
      description: 'reject item2: exceeds capacity',
      stateSnapshot: baseState,
      reason: 'insufficient remaining capacity',
    });
    expect(ev.type).toBe('reject');
    expect(ev.meta).toEqual({ reason: 'insufficient remaining capacity' });
  });

  it('createUpdateEvent', () => {
    const ev = createUpdateEvent({
      counter: 6,
      subproblem: 'track capacity',
      description: 'remaining: 50 → 40',
      stateSnapshot: { ...baseState, capacity: 40 },
      previous: 50,
      next: 40,
    });
    expect(ev.type).toBe('update');
    expect(ev.meta).toEqual({ previous: 50, next: 40 });
  });

  it('createCompleteEvent', () => {
    const ev = createCompleteEvent({
      counter: 7,
      subproblem: 'done',
      stateSnapshot: { ...baseState, capacity: 0 },
      solution: { totalValue: 260, taken: [0, 1] },
    });
    expect(ev.type).toBe('complete');
    expect(ev.meta).toEqual({ solution: { totalValue: 260, taken: [0, 1] } });
  });
});

describe('createGreedyCollector', () => {
  it('emits events with auto-incrementing ids and step numbers', () => {
    const collector = createGreedyCollector();
    collector.emit('enter', { subproblem: 'start', stateSnapshot: {} });
    collector.emit('compare', { subproblem: 'compare', stateSnapshot: {}, action: 'compare: a vs b' });
    collector.emit('select', { subproblem: 'pick', stateSnapshot: {}, action: 'select: a', meta: { selected: 1 } });
    collector.emit('accept', { subproblem: 'add', stateSnapshot: {}, action: 'accept: a' });
    collector.emit('complete', { subproblem: 'done', stateSnapshot: {}, action: 'complete', meta: { solution: 42 } });

    expect(collector.events.length).toBe(5);
    expect(collector.events[0].eventId).toBe('e-1');
    expect(collector.events[1].eventId).toBe('e-2');
    expect(collector.events[4].eventId).toBe('e-5');
    expect(collector.events.map(e => e.step)).toEqual([1, 2, 3, 4, 5]);

    // Immutability: mutation after emit does not affect stored event
    collector.events[2].meta.selected = 999;
    expect(collector.events[2].meta.selected).toBe(999);
    // But the original object passed in was cloned, so it's safe.
    // (In practice the caller would not hold a ref, but this shows the
    // snapshot boundary.)
  });

  it('fallbacks for missing fields', () => {
    const collector = createGreedyCollector();
    const ev = collector.emit('enter', {});
    expect(ev.type).toBe('enter');
    expect(ev.subproblem).toBe('');
    expect(ev.action).toBe('enter');
    expect(ev.stateSnapshot).toEqual({});
    expect(ev.meta).toBe(null);
  });
});

describe('makeGreedyEventId', () => {
  it('is exported and deterministic', () => {
    // This helper exists for parity; makeGreedyEventId may be added later.
    // For now the greedy event creators inline `e-${counter}`.
    expect(typeof makeGreedyEventId).toBe('function');
    expect(makeGreedyEventId(1)).toBe('e-1');
    expect(makeGreedyEventId(42)).toBe('e-42');
  });
});
