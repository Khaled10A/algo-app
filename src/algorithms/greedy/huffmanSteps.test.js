import { describe, expect, it } from 'vitest';
import { HUFFMAN_LINE_MAP } from './huffmanSteps';
import {
  createHuffmanEvent,
  createFrequencyCountEvent,
  createQueueInsertEvent,
  createSelectMinEvent,
  createMergeEvent,
  createAssignCodeEvent,
  createEncodeEvent,
  createCompleteEvent,
  createHuffmanCollector,
  isHuffmanEvent,
  isHuffmanEventStream,
  isImmutableSnapshot,
} from './huffmanEvents';
import { projectHuffmanEvents as projectHuffman } from './huffmanSteps';

describe('HUFFMAN_LINE_MAP', () => {
  it('maps each event type to a line number', () => {
    expect(HUFFMAN_LINE_MAP['frequency-count']).toBe(0);
    expect(HUFFMAN_LINE_MAP['queue-insert']).toBe(1);
    expect(HUFFMAN_LINE_MAP['select-min']).toBe(2);
    expect(HUFFMAN_LINE_MAP['merge']).toBe(3);
    expect(HUFFMAN_LINE_MAP['queue-update']).toBe(4);
    expect(HUFFMAN_LINE_MAP['tree-update']).toBe(5);
    expect(HUFFMAN_LINE_MAP['assign-code']).toBe(6);
    expect(HUFFMAN_LINE_MAP['encode']).toBe(7);
    expect(HUFFMAN_LINE_MAP['complete']).toBe(8);
  });
});

describe('projectHuffmanEvents shape', () => {
  const makeStream = () => [
    createFrequencyCountEvent({
      counter: 1,
      frequencies: [
        { char: 'a', freq: 5 },
        { char: 'b', freq: 9 },
      ],
      stateSnapshot: {
        inputText: 'aabb',
        totalFrequency: 4,
        uniqueChars: 2,
      },
    }),
    createQueueInsertEvent({
      counter: 2,
      nodeId: 1,
      char: 'a',
      freq: 5,
      queueState: [{ freq: 5, nodeId: 1, order: 0 }],
      stateSnapshot: {
        queueState: [{ freq: 5, nodeId: 1, order: 0 }],
      },
    }),
    createSelectMinEvent({
      counter: 3,
      leftNodeId: 1,
      rightNodeId: 2,
      leftFreq: 5,
      rightFreq: 9,
      queueState: [],
      stateSnapshot: {
        queueState: [],
      },
    }),
    createMergeEvent({
      counter: 4,
      leftNodeId: 1,
      rightNodeId: 2,
      parentNodeId: 3,
      mergedFreq: 14,
      queueState: [{ freq: 14, nodeId: 3, order: 0 }],
      treeState: [
        { id: 1, char: 'a', freq: 5, isLeaf: true },
        { id: 2, char: 'b', freq: 9, isLeaf: true },
        { id: 3, char: null, freq: 14, isLeaf: false },
      ],
      stateSnapshot: {
        treeState: [
          { id: 1, char: 'a', freq: 5, isLeaf: true },
          { id: 2, char: 'b', freq: 9, isLeaf: true },
          { id: 3, char: null, freq: 14, isLeaf: false },
        ],
      },
    }),
    createAssignCodeEvent({
      counter: 5,
      char: 'a',
      code: '0',
      nodeId: 1,
      stateSnapshot: {
        generatedCodes: [{ char: 'a', code: '0' }],
      },
    }),
    createCompleteEvent({
      counter: 6,
      solution: {
        rootId: 3,
        codes: [
          { char: 'a', code: '0', freq: 5 },
          { char: 'b', code: '1', freq: 9 },
        ],
        encoded: '0011',
        originalLength: 4,
        encodedLength: 4,
      },
      stateSnapshot: {
        solution: {
          rootId: 3,
          codes: [
            { char: 'a', code: '0', freq: 5 },
            { char: 'b', code: '1', freq: 9 },
          ],
        },
      },
    }),
  ];

  it('returns an array of snapshots', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBe(6);
  });

  it('each snapshot has required top-level fields', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
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
    const steps = projectHuffman(events);
    expect(steps[0].greedy.phase).toBe('frequency');
    expect(steps[1].greedy.phase).toBe('queue');
    expect(steps[2].greedy.phase).toBe('select');
    expect(steps[3].greedy.phase).toBe('merge');
    expect(steps[4].greedy.phase).toBe('code');
    expect(steps[5].greedy.phase).toBe('complete');
  });

  it('snapshots advance step index', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].step).toBe(i);
    }
  });

  it('activeLine follows HUFFMAN_LINE_MAP', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    expect(steps[0].activeLine).toBe(HUFFMAN_LINE_MAP['frequency-count']);
    expect(steps[1].activeLine).toBe(HUFFMAN_LINE_MAP['queue-insert']);
    expect(steps[2].activeLine).toBe(HUFFMAN_LINE_MAP['select-min']);
    expect(steps[3].activeLine).toBe(HUFFMAN_LINE_MAP['merge']);
    expect(steps[4].activeLine).toBe(HUFFMAN_LINE_MAP['assign-code']);
    expect(steps[5].activeLine).toBe(HUFFMAN_LINE_MAP['complete']);
  });

  it('log reflects action and subproblem', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    expect(steps[0].log).toContain('frequency-count');
    expect(steps[0].log).toContain('character frequencies');
    expect(steps[3].log).toContain('merge');
    expect(steps[3].log).toContain('merge nodes');
  });

  it('complete flag only on final snapshot', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    for (let i = 0; i < steps.length - 1; i++) {
      expect(steps[i].complete).toBe(false);
    }
    expect(steps[steps.length - 1].complete).toBe(true);
  });

  it('greedy contains frequencyTable', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    expect(steps[0].greedy.frequencyTable).toHaveLength(2);
    expect(steps[0].greedy.frequencyTable[0]).toEqual({ char: 'a', freq: 5 });
  });

  it('greedy contains queueState', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    expect(steps[1].greedy.queueState).toHaveLength(1);
    expect(steps[1].greedy.queueState[0].freq).toBe(5);
  });

  it('greedy contains generatedCodes', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    expect(steps[4].greedy.generatedCodes).toHaveLength(1);
    expect(steps[4].greedy.generatedCodes[0].code).toBe('0');
  });

  it('greedy contains solution on complete', () => {
    const events = makeStream();
    const steps = projectHuffman(events);
    expect(steps[5].greedy.solution).toBeDefined();
    expect(steps[5].greedy.solution.rootId).toBe(3);
  });
});

