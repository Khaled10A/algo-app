/** @type {string} */
export const DOMAIN = 'greedy';

/**
 * Greedy algorithm event vocabulary.
 *
 * Not every algorithm must emit every type. Algorithms emit the subset that
 * describes their decision process:
 *   enter        – arrive at a decision point / subproblem
 *   compare      – compare two candidates (e.g. by profit/weight ratio,
 *                  finish time, frequency)
 *   select       – pick the best candidate according to the greedy criterion
 *   accept       – add the selected candidate to the solution
 *   reject       – discard the candidate (infeasible, already used, etc.)
 *   update       – mutate auxiliary state (remaining capacity, current profit,
 *                  last finish time, …)
 *   complete     – algorithm finished, solution available
 *
 * Each event carries an immutable stateSnapshot that is enough to reproduce
 * the visualization at that point. The projector (greedySteps.js) turns the
 * event stream into debugger snapshots compatible with the existing debugger
 * tabs.
 */

/** @type {string[]} */
export const EVENT_TYPES = [
  'enter',
  'compare',
  'select',
  'accept',
  'reject',
  'update',
  'complete',
];

/** @type {{ SELECT: string; ACCEPT: string; REJECT: string; UPDATE: string; COMPLETE: string; ENTER: string; COMPARE: string }} */
export const GREEDY_EVENT_LABELS = {
  ENTER: 'enter',
  COMPARE: 'compare',
  SELECT: 'select',
  ACCEPT: 'accept',
  REJECT: 'reject',
  UPDATE: 'update',
  COMPLETE: 'complete',
};

// ---------------------------------------------------------------------------
// Deep-clone / immutability helpers (mirror D&C contract so greedy snapshots
// are equally safe to project and replay).
// ---------------------------------------------------------------------------

/**
 * Deep clone a plain data structure for storage.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
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

/**
 * Deep clone for snapshot safety. Provided for parity with the D&C contract;
 * greedy emitters should pass clones here if they hold the only reference to
 * a mutable structure.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreezeSnapshot(value) {
  return deepClone(value);
}

/**
 * Validate that a snapshot value is plain, serializable data.
 *
 * @param {unknown} value
 * @returns {value is object}
 */
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

// Built-in instance types that should never be treated as plain snapshot
// values, even when they serialize as plain objects.
function isBuiltinInstance(value) {
  const ctorName =
    value?.constructor?.name ? String(value.constructor.name) : '';
  return (
    ctorName === 'Date' ||
    ctorName === 'RegExp' ||
    ctorName === 'Map' ||
    ctorName === 'Set' ||
    ctorName === 'WeakMap' ||
    ctorName === 'WeakSet' ||
    ctorName === 'Promise' ||
    ctorName === 'ArrayBuffer' ||
    ctorName === 'SharedArrayBuffer' ||
    ctorName === 'DataView' ||
    ctorName === 'Int8Array' ||
    ctorName === 'Uint8Array' ||
    ctorName === 'Uint8ClampedArray' ||
    ctorName === 'Int16Array' ||
    ctorName === 'Uint16Array' ||
    ctorName === 'Int32Array' ||
    ctorName === 'Uint32Array' ||
    ctorName === 'Float32Array' ||
    ctorName === 'Float64Array' ||
    ctorName === 'BigInt64Array' ||
    ctorName === 'BigUint64Array' ||
    ctorName === 'Generator' ||
    ctorName === 'AsyncGenerator' ||
    ctorName === 'AsyncFunction' ||
    ctorName === 'GeneratorFunction' ||
    ctorName === 'Error' ||
    ctorName === 'EvalError' ||
    ctorName === 'RangeError' ||
    ctorName === 'ReferenceError' ||
    ctorName === 'SyntaxError' ||
    ctorName === 'TypeError' ||
    ctorName === 'URIError'
  );
}

/**
 * Strictly validate that a snapshot is plain, serializable, and does not
 * contain Date/RegExp/Map/Set/function/class instances or circular references.
 *
 * @param {unknown} value
 * @returns {value is object}
 */
