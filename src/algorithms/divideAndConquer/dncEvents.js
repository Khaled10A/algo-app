/**
 * Divide & Conquer event contract.
 *
 * Deterministic, serializable events emitted by D&C algorithms and projected into
 * debugger snapshots by dncSteps.js. Algorithm code never touches React or UI
 * state directly.
 *
 * Event vocabulary is intentionally flexible: not every algorithm must emit every
 * event type. Subproblem identity is carried through the shared subproblem
 * field and, where applicable, parentId/nodeId/depth for recursion-tree
 * derivation.
 *
 * Common fields (present on every emitted event):
 *   - eventId        : unique event identifier (string)
 *   - type           : event type string
 *   - depth          : recursion depth (number, 0-based at root)
 *   - subproblem     : description of current subproblem (string)
 *   - action         : short human-readable action label
 *   - stateSnapshot  : immutable snapshot of algorithm state at this moment
 *   - meta           : optional metadata bag (object | null)
 *
 * Tree-derivation fields (present when relevant):
 *   - nodeId        : node identifier for recursion-tree construction
 *   - parentId      : parent node identifier (null for root)
 *
 * Subproblem shapes (the foundation supports these; an algorithm may emit any
 * shape it needs, including shapes not listed here):
 *   - numeric        : a single integer/range value (e.g. n, k)
 *   - arrayRange     : a contiguous index range into an array (lo..hi)
 *   - pointSet       : a geometric point set in 2-D
 *   - matrixBlock    : a submatrix block (rows x cols)
 *
 * Design note:
 *   stateSnapshot must be deeply immutable from the emitter's side so that
 *   history playback cannot be corrupted by later mutations. The emitter helpers
 *   deep-clone stateSnapshot and meta, and the collector/projector do the same,
 *   so callers do not need to pre-freeze values. Tests assert this immutability.
 */

/** @type {string} */
export const DOMAIN = 'divideAndConquer';

/** @type {string[]} */
export const EVENT_TYPES = [
  'enter',
  'divide',
  'recurse',
  'baseCase',
  'compare',
  'combine',
  'return',
  'complete',
];

/**
 * Subproblem shapes the foundation is explicitly designed to support.
 *
 * This list is descriptive, not restrictive: an algorithm may represent a
 * subproblem in any serializable shape it chooses.
 *
 * @type {{ NUMERIC: string; ARRAY_RANGE: string; POINT_SET: string; MATRIX_BLOCK: string }}
 */
export const SUBPROBLEM_SHAPES = {
  NUMERIC: 'numeric',
  ARRAY_RANGE: 'array-range',
  POINT_SET: 'point-set',
  MATRIX_BLOCK: 'matrix-block',
};

/**
 * Recognized event types that carry tree-derivation information.
 *
 * @type {Set<string>}
 */
export const TREE_EVENT_TYPES = new Set([
  'enter',
  'divide',
  'recurse',
  'baseCase',
  'combine',
  'return',
  'complete',
]);

/**
 * Recognized subproblem shapes (mirror of SUBPROBLEM_SHAPES values).
 *
 * @type {Set<string>}
 */
export const RECOGNIZED_SUBPROBLEM_SHAPES = new Set([
  SUBPROBLEM_SHAPES.NUMERIC,
  SUBPROBLEM_SHAPES.ARRAY_RANGE,
  SUBPROBLEM_SHAPES.POINT_SET,
  SUBPROBLEM_SHAPES.MATRIX_BLOCK,
]);

/**
 * Create a deterministic event id.
 * Uses monotonic counters per collector instance in practice; this helper is
 * provided so algorithm code does not need to import the collector just for ids.
 *
 * @param {number} counter
 * @returns {string}
 */
export function makeEventId(counter) {
  return `e-${counter}`;
}

/**
 * Deeply clone a snapshot value for storage.
 * This is the safety boundary: emitters should pass a clone here if they hold
 * the only reference to a mutable structure.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreezeSnapshot(value) {
  return deepClone(value);
}

/**
 * Deep clone utility for snapshot data.
 * Handles plain objects, arrays, and primitives. Does not attempt to preserve
 * class instances, Dates, Maps, Sets, etc. — snapshots should be plain data.
 *
 * @param {unknown} value
 * @returns {unknown}
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
 * Validate that a snapshot value is plain, serializable data.
 * This is used in tests and can be used by emitters for assertions.
 *
 * @param {unknown} value
 * @returns {value is object}
 */
