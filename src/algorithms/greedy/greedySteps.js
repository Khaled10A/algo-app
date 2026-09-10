/**
 * Greedy snapshot projector.
 *
 * Maps a deterministic greedy event stream into debugger snapshot schema:
 *
 *   {
 *     step, activeLine, log, vars, memory, callStack,
 *     greedy: {
 *       phase,
 *       depth,
 *       currentSubproblem,
 *       currentCompare,
 *       currentSelect,
 *       currentResult,
 *       solution,
 *       accepted,
 *       rejected,
 *       candidates,
 *     },
 *     complete
 *   }
 *
 * Snapshots are fully immutable: every snapshot is a fresh plain object with
 * cloned nested arrays/objects. Event payload values (meta) are shared by
 * reference across the snapshots that display them — they are deep-cloned
 * exactly once at event creation (collector boundary) and must be treated as
 * read-only by all consumers.
 *
 * Pure and deterministic: one event → one snapshot.
 */

import {
  deepClone,
  isGreedyEventStream,
} from './greedyEvents';

/** @type {{ enter: number; compare: number; select: number; accept: number; reject: number; update: number; complete: number }} */
export const GREEDY_LINE_MAP = {
  enter: 0,
  compare: 1,
  select: 2,
  accept: 3,
  reject: 4,
  update: 5,
  complete: 6,
};

/** @type {{ enter: string; compare: string; select: string; accept: string; reject: string; update: string; complete: string }} */
const PHASE_FOR_TYPE = {
  enter: 'enter',
  compare: 'compare',
  select: 'select',
  accept: 'accept',
  reject: 'reject',
  update: 'update',
  complete: 'complete',
};

/**
 * Project greedy events into an array of immutable snapshots.
 *
 * @param {Array<object>} events
 * @param {object} opts
 * @param {object} [opts.lineMap]
 * @param {string} [opts.label]
 * @returns {Array<object>}
 */
export function projectGreedyEvents(events, opts = {}) {
  if (!isGreedyEventStream(events)) {
    return [];
  }

  const lineMap = opts.lineMap ?? GREEDY_LINE_MAP;
  const label = opts.label ?? 'greedy';

  const snapshots = [];
  let accepted = [];      // array of accepted candidates (by reference, read-only)
  let rejected = [];      // array of rejected candidates (by reference, read-only)
  let solution = null;    // final solution (set on complete)
  let latestResult = null;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    // Update accepted/rejected BEFORE projecting this event so the snapshot
    // includes the accumulation up to and including this step.
    if (event.type === 'accept' && event.meta && event.meta.result != null) {
      accepted = accepted.concat([event.meta.result]);
    }
    if (event.type === 'reject' && event.meta && event.meta.reason != null) {
      rejected = rejected.concat([{ reason: event.meta.reason }]);
    }

    const snapshot = projectSingleGreedyEvent(
      event,
      i,
      lineMap,
      label,
      accepted,
      rejected,
      solution,
    );

    // Carry the most recent non-null result forward so visualizers can keep
    // showing "current best/selected" during phases that don't produce a
    // result themselves (enter/compare).
    if (snapshot.greedy.currentResult != null) {
      latestResult = snapshot.greedy.currentResult;
    }
    snapshot.greedy.latestResult = latestResult ?? null;

    // Persist solution from complete events for downstream consumers
    if (event.type === 'complete' && event.meta && event.meta.solution != null) {
      solution = event.meta.solution;
    }

    snapshots.push(snapshot);
  }

  return snapshots;
}

/**
 * Project a single greedy event into an immutable snapshot.
 */
function projectSingleGreedyEvent(
  event,
  stepIdx,
  lineMap,
  label,
  accepted,
  rejected,
  solution,
) {
  const type = event.type;
  const depth = event.meta && typeof event.meta.depth === 'number'
    ? event.meta.depth
    : 0;
  const subproblem = event.subproblem ?? '';
  const action = event.action ?? type;
  const stateSnapshot = event.stateSnapshot ?? {};
  const meta = event.meta ?? null;

  const phase = PHASE_FOR_TYPE[type] ?? 'unknown';

  // Derive compare info
  const currentCompare = deriveCompareInfo(event, meta);

  // Derive selected candidate info
  const currentSelect = deriveSelectInfo(event, meta);

  // Derive current result (accepted candidate, updated value, etc.)
  let currentResult = null;
  if (meta && meta.result != null) {
    currentResult = meta.result;
  } else if (meta && meta.selected != null) {
    currentResult = meta.selected;
  } else if (meta && meta.next != null) {
    currentResult = meta.next;
  } else if (meta && meta.solution != null) {
    currentResult = meta.solution;
  }

  // Derive solution (only meaningful on complete, but carried forward)
  const currentSolution = type === 'complete' && meta && meta.solution != null
    ? meta.solution
    : solution;

  // Derive candidate list from state snapshot
  const candidates = extractCandidates(stateSnapshot);

  // Build vars from current state
  const vars = buildGreedyVars(stateSnapshot, currentResult);

  // Build memory string
  const memory = buildGreedyMemory(stateSnapshot, subproblem, currentResult, phase);

  const callStack = [ `${label}()` ];

  const snapshot = {
    step: stepIdx,
    activeLine: lineMap[type] ?? lineMap.complete ?? 0,
    log: `${action} · ${subproblem}`,
    vars: deepClone(vars),
    memory: deepClone(memory),
    callStack: callStack.slice(),
    greedy: {
      phase,
      depth,
      currentNodeId: null,
      currentSubproblem: subproblem,
      currentBounds: null,
      currentResult,
      currentCompare,
      currentSelect,
      currentCombine: null,
      partition: null,
      meta: meta,
      latestResult: null,
      treeNodes: [],
      returnedResults: [],
      // Greedy-specific fields
      solution: currentSolution,
      accepted: accepted.slice(),
      rejected: rejected.slice(),
      candidates,
    },
    complete: type === 'complete',
  };

  return snapshot;
}