export function isImmutableSnapshot(value) {
  if (!isPlainSnapshot(value)) return false;
  if (value == null || typeof value !== 'object') return true;
  if (Array.isArray(value)) {
    return value.every((item) => isImmutableSnapshot(item));
  }
  if (isBuiltinInstance(value)) return false;
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
 * Create a greedy event payload.
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
export function createGreedyEvent(opts) {
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

/**
 * Create an `enter` event.
 *
 * @param {object} opts
 * @param {number} opts.counter
 * @param {string} opts.subproblem
 * @param {object} opts.stateSnapshot
 * @returns {ReturnType<typeof createGreedyEvent>}
 */
export function createEnterEvent({ counter, subproblem, stateSnapshot }) {
  return createGreedyEvent({
    type: 'enter',
    eventId: `e-${counter}`,
    step: counter,
    subproblem,
    action: 'enter',
    stateSnapshot,
  });
}

/**
 * Create a `compare` event.
 *
 * @param {object} opts
 * @param {number} opts.counter
 * @param {string} opts.subproblem
 * @param {string} opts.description           – e.g. "profit/weight: item0 (6) vs item1 (5)"
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.a]
 * @param {*} [opts.b]
 * @param {string} [opts.winner]              – which candidate won the comparison, if decided
 * @returns {ReturnType<typeof createGreedyEvent>}
 */
export function createCompareEvent({
  counter,
  subproblem,
  description,
  stateSnapshot,
  a,
  b,
  winner,
}) {
  return createGreedyEvent({
    type: 'compare',
    eventId: `e-${counter}`,
    step: counter,
    subproblem,
    action: `compare: ${description}`,
    stateSnapshot,
    meta: {
      comparing: winner == null ? { a, b } : { a, b, winner },
    },
  });
}

/**
 * Create a `select` event.
 *
 * @param {object} opts
 * @param {number} opts.counter
 * @param {string} opts.subproblem
 * @param {string} opts.description           – e.g. "select item2 (profit 10, weight 3)"
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.selected]                 – the selected candidate
 * @returns {ReturnType<typeof createGreedyEvent>}
 */
export function createSelectEvent({
  counter,
  subproblem,
  description,
  stateSnapshot,
  selected,
}) {
  return createGreedyEvent({
    type: 'select',
    eventId: `e-${counter}`,
    step: counter,
    subproblem,
    action: `select: ${description}`,
    stateSnapshot,
    meta: selected != null ? { selected } : null,
  });
}

/**
 * Create an `accept` event.
 *
 * @param {object} opts
 * @param {number} opts.counter
 * @param {string} opts.subproblem
 * @param {string} opts.description           – e.g. "accept item2 into knapsack"
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.result]                   – updated solution fragment
 * @returns {ReturnType<typeof createGreedyEvent>}
 */
export function createAcceptEvent({
  counter,
  subproblem,
  description,
  stateSnapshot,
  result,
}) {
  return createGreedyEvent({
    type: 'accept',
    eventId: `e-${counter}`,
    step: counter,
    subproblem,
    action: `accept: ${description}`,
    stateSnapshot,
    meta: result != null ? { result } : null,
  });
}

/**
 * Create a `reject` event.
 *
 * @param {object} opts
 * @param {number} opts.counter
 * @param {string} opts.subproblem
 * @param {string} opts.description           – e.g. "reject item5: exceeds remaining capacity"
 * @param {object} opts.stateSnapshot
 * @param {string} [opts.reason]              – why rejected
 * @returns {ReturnType<typeof createGreedyEvent>}
 */
export function createRejectEvent({
  counter,
  subproblem,
  description,
  stateSnapshot,
  reason,
}) {
  return createGreedyEvent({
    type: 'reject',
    eventId: `e-${counter}`,
    step: counter,
    subproblem,
    action: `reject: ${description}`,
    stateSnapshot,
    meta: reason != null ? { reason } : null,
  });
}

/**
 * Create an `update` event.
 *
 * @param {object} opts
 * @param {number} opts.counter
 * @param {string} opts.subproblem
 * @param {string} opts.description           – e.g. "remaining capacity: 10 → 7"
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.previous]
 * @param {*} [opts.next]
 * @returns {ReturnType<typeof createGreedyEvent>}
 */
export function createUpdateEvent({
  counter,
  subproblem,
  description,
  stateSnapshot,
  previous,
  next,
}) {
  return createGreedyEvent({
    type: 'update',
    eventId: `e-${counter}`,
    step: counter,
    subproblem,
    action: `update: ${description}`,
    stateSnapshot,
    meta: { previous, next },
  });
}

/**
 * Create a `complete` event.
 *
 * @param {object} opts
 * @param {number} opts.counter
 * @param {string} opts.subproblem
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.solution]                – final solution
 * @returns {ReturnType<typeof createGreedyEvent>}
 */
export function createCompleteEvent({
  counter,
  subproblem,
  stateSnapshot,
  solution,
}) {
  return createGreedyEvent({
    type: 'complete',
    eventId: `e-${counter}`,
    step: counter,
    subproblem,
    action: 'complete',
    stateSnapshot,
    meta: solution != null ? { solution } : null,
  });
}

// ---------------------------------------------------------------------------
// Collector wrapper
// ---------------------------------------------------------------------------

/**
 * Collector wrapper that adds greedy event bookkeeping.
 *
 * @returns {{ events: object[]; emit: (type: string, payload: object) => void; nextId: () => number }}
 */
export function createGreedyCollector() {
  const events = [];
  let counter = 1;

  return {
    events,
    nextId() {
      return counter++;
    },
    emit(type, payload) {
      const eventId = `e-${counter}`;
      counter += 1;

      const event = createGreedyEvent({
        type,
        eventId,
        step: counter - 1,
        subproblem: payload.subproblem ?? '',
        action:
          payload.action ??
          payload.description ??
          payload.reason ??
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

/**
 * Check whether an object is a greedy event (minimal shape check).
 *
 * @param {unknown} value
 * @returns {value is object}
 */
export function isGreedyEvent(value) {
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

/**
 * Check whether an array is a valid greedy event stream.
 *
 * @param {unknown} value
 * @returns {value is object[]}
 */
export function isGreedyEventStream(value) {
  if (!Array.isArray(value)) return false;
  return value.every(isGreedyEvent);
}

/**
 * Create a deterministic event id.
 *
 * @param {number} counter
 * @returns {string}
 */
export function makeGreedyEventId(counter) {
  return `e-${counter}`;
}
