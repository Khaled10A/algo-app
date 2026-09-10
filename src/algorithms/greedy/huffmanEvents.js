/**
 * Huffman coding debug event contract.
 *
 * Deterministic, serializable events emitted by the Huffman algorithm and
 * projected into debugger snapshots by huffmanSteps.js. Algorithm code never
 * touches React or UI state directly.
 *
 * Huffman-specific event vocabulary:
 *   frequency-count  – character frequencies calculated
 *   queue-insert     – node inserted into priority queue
 *   select-min       – two minimum-frequency nodes selected from queue
 *   merge            – two nodes merged into parent
 *   queue-update     – queue state updated after merge
 *   tree-update      – tree structure updated
 *   assign-code      – Huffman code assigned to leaf
 *   encode           – text encoded with Huffman codes
 *   complete         – algorithm finished
 *
 * Each event carries an immutable stateSnapshot that is enough to reproduce
 * the visualization at that point.
 */

/** @type {string} */
export const DOMAIN = 'greedy';

/** @type {string[]} */
export const EVENT_TYPES = [
  'frequency-count',
  'queue-insert',
  'select-min',
  'merge',
  'queue-update',
  'tree-update',
  'assign-code',
  'encode',
  'complete',
];

// ---------------------------------------------------------------------------
// Deep-clone / immutability helpers (mirror D&C and Greedy contracts)
// ---------------------------------------------------------------------------

/** @template T */
export function deepClone(value) {
  if (value == null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }
  const out = {};
  for (const key of Object.keys(value)) {
    out[key] = deepClone(value[key]);
  }
  return out;
}

/** @template T */
export function deepFreezeSnapshot(value) {
  return deepClone(value);
}

/** @param {unknown} value */
export function isPlainSnapshot(value) {
  if (value == null || typeof value !== 'object') return true;
  if (Array.isArray(value)) {
    return value.every((item) => isPlainSnapshot(item));
  }
  for (const key of Object.keys(value)) {
    const v = value[key];
    if (v != null && typeof v === 'object' && !isPlainSnapshot(v)) return false;
  }
  return true;
}

/** @param {unknown} value */
export function isImmutableSnapshot(value) {
  if (!isPlainSnapshot(value)) return false;
  if (value == null || typeof value !== 'object') return true;
  if (Array.isArray(value)) {
    return value.every((item) => isImmutableSnapshot(item));
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true; // Object.create(null)
  if (proto !== Object.prototype) {
    return false;
  }
  for (const key of Object.keys(value)) {
    const v = value[key];
    if (!isImmutableSnapshot(v)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Event creation
// ---------------------------------------------------------------------------

/**
 * Create a Huffman debug event payload.
 *
 * @param {object} opts
 * @param {string} opts.type                 – one of EVENT_TYPES
 * @param {string} opts.eventId
 * @param {number} opts.step                 – monotonic step index (1-based)
 * @param {string} opts.subproblem           – short description of current focus
 * @param {string} opts.action               – human-readable action label
 * @param {object} opts.stateSnapshot        – immutable snapshot of algorithm state
 * @param {object | null | undefined} [opts.meta]
 * @returns {{ type: string; eventId: string; step: number; subproblem: string; action: string; stateSnapshot: object; meta: object | null }}
 */
export function createHuffmanEvent(opts) {
  const {
    type,
    eventId,
    step,
    subproblem,
    action,
    stateSnapshot,
    meta = null,
  } = opts;

  return {
    type,
    eventId,
    step,
    subproblem,
    action,
    stateSnapshot: deepClone(stateSnapshot),
    meta: meta == null ? null : deepClone(meta),
  };
}

/** @param {object} opts */
export function createFrequencyCountEvent({
  counter,
  frequencies,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'frequency-count',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'character frequencies',
    action: `frequency-count: ${frequencies.length} unique characters`,
    stateSnapshot,
    meta: { frequencies },
  });
}

/** @param {object} opts */
export function createQueueInsertEvent({
  counter,
  nodeId,
  char,
  freq,
  queueState,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'queue-insert',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'priority queue',
    action: `queue-insert: node ${nodeId} (${char || 'internal'}, freq ${freq})`,
    stateSnapshot,
    meta: { nodeId, char, freq, queueState },
  });
}

/** @param {object} opts */
export function createSelectMinEvent({
  counter,
  leftNodeId,
  rightNodeId,
  leftFreq,
  rightFreq,
  queueState,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'select-min',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'select minimum-frequency nodes',
    action: `select-min: node ${leftNodeId} (freq ${leftFreq}) and node ${rightNodeId} (freq ${rightFreq})`,
    stateSnapshot,
    meta: { leftNodeId, rightNodeId, leftFreq, rightFreq, queueState },
  });
}

/** @param {object} opts */
export function createMergeEvent({
  counter,
  leftNodeId,
  rightNodeId,
  parentNodeId,
  mergedFreq,
  queueState,
  treeState,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'merge',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'merge nodes',
    action: `merge: node ${leftNodeId} + node ${rightNodeId} → node ${parentNodeId} (freq ${mergedFreq})`,
    stateSnapshot,
    meta: { leftNodeId, rightNodeId, parentNodeId, mergedFreq, queueState, treeState },
  });
}