/**
 * Derive compare info from event.
 */
function deriveCompareInfo(event, meta) {
  if (event.type !== 'compare') return null;

  return {
    description: event.action ?? 'compare',
    comparing: (meta && meta.comparing)
      ? deepClone(meta.comparing)
      : null,
  };
}

/**
 * Derive select info from event.
 */
function deriveSelectInfo(event, meta) {
  if (event.type !== 'select') return null;

  return {
    description: event.action ?? 'select',
    selected: (meta && meta.selected)
      ? deepClone(meta.selected)
      : null,
  };
}

/**
 * Extract candidate list from state snapshot.
 * Looks for common candidate-shaped fields.
 */
function extractCandidates(stateSnapshot) {
  if (!stateSnapshot || typeof stateSnapshot !== 'object') return [];

  // Look for common candidate fields
  const candidateFields = ['candidates', 'items', 'activities', 'elements', 'nodes'];
  for (const field of candidateFields) {
    const val = stateSnapshot[field];
    if (Array.isArray(val) && val.length > 0) {
      return val.map((c) => deepClone(c));
    }
  }

  return [];
}

/**
 * Build vars object from state snapshot.
 */
function buildGreedyVars(stateSnapshot, currentResult) {
  const vars = {};

  if (currentResult != null) {
    vars.currentResult = String(currentResult);
  }

  // Include top-level scalar fields
  if (stateSnapshot.result !== undefined) {
    vars.result = String(stateSnapshot.result);
  }

  if (stateSnapshot.current !== undefined) {
    vars.current = String(stateSnapshot.current);
  }

  if (stateSnapshot.size !== undefined) {
    vars.size = String(stateSnapshot.size);
  }

  if (stateSnapshot.capacity !== undefined) {
    vars.capacity = String(stateSnapshot.capacity);
  }

  if (stateSnapshot.remaining !== undefined) {
    vars.remaining = String(stateSnapshot.remaining);
  }

  if (stateSnapshot.profit !== undefined) {
    vars.profit = String(stateSnapshot.profit);
  }

  if (stateSnapshot.weight !== undefined) {
    vars.weight = String(stateSnapshot.weight);
  }

  if (stateSnapshot.count !== undefined) {
    vars.count = String(stateSnapshot.count);
  }

  // Include numeric/string/array top-level fields
  for (const key of Object.keys(stateSnapshot)) {
    if (key === 'result' || key === 'current' || key === 'size' ||
        key === 'capacity' || key === 'remaining' || key === 'profit' ||
        key === 'weight' || key === 'count') {
      continue; // already handled above
    }
    const val = stateSnapshot[key];
    if (typeof val === 'number' || typeof val === 'string' || typeof val === 'bigint') {
      vars[key] = String(val);
    } else if (Array.isArray(val)) {
      vars[key] = deepClone(val);
    }
  }

  return vars;
}

/**
 * Build memory string from state snapshot.
 */
function buildGreedyMemory(stateSnapshot, subproblem, currentResult, phase) {
  const parts = [];

  parts.push(`phase: ${phase}`);
  parts.push(`subproblem: ${subproblem}`);

  if (currentResult != null) {
    parts.push(`current: ${formatGreedyValue(currentResult)}`);
  }

  if (Object.keys(stateSnapshot).length > 0) {
    const snapshotStr = formatGreedySnapshot(stateSnapshot);
    parts.push(`state: ${snapshotStr}`);
  }

  return parts.join('\n');
}

/**
 * Format a value for display.
 */
function formatGreedyValue(value) {
  if (value == null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'bigint') return String(value);
  if (Array.isArray(value)) {
    return `[${value.map(formatGreedyValue).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{${entries.map(([k, v]) => `${k}: ${formatGreedyValue(v)}`).join(', ')}}`;
  }
  return String(value);
}

/**
 * Format snapshot for display.
 */
function formatGreedySnapshot(snapshot) {
  const entries = Object.entries(snapshot).filter(
    ([k]) => k !== 'pts' && k !== 'points' && k !== 'candidates' && k !== 'items' && k !== 'activities',
  );
  if (entries.length === 0) return '{}';
  return entries
    .map(([k, v]) => `${k}: ${formatGreedyValue(v)}`)
    .join(', ');
}