describe('Huffman state snapshot immutability', () => {
  const events = [
    createFrequencyCountEvent({
      counter: 1,
      frequencies: [{ char: 'a', freq: 5 }],
      stateSnapshot: { inputText: 'aaa' },
    }),
    createQueueInsertEvent({
      counter: 2,
      nodeId: 1,
      char: 'a',
      freq: 5,
      queueState: [{ freq: 5, nodeId: 1 }],
      stateSnapshot: {},
    }),
    createCompleteEvent({
      counter: 3,
      solution: { rootId: 1, codes: [{ char: 'a', code: '0' }] },
      stateSnapshot: {},
    }),
  ];

  it('projector does not return same object reference for different steps', () => {
    const steps = projectHuffman(events);
    expect(steps[0]).not.toBe(steps[1]);
    expect(steps[0].vars).not.toBe(steps[1].vars);
    expect(steps[0].memory).not.toBe(steps[1].memory);
  });

  it('vars objects are independent across steps', () => {
    const steps = projectHuffman(events);
    const v0 = steps[0].vars;
    const v1 = steps[1].vars;
    v0.custom = 'mutated';
    expect(v1.custom).toBeUndefined();
  });

  it('memory strings are independent across steps', () => {
    const steps = projectHuffman(events);
    steps[0].memory = 'mutated';
    expect(steps[1].memory).not.toBe('mutated');
  });

  it('greedy sub-objects are independent across steps', () => {
    const steps = projectHuffman(events);
    const g0 = steps[0].greedy;
    const g1 = steps[1].greedy;
    g0.phase = 'mutated';
    expect(g1.phase).toBe('queue');
  });

  it('frequencyTable accumulates correctly', () => {
    const events = [
      createFrequencyCountEvent({
        counter: 1,
        frequencies: [{ char: 'a', freq: 5 }, { char: 'b', freq: 9 }],
        stateSnapshot: {},
      }),
      createQueueInsertEvent({
        counter: 2,
        nodeId: 1,
        char: 'a',
        freq: 5,
        queueState: [{ freq: 5, nodeId: 1 }],
        stateSnapshot: {},
      }),
    ];
    const steps = projectHuffman(events);
    expect(steps[0].greedy.frequencyTable).toHaveLength(2);
    expect(steps[1].greedy.frequencyTable).toHaveLength(2);
  });
});