export function isPlainSnapshot(value) {
  // Primitives are valid snapshot leaf values
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

/**
 * Recognize well-known built-in instance types that should not be treated as
 * plain snapshot values, even when they happen to serialize as plain objects.
 *
 * This list is defensive: it is used only as an early-out for common non-plain
 * values that can look plain under structural checks.
 */
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
 * Strictly validate that a snapshot is plain, serializable, and does not contain
 * Date/RegExp/Map/Set/function/class instances or circular references.
 *
 * This is the assertion boundary used by tests and by emitters that want to
 * guarantee the immutability contract before handing a value to the collector.
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

  // Built-in instance types are never snapshot-safe, even if they serialize
  // as plain objects under structural checks.
  if (isBuiltinInstance(value)) return false;

  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true; // Object.create(null)

  // Reject anything whose prototype is not a plain Object.prototype.
  if (proto !== Object.prototype) {
    return false;
  }

  for (const key of Object.keys(value)) {
    const v = value[key];
    if (!isImmutableSnapshot(v)) return false;
  }
  return true;
}

/**
 * Base shape for event metadata.
 */
export class DncEventMeta {
  /**
   * @param {object | null | undefined} extra
   */
  constructor(extra = null) {
    this.extra = extra;
  }
}

/**
 * Create an event payload.
 *
 * @param {object} opts
 * @param {string} opts.type
 * @param {string} opts.eventId
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {string} opts.action
 * @param {object} opts.stateSnapshot
 * @param {object | null | undefined} [opts.meta]
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @returns {{ type: string; eventId: string; depth: number; subproblem: string; action: string; stateSnapshot: object; meta: object | null; nodeId: string | null; parentId: string | null }}
 */
export function createDncEvent(opts) {
  const {
    type,
    eventId,
    depth,
    subproblem,
    action,
    stateSnapshot,
    meta = null,
    nodeId = null,
    parentId = null,
  } = opts;

  return {
    type,
    eventId,
    depth,
    subproblem,
    action,
    stateSnapshot: deepClone(stateSnapshot),
    meta: meta == null ? null : deepClone(meta),
    nodeId,
    parentId,
  };
}

/**
 * Event creator helpers for each supported event type.
 * These are intended to be used by algorithm implementations through a collector
 * wrapper, but they are also useful in tests and fixtures.
 */

/**
 * @param {object} opts
 * @param {number} opts.counter
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {string} opts.splitDescription
 * @param {object} opts.stateSnapshot
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @param {object | null | undefined} [opts.meta]
 * @returns {ReturnType<typeof createDncEvent>}
 */
export function createDivideEvent({
  counter,
  depth,
  subproblem,
  splitDescription,
  stateSnapshot,
  nodeId = null,
  parentId = null,
  meta = null,
}) {
  // counter is intentionally used for event id generation below.
  void counter;
  return createDncEvent({
    type: 'divide',
    eventId: makeEventId(counter),
    depth,
    subproblem,
    action: `divide: ${splitDescription}`,
    stateSnapshot,
    nodeId,
    parentId,
    meta,
  });
}

/**
 * @param {object} opts
 * @param {number} opts.counter
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {string} opts.childDescription
 * @param {object} opts.stateSnapshot
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @param {object | null | undefined} [opts.meta]
 * @returns {ReturnType<typeof createDncEvent>}
 */
export function createRecurseEvent({
  counter,
  depth,
  subproblem,
  childDescription,
  stateSnapshot,
  nodeId = null,
  parentId = null,
  meta = null,
}) {
  void counter;
  return createDncEvent({
    type: 'recurse',
    eventId: makeEventId(counter),
    depth,
    subproblem,
    action: `recurse: ${childDescription}`,
    stateSnapshot,
    nodeId,
    parentId,
    meta,
  });
}

/**
 * @param {object} opts
 * @param {number} opts.counter
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {string} opts.reason
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.result]
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @param {object | null | undefined} [opts.meta]
 * @returns {ReturnType<typeof createDncEvent>}
 */
export function createBaseCaseEvent({
  counter,
  depth,
  subproblem,
  reason,
  stateSnapshot,
  result,
  nodeId = null,
  parentId = null,
  meta = null,
}) {
  void counter;
  void result;
  return createDncEvent({
    type: 'baseCase',
    eventId: makeEventId(counter),
    depth,
    subproblem,
    action: `baseCase: ${reason}`,
    stateSnapshot,
    nodeId,
    parentId,
    meta,
  });
}

/**
 * @param {object} opts
 * @param {number} opts.counter
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {string} opts.description
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.a]
 * @param {*} [opts.b]
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @param {object | null | undefined} [opts.meta]
 * @returns {ReturnType<typeof createDncEvent>}
 */
