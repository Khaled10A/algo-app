import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  GREEDY_LINE_MAP,
  projectGreedyEvents,
} from './greedySteps';
import {
  createGreedyEvent,
  isGreedyEvent,
  isGreedyEventStream,
} from './greedyEvents';

describe('GREEDY_LINE_MAP', () => {
  it('maps each event type to a line number', () => {
    expect(GREEDY_LINE_MAP.enter).toBe(0);
    expect(GREEDY_LINE_MAP.compare).toBe(1);
    expect(GREEDY_LINE_MAP.select).toBe(2);
    expect(GREEDY_LINE_MAP.accept).toBe(3);
    expect(GREEDY_LINE_MAP.reject).toBe(4);
    expect(GREEDY_LINE_MAP.update).toBe(5);
    expect(GREEDY_LINE_MAP.complete).toBe(6);
  });
});

describe('projectGreedyEvents shape', () => {
  const makeStream = () => [
    createGreedyEvent({
      type: 'enter',
      eventId: 'e-1',
      step: 1,
      subproblem: 'init',
      action: 'enter',
      stateSnapshot: { capacity: 50, items: [{ id: 0, weight: 10, value: 60 }] },
    }),
    createGreedyEvent({
      type: 'compare',
      eventId: 'e-2',
      step: 2,
      subproblem: 'compare items',
      action: 'compare: item0 ratio 6 vs item1 ratio 5',
      stateSnapshot: { capacity: 50 },
      meta: {
        comparing: { a: { id: 0, ratio: 6 }, b: { id: 1, ratio: 5 }, winner: 'a' },
      },
    }),
    createGreedyEvent({
      type: 'select',
      eventId: 'e-3',
      step: 3,
      subproblem: 'pick best',
      action: 'select: item0',
      stateSnapshot: { capacity: 50 },
      meta: { selected: { id: 0, weight: 10, value: 60 } },
    }),
    createGreedyEvent({
      type: 'accept',
      eventId: 'e-4',
      step: 4,
      subproblem: 'add to knapsack',
      action: 'accept: item0',
      stateSnapshot: { capacity: 40, profit: 60 },
      meta: { result: { accepted: [{ id: 0 }], totalValue: 60 } },
    }),
    createGreedyEvent({
      type: 'update',
      eventId: 'e-5',
      step: 5,
      subproblem: 'track capacity',
      action: 'update: remaining 50 → 40',
      stateSnapshot: { capacity: 40, remaining: 40 },
      meta: { previous: 50, next: 40 },
    }),
    createGreedyEvent({
      type: 'reject',
      eventId: 'e-6',
      step: 6,
      subproblem: 'check item1',
      action: 'reject: item1 exceeds capacity',
      stateSnapshot: { capacity: 40 },
      meta: { reason: 'insufficient remaining capacity' },
    }),
    createGreedyEvent({
      type: 'complete',
      eventId: 'e-7',
      step: 7,
      subproblem: 'done',
      action: 'complete',
      stateSnapshot: { capacity: 40, profit: 60 },
      meta: { solution: { totalValue: 60, taken: [0] } },
    }),
  ];

  it('returns an array of snapshots', () => {
    const events = makeStream();
    const steps = projectGreedyEvents(events);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBe(7);
  });

  it('each snapshot has required top-level fields', () => {
    const events = makeStream();
    const steps = projectGreedyEvents(events);
    for (const s of steps) {
      expect(typeof s.step).toBe('number');
      expect(typeof s.activeLine).toBe('number');
      expect(typeof s.log).toBe('string');
      expect(typeof s.vars).toBe('object');
      expect(typeof s.memory).toBe('string');
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(typeof s.greedy).toBe('object');
      expect(typeof s.complete).toBe('boolean');
    }
  });

  it('snapshots carry greedy.phase', () => {
    const events = makeStream();
    const steps = projectGreedyEvents(events);
    expect(steps[0].greedy.phase).toBe('enter');
    expect(steps[1].greedy.phase).toBe('compare');
    expect(steps[2].greedy.phase).toBe('select');
    expect(steps[3].greedy.phase).toBe('accept');
    expect(steps[4].greedy.phase).toBe('update');
    expect(steps[5].greedy.phase).toBe('reject');
    expect(steps[6].greedy.phase).toBe('complete');
  });

  it('snapshots advance step index', () => {
    const events = makeStream();
    const steps = projectGreedyEvents(events);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].step).toBe(i);
    }
  });

  it('activeLine follows GREEDY_LINE_MAP', () => {
    const events = makeStream();
    const steps = projectGreedyEvents(events);
    expect(steps[0].activeLine).toBe(GREEDY_LINE_MAP.enter);
    expect(steps[1].activeLine).toBe(GREEDY_LINE_MAP.compare);
    expect(steps[2].activeLine).toBe(GREEDY_LINE_MAP.select);
    expect(steps[3].activeLine).toBe(GREEDY_LINE_MAP.accept);
    expect(steps[4].activeLine).toBe(GREEDY_LINE_MAP.update);
    expect(steps[5].activeLine).toBe(GREEDY_LINE_MAP.reject);
    expect(steps[6].activeLine).toBe(GREEDY_LINE_MAP.complete);
  });

  it('log reflects action and subproblem', () => {
    const events = makeStream();
    const steps = projectGreedyEvents(events);
    expect(steps[0].log).toContain('enter');
    expect(steps[0].log).toContain('init');
    expect(steps[2].log).toContain('select');
    expect(steps[2].log).toContain('pick best');
  });

  it('complete flag only on final snapshot', () => {
    const events = makeStream();
    const steps = projectGreedyEvents(events);
    for (let i = 0; i < steps.length - 1; i++) {
      expect(steps[i].complete).toBe(false);
    }
    expect(steps[steps.length - 1].complete).toBe(true);
  });
});