describe('createHuffmanEvent shape', () => {
  it('creates an event with required fields', () => {
    const ev = createHuffmanEvent({
      type: 'frequency-count',
      eventId: 'h-1',
      step: 1,
      subproblem: 'count chars',
      action: 'frequency-count: 2 chars',
      stateSnapshot: { input: 'ab' },
    });
    expect(ev.type).toBe('frequency-count');
    expect(ev.eventId).toBe('h-1');
    expect(ev.step).toBe(1);
    expect(ev.subproblem).toBe('count chars');
    expect(ev.action).toBe('frequency-count: 2 chars');
    expect(ev.stateSnapshot).toEqual({ input: 'ab' });
    expect(ev.meta).toBe(null);
  });

  it('clones stateSnapshot (mutation does not affect original)', () => {
    const state = { frequencies: [{ char: 'a', freq: 5 }] };
    const ev = createHuffmanEvent({
      type: 'frequency-count',
      eventId: 'h-1',
      step: 1,
      subproblem: 'x',
      action: 'x',
      stateSnapshot: state,
    });
    ev.stateSnapshot.frequencies[0].freq = 999;
    expect(state.frequencies[0].freq).toBe(5);
  });

  it('clones meta (mutation does not affect original)', () => {
    const meta = { frequencies: [{ char: 'a', freq: 5 }] };
    const ev = createHuffmanEvent({
      type: 'frequency-count',
      eventId: 'h-1',
      step: 1,
      subproblem: 'x',
      action: 'x',
      stateSnapshot: {},
      meta,
    });
    ev.meta.frequencies[0].freq = 999;
    expect(meta.frequencies[0].freq).toBe(5);
  });

  it('validates via isHuffmanEvent', () => {
    const ev = createHuffmanEvent({
      type: 'frequency-count',
      eventId: 'h-1',
      step: 1,
      subproblem: 'x',
      action: 'x',
      stateSnapshot: {},
    });
    expect(isHuffmanEvent(ev)).toBe(true);
    expect(isHuffmanEvent({ not: 'an event' })).toBe(false);
    expect(isHuffmanEvent(null)).toBe(false);
  });

  it('validates via isHuffmanEventStream', () => {
    const stream = [
      createHuffmanEvent({ type: 'frequency-count', eventId: 'h-1', step: 1, subproblem: '', action: '', stateSnapshot: {} }),
      createHuffmanEvent({ type: 'complete', eventId: 'h-2', step: 2, subproblem: '', action: '', stateSnapshot: {} }),
    ];
    expect(isHuffmanEventStream(stream)).toBe(true);
    expect(isHuffmanEventStream([{ foo: 1 }])).toBe(false);
    expect(isHuffmanEventStream('not array')).toBe(false);
  });
});

describe('event creator helpers', () => {
  const baseState = { inputText: 'ab', totalFrequency: 2 };

  it('createFrequencyCountEvent', () => {
    const ev = createFrequencyCountEvent({
      counter: 1,
      frequencies: [{ char: 'a', freq: 5 }],
      stateSnapshot: baseState,
    });
    expect(ev.type).toBe('frequency-count');
    expect(ev.action).toContain('frequency-count');
    expect(ev.meta).toEqual({ frequencies: [{ char: 'a', freq: 5 }] });
  });

  it('createQueueInsertEvent', () => {
    const ev = createQueueInsertEvent({
      counter: 2,
      nodeId: 1,
      char: 'a',
      freq: 5,
      queueState: [{ freq: 5, nodeId: 1 }],
      stateSnapshot: baseState,
    });
    expect(ev.type).toBe('queue-insert');
    expect(ev.action).toContain('queue-insert');
    expect(ev.meta.nodeId).toBe(1);
    expect(ev.meta.char).toBe('a');
  });

  it('createSelectMinEvent', () => {
    const ev = createSelectMinEvent({
      counter: 3,
      leftNodeId: 1,
      rightNodeId: 2,
      leftFreq: 5,
      rightFreq: 9,
      queueState: [],
      stateSnapshot: baseState,
    });
    expect(ev.type).toBe('select-min');
    expect(ev.action).toContain('select-min');
    expect(ev.meta.leftNodeId).toBe(1);
    expect(ev.meta.rightNodeId).toBe(2);
  });

  it('createMergeEvent', () => {
    const ev = createMergeEvent({
      counter: 4,
      leftNodeId: 1,
      rightNodeId: 2,
      parentNodeId: 3,
      mergedFreq: 14,
      queueState: [{ freq: 14, nodeId: 3 }],
      treeState: [{ id: 3, freq: 14 }],
      stateSnapshot: baseState,
    });
    expect(ev.type).toBe('merge');
    expect(ev.action).toContain('merge');
    expect(ev.meta.parentNodeId).toBe(3);
    expect(ev.meta.mergedFreq).toBe(14);
  });

  it('createAssignCodeEvent', () => {
    const ev = createAssignCodeEvent({
      counter: 5,
      char: 'a',
      code: '0',
      nodeId: 1,
      stateSnapshot: baseState,
    });
    expect(ev.type).toBe('assign-code');
    expect(ev.action).toContain('a');
    expect(ev.meta.code).toBe('0');
  });

  it('createEncodeEvent', () => {
    const ev = createEncodeEvent({
      counter: 6,
      encoded: '0011',
      originalLength: 4,
      encodedLength: 4,
      stateSnapshot: baseState,
    });
    expect(ev.type).toBe('encode');
    expect(ev.action).toContain('encode');
    expect(ev.meta.encoded).toBe('0011');
  });

  it('createCompleteEvent', () => {
    const ev = createCompleteEvent({
      counter: 7,
      solution: { rootId: 1, codes: [] },
      stateSnapshot: baseState,
    });
    expect(ev.type).toBe('complete');
    expect(ev.action).toBe('complete: Huffman coding finished');
    expect(ev.meta.solution).toEqual({ rootId: 1, codes: [] });
  });
});