export function createCompareEvent({
  counter,
  depth,
  subproblem,
  description,
  stateSnapshot,
  a,
  b,
  nodeId = null,
  parentId = null,
  meta = null,
}) {
  void counter;
  void a;
  void b;
  return createDncEvent({
    type: 'compare',
    eventId: makeEventId(counter),
    depth,
    subproblem,
    action: `compare: ${description}`,
    stateSnapshot,
    nodeId,
    parentId,
    meta,
  });
}

/**
 * @param {object} opts
 * @param {number} opts.counter
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {string} opts.description
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.intermediate]
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @param {object | null | undefined} [opts.meta]
 * @returns {ReturnType<typeof createDncEvent>}
 */
export function createCombineEvent({
  counter,
  depth,
  subproblem,
  description,
  stateSnapshot,
  intermediate,
  nodeId = null,
  parentId = null,
  meta = null,
}) {
  void counter;
  void intermediate;
  return createDncEvent({
    type: 'combine',
    eventId: makeEventId(counter),
    depth,
    subproblem,
    action: `combine: ${description}`,
    stateSnapshot,
    nodeId,
    parentId,
    meta,
  });
}

/**
 * @param {object} opts
 * @param {number} opts.counter
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {string} opts.reason
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.result]
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @param {object | null | undefined} [opts.meta]
 * @returns {ReturnType<typeof createDncEvent>}
 */
export function createReturnEvent({
  counter,
  depth,
  subproblem,
  reason,
  stateSnapshot,
  result,
  nodeId = null,
  parentId = null,
  meta = null,
}) {
  void counter;
  void result;
  return createDncEvent({
    type: 'return',
    eventId: makeEventId(counter),
    depth,
    subproblem,
    action: `return: ${reason}`,
    stateSnapshot,
    nodeId,
    parentId,
    meta,
  });
}

/**
 * @param {object} opts
 * @param {number} opts.counter
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {object} opts.stateSnapshot
 * @param {*} [opts.result]
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @param {object | null | undefined} [opts.meta]
 * @returns {ReturnType<typeof createDncEvent>}
 */
export function createCompleteEvent({
  counter,
  depth,
  subproblem,
  stateSnapshot,
  result,
  nodeId = null,
  parentId = null,
  meta = null,
}) {
  void counter;
  void result;
  return createDncEvent({
    type: 'complete',
    eventId: makeEventId(counter),
    depth,
    subproblem,
    action: 'complete',
    stateSnapshot,
    nodeId,
    parentId,
    meta,
  });
}

/**
 * @param {object} opts
 * @param {number} opts.counter
 * @param {number} opts.depth
 * @param {string} opts.subproblem
 * @param {object} opts.stateSnapshot
 * @param {string | null | undefined} [opts.nodeId]
 * @param {string | null | undefined} [opts.parentId]
 * @param {object | null | undefined} [opts.meta]
 * @returns {ReturnType<typeof createDncEvent>}
 */
export function createEnterEvent({
  counter,
  depth,
  subproblem,
  stateSnapshot,
  nodeId = null,
  parentId = null,
  meta = null,
}) {
  return createDncEvent({
    type: 'enter',
    eventId: makeEventId(counter),
    depth,
    subproblem,
    action: 'enter',
    stateSnapshot,
    nodeId,
    parentId,
    meta,
  });
}

/**
 * Collector wrapper that adds DncEvent bookkeeping.
 * This is the recommended way to emit D&C events from algorithm code.
 *
 * @returns {{ events: object[]; emit: (type: string, payload: object) => void; nextId: () => number }}
 */
export function createDncCollector() {
  const events = [];
  let counter = 1;

  return {
    events,
    nextId() {
      return counter++;
    },
    emit(type, payload) {
      const eventId = makeEventId(counter++);
      const event = createDncEvent({
        type,
        eventId,
        depth: payload.depth ?? 0,
        subproblem: payload.subproblem ?? '',
        // Fall back to the most descriptive payload text available before
        // collapsing to the bare event type, so human-readable action labels
        // (e.g. "divide: mid = 3") survive when `action` itself is omitted.
        action:
          payload.action ??
          payload.splitDescription ??
          payload.childDescription ??
          payload.description ??
          payload.reason ??
          type,
        stateSnapshot: payload.stateSnapshot ?? {},
        meta: payload.meta ?? null,
        nodeId: payload.nodeId ?? null,
        parentId: payload.parentId ?? null,
      });
      events.push(event);
      return event;
    },
  };
}