describe('greedy state snapshot immutability', () => {
  const events = [
    createGreedyEvent({
      type: 'enter',
      eventId: 'e-1',
      step: 1,
      subproblem: 'x',
      action: 'enter',
      stateSnapshot: { items: [{ id: 1 }] },
    }),
    createGreedyEvent({
      type: 'accept',
      eventId: 'e-2',
      step: 2,
      subproblem: 'x',
      action: 'accept',
      stateSnapshot: { capacity: 40 },
      meta: { result: { accepted: [{ id: 1 }] } },
    }),
  ];

  it('projector does not return same object reference for different steps', () => {
    const steps = projectGreedyEvents(events);
    expect(steps[0]).not.toBe(steps[1]);
    expect(steps[0].vars).not.toBe(steps[1].vars);
    expect(steps[0].memory).not.toBe(steps[1].memory);
  });

  it('vars objects are independent across steps', () => {
    const steps = projectGreedyEvents(events);
    const v0 = steps[0].vars;
    const v1 = steps[1].vars;
    v0.custom = 'mutated';
    expect(v1.custom).toBeUndefined();
  });

  it('memory strings are independent across steps', () => {
    const steps = projectGreedyEvents(events);
    // Strings are primitives in JS, so they're naturally independent,
    // but verify we didn't store a shared reference.
    steps[0].memory = 'mutated';
    expect(steps[1].memory).not.toBe('mutated');
  });

  it('greedy sub-objects are independent across steps', () => {
    const steps = projectGreedyEvents(events);
    const g0 = steps[0].greedy;
    const g1 = steps[1].greedy;
    g0.phase = 'mutated';
    expect(g1.phase).toBe('accept');
  });

  it('accepted array accumulates across steps', () => {
    const events = [
      createGreedyEvent({
        type: 'accept',
        eventId: 'e-1',
        step: 1,
        subproblem: 'a',
        action: 'accept',
        stateSnapshot: {},
        meta: { result: { id: 1 } },
      }),
      createGreedyEvent({
        type: 'accept',
        eventId: 'e-2',
        step: 2,
        subproblem: 'b',
        action: 'accept',
        stateSnapshot: {},
        meta: { result: { id: 2 } },
      }),
    ];
    const steps = projectGreedyEvents(events);
    // After first accept, accepted should contain one entry
    expect(steps[0].greedy.accepted.length).toBe(1);
    expect(steps[0].greedy.accepted[0]).toEqual({ id: 1 });
    // After second accept, accepted should contain two entries
    expect(steps[1].greedy.accepted.length).toBe(2);
    expect(steps[1].greedy.accepted).toEqual([{ id: 1 }, { id: 2 }]);
    // Mutate the first step's accepted — should not affect second step
    steps[0].greedy.accepted.push({ id: 999 });
    expect(steps[1].greedy.accepted.length).toBe(2);
  });

  it('solution appears on complete snapshot', () => {
    const events = [
      createGreedyEvent({
        type: 'complete',
        eventId: 'e-1',
        step: 1,
        subproblem: 'done',
        action: 'complete',
        stateSnapshot: {},
        meta: { solution: { totalValue: 100, taken: [0, 1] } },
      }),
    ];
    const steps = projectGreedyEvents(events);
    expect(steps[0].greedy.solution).toEqual({ totalValue: 100, taken: [0, 1] });
  });

  it('latestResult carries forward across steps', () => {
    const events = [
      createGreedyEvent({
        type: 'select',
        eventId: 'e-1',
        step: 1,
        subproblem: 'pick',
        action: 'select',
        stateSnapshot: {},
        meta: { selected: { id: 0, value: 60 } },
      }),
      createGreedyEvent({
        type: 'accept',
        eventId: 'e-2',
        step: 2,
        subproblem: 'add',
        action: 'accept',
        stateSnapshot: {},
        meta: { result: { accepted: [{ id: 0 }] } },
      }),
      createGreedyEvent({
        type: 'enter',
        eventId: 'e-3',
        step: 3,
        subproblem: 'next',
        action: 'enter',
        stateSnapshot: {},
      }),
    ];
    const steps = projectGreedyEvents(events);
    // After select, latestResult should be the selected item
    expect(steps[0].greedy.latestResult).toEqual({ id: 0, value: 60 });
    // After accept, latestResult updates to the result
    expect(steps[1].greedy.latestResult).toEqual({ accepted: [{ id: 0 }] });
    // After enter (no new result), latestResult carries forward
    expect(steps[2].greedy.latestResult).toEqual({ accepted: [{ id: 0 }] });
  });
});