/** @param {object} opts */
export function createQueueUpdateEvent({
  counter,
  description,
  queueState,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'queue-update',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'priority queue update',
    action: `queue-update: ${description}`,
    stateSnapshot,
    meta: { queueState },
  });
}

/** @param {object} opts */
export function createTreeUpdateEvent({
  counter,
  nodeId,
  description,
  treeState,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'tree-update',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'tree structure',
    action: `tree-update: ${description}`,
    stateSnapshot,
    meta: { nodeId, treeState },
  });
}

/** @param {object} opts */
export function createAssignCodeEvent({
  counter,
  char,
  code,
  nodeId,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'assign-code',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'code assignment',
    action: `assign-code: ${char} → ${code}`,
    stateSnapshot,
    meta: { char, code, nodeId },
  });
}

/** @param {object} opts */
export function createEncodeEvent({
  counter,
  encoded,
  originalLength,
  encodedLength,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'encode',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'encoding',
    action: `encode: ${originalLength} chars → ${encodedLength} bits`,
    stateSnapshot,
    meta: { encoded, originalLength, encodedLength },
  });
}

/** @param {object} opts */
export function createCompleteEvent({
  counter,
  solution,
  stateSnapshot,
}) {
  return createHuffmanEvent({
    type: 'complete',
    eventId: `h-${counter}`,
    step: counter,
    subproblem: 'complete',
    action: 'complete: Huffman coding finished',
    stateSnapshot,
    meta: { solution },
  });
}

// ---------------------------------------------------------------------------
// Collector wrapper
// ---------------------------------------------------------------------------

/**
 * Collector wrapper that adds Huffman event bookkeeping.
 *
 * @returns {{ events: object[]; emit: (type: string, payload: object) => void; nextId: () => number }}
 */
export function createHuffmanCollector() {
  const events = [];
  let counter = 1;

  return {
    events,
    nextId() {
      return counter++;
    },
    emit(type, payload) {
      const eventId = `h-${counter}`;
      counter += 1;

      const event = createHuffmanEvent({
        type,
        eventId,
        step: counter - 1,
        subproblem: payload.subproblem ?? '',
        action:
          payload.action ??
          payload.description ??
          type,
        stateSnapshot: payload.stateSnapshot ?? {},
        meta: payload.meta ?? null,
      });

      events.push(event);
      return event;
    },
  };
}

// ---------------------------------------------------------------------------
// Type guards / helpers
// ---------------------------------------------------------------------------

/** @param {unknown} value */
export function isHuffmanEvent(value) {
  if (typeof value !== 'object' || value == null) return false;
  const v = value;
  return (
    typeof v.type === 'string' &&
    typeof v.eventId === 'string' &&
    typeof v.step === 'number' &&
    typeof v.subproblem === 'string' &&
    typeof v.action === 'string' &&
    typeof v.stateSnapshot === 'object' &&
    (v.meta == null || typeof v.meta === 'object')
  );
}

/** @param {unknown} value */
export function isHuffmanEventStream(value) {
  if (!Array.isArray(value)) return false;
  return value.every(isHuffmanEvent);
}

/** @param {number} counter */
export function makeHuffmanEventId(counter) {
  return `h-${counter}`;
}