describe('createHuffmanCollector', () => {
  it('emits events with auto-incrementing ids and step numbers', () => {
    const collector = createHuffmanCollector();
    collector.emit('frequency-count', { subproblem: 'start', stateSnapshot: {}, action: 'frequency-count: start' });
    collector.emit('queue-insert', { subproblem: 'insert', stateSnapshot: {}, action: 'queue-insert: a' });
    collector.emit('complete', { subproblem: 'done', stateSnapshot: {}, action: 'complete', meta: { solution: {} } });

    expect(collector.events.length).toBe(3);
    expect(collector.events[0].eventId).toBe('h-1');
    expect(collector.events[1].eventId).toBe('h-2');
    expect(collector.events[2].eventId).toBe('h-3');
    expect(collector.events.map(e => e.step)).toEqual([1, 2, 3]);
  });

  it('fallbacks for missing fields', () => {
    const collector = createHuffmanCollector();
    const ev = collector.emit('frequency-count', {});
    expect(ev.type).toBe('frequency-count');
    expect(ev.subproblem).toBe('');
    expect(ev.action).toBe('frequency-count');
    expect(ev.stateSnapshot).toEqual({});
    expect(ev.meta).toBe(null);
  });
});

describe('isImmutableSnapshot with Huffman events', () => {
  it('accepts plain Huffman event snapshots', () => {
    const ev = createHuffmanEvent({
      type: 'frequency-count',
      eventId: 'h-1',
      step: 1,
      subproblem: 'x',
      action: 'x',
      stateSnapshot: { frequencies: [{ char: 'a', freq: 5 }] },
      meta: { test: 'value' },
    });
    expect(isImmutableSnapshot(ev.stateSnapshot)).toBe(true);
    expect(isImmutableSnapshot(ev.meta)).toBe(true);
  });

  it('rejects non-plain values in snapshot', () => {
    // Date in snapshot should be rejected
    const badState = { date: new Date() };
    expect(isImmutableSnapshot(badState)).toBe(false);
  });
});

describe('Huffman event stream edge cases', () => {
  it('empty stream returns empty snapshots', () => {
    const steps = projectHuffman([]);
    expect(steps).toHaveLength(0);
  });

  it('invalid stream returns empty snapshots', () => {
    const steps = projectHuffman([{ notAnEvent: true }]);
    expect(steps).toHaveLength(0);
  });

  it('non-array returns empty snapshots', () => {
    const steps = projectHuffman('not array');
    expect(steps).toHaveLength(0);
  });

  it('single complete event', () => {
    const events = [
      createCompleteEvent({
        counter: 1,
        solution: { rootId: 1 },
        stateSnapshot: {},
      }),
    ];
    const steps = projectHuffman(events);
    expect(steps).toHaveLength(1);
    expect(steps[0].complete).toBe(true);
    expect(steps[0].greedy.phase).toBe('complete');
  });
});