describe('projectGreedyEvents edge cases', () => {
  it('returns empty array for non-array input', () => {
    expect(projectGreedyEvents(null)).toEqual([]);
    expect(projectGreedyEvents(undefined)).toEqual([]);
    expect(projectGreedyEvents('string')).toEqual([]);
    expect(projectGreedyEvents({})).toEqual([]);
  });

  it('returns empty array for invalid event stream', () => {
    expect(projectGreedyEvents([{ notAnEvent: true }])).toEqual([]);
  });

  it('accepts empty valid stream', () => {
    expect(projectGreedyEvents([])).toEqual([]);
  });

  it('uses custom lineMap and label', () => {
    const events = [
      createGreedyEvent({
        type: 'enter',
        eventId: 'e-1',
        step: 1,
        subproblem: 'x',
        action: 'enter',
        stateSnapshot: {},
      }),
    ];
    const steps = projectGreedyEvents(events, {
      lineMap: { enter: 99 },
      label: 'custom',
    });
    expect(steps[0].activeLine).toBe(99);
    expect(steps[0].callStack[0]).toBe('custom()');
  });

  it('extracts candidates from state snapshot', () => {
    const events = [
      createGreedyEvent({
        type: 'enter',
        eventId: 'e-1',
        step: 1,
        subproblem: 'items',
        action: 'enter',
        stateSnapshot: {
          candidates: [
            { id: 0, weight: 10, value: 60 },
            { id: 1, weight: 20, value: 100 },
          ],
        },
      }),
    ];
    const steps = projectGreedyEvents(events);
    expect(steps[0].greedy.candidates.length).toBe(2);
    expect(steps[0].greedy.candidates[0]).toEqual({ id: 0, weight: 10, value: 60 });
    // Mutate original state doesn't affect snapshot
    steps[0].greedy.candidates[0].id = 999;
    expect(events[0].stateSnapshot.candidates[0].id).toBe(0);
  });

  it('handles meta.depth for greedy depth tracking', () => {
    const events = [
      createGreedyEvent({
        type: 'enter',
        eventId: 'e-1',
        step: 1,
        subproblem: 'x',
        action: 'enter',
        stateSnapshot: {},
        meta: { depth: 3 },
      }),
    ];
    const steps = projectGreedyEvents(events);
    expect(steps[0].greedy.depth).toBe(3);
  });

  it('deriveCompareInfo only on compare events', () => {
    const events = [
      createGreedyEvent({
        type: 'compare',
        eventId: 'e-1',
        step: 1,
        subproblem: 'c',
        action: 'compare: a vs b',
        stateSnapshot: {},
        meta: { comparing: { a: 1, b: 2, winner: 'a' } },
      }),
      createGreedyEvent({
        type: 'accept',
        eventId: 'e-2',
        step: 2,
        subproblem: 'a',
        action: 'accept',
        stateSnapshot: {},
      }),
    ];
    const steps = projectGreedyEvents(events);
    expect(steps[0].greedy.currentCompare).toEqual({
      description: 'compare: a vs b',
      comparing: { a: 1, b: 2, winner: 'a' },
    });
    expect(steps[1].greedy.currentCompare).toBeNull();
  });

  it('deriveSelectInfo only on select events', () => {
    const events = [
      createGreedyEvent({
        type: 'select',
        eventId: 'e-1',
        step: 1,
        subproblem: 's',
        action: 'select: item0',
        stateSnapshot: {},
        meta: { selected: { id: 0 } },
      }),
      createGreedyEvent({
        type: 'enter',
        eventId: 'e-2',
        step: 2,
        subproblem: 'e',
        action: 'enter',
        stateSnapshot: {},
      }),
    ];
    const steps = projectGreedyEvents(events);
    expect(steps[0].greedy.currentSelect).toEqual({
      description: 'select: item0',
      selected: { id: 0 },
    });
    expect(steps[1].greedy.currentSelect).toBeNull();
  });
});

describe('isGreedyEvent / isGreedyEventStream consistency', () => {
  it('valid events pass isGreedyEvent', () => {
    const ev = {
      type: 'enter',
      eventId: 'e-1',
      step: 1,
      subproblem: '',
      action: '',
      stateSnapshot: {},
    };
    expect(isGreedyEvent(ev)).toBe(true);
  });

  it('events with meta pass isGreedyEvent', () => {
    const ev = {
      type: 'select',
      eventId: 'e-1',
      step: 1,
      subproblem: '',
      action: '',
      stateSnapshot: {},
      meta: { selected: 1 },
    };
    expect(isGreedyEvent(ev)).toBe(true);
  });

  it('missing fields fail isGreedyEvent', () => {
    expect(isGreedyEvent({})).toBe(false);
    expect(isGreedyEvent({ type: 'enter' })).toBe(false);
  });

  it('stream validation', () => {
    expect(isGreedyEventStream([])).toBe(true);
    expect(isGreedyEventStream([
      { type: 'enter', eventId: 'e-1', step: 1, subproblem: '', action: '', stateSnapshot: {} },
    ])).toBe(true);
    expect(isGreedyEventStream([{}, {}])).toBe(false);
  });
});
