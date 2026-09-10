/**
 * Divide & Conquer snapshot projector.
 *
 * Maps a deterministic D&C event stream into debugger snapshot schema:
 *
 *   {
 *     step, activeLine, log, vars, memory, callStack,
 *     dnc: {
 *       phase,
 *       depth,
 *       currentNodeId,
 *       currentSubproblem,
 *       currentBounds,
 *       currentResult,
 *       currentCompare,
 *       currentCombine,
 *       treeNodes,
 *       returnedResults
 *     },
 *     complete
 *   }
 *
 * Snapshots are fully immutable: every snapshot is a fresh plain object and
 * nested arrays/objects are cloned. The one deliberate exception is that
 * event payload values (meta, results) are shared by reference across the
 * snapshots that display them: they are deep-cloned exactly once at event
 * creation (collector boundary) and must be treated as read-only by all
 * consumers. This keeps projection O(events + nodes) instead of
 * O(events × nodes) for tree-heavy streams (e.g. Strassen 8×8).
 *
 * The projector does NOT mutate the event stream. It is pure and deterministic.
 */

import { deepClone } from './dncEvents';

export const DNC_LINE_MAP = {
  enter: 0,
  divide: 1,
  recurse: 2,
  baseCase: 3,
  compare: 4,
  combine: 5,
  return: 6,
  complete: 7,
};

const PHASE_FOR_TYPE = {
  enter: 'enter',
  divide: 'divide',
  recurse: 'recurse',
  baseCase: 'base-case',
  compare: 'compare',
  combine: 'combine',
  return: 'return',
  complete: 'complete',
};

/**
 * Project D&C events into an array of immutable snapshots.
 *
 * @param {Array<object>} events
 * @param {object} opts
 * @param {object} [opts.lineMap]
 * @param {string} [opts.label]
 * @returns {Array<object>}
 */
export function projectDNCEvents(events, opts = {}) {
  const lineMap = opts.lineMap ?? DNC_LINE_MAP;
  const label = opts.label ?? 'dnc';

  const snapshots = [];
  const nodeByParent = new Map();
  const nodeStack = [];
  let returnedResults = new Map();
  let latestResult = null;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const snapshot = projectSingleEvent(
      event,
      i,
      lineMap,
      label,
      nodeByParent,
      nodeStack,
      returnedResults,
    );

    // Carry the most recent non-null result forward so visualizers can keep
    // showing "current best" during phases that don't produce a result
    // themselves (enter/divide/recurse/compare).
    if (snapshot.dnc.currentResult != null) {
      latestResult = snapshot.dnc.currentResult;
    }
    snapshot.dnc.latestResult = latestResult ?? null;

    snapshots.push(snapshot);
  }

  return snapshots;
}

/**
 * Project a single event into an immutable snapshot.
 */
function projectSingleEvent(
  event,
  step,
  lineMap,
  label,
  nodeByParent,
  nodeStack,
  returnedResults,
) {
  let currentNodeId = null;
  const type = event.type;
  const depth = event.depth ?? 0;
  const nodeId = event.nodeId ?? null;
  const parentId = event.parentId ?? null;
  const subproblem = event.subproblem ?? '';
  const action = event.action ?? type;
  const stateSnapshot = event.stateSnapshot ?? {};
  const meta = event.meta ?? null;

  // Update node tracking for tree derivation
  if (nodeId != null) {
    if (!nodeByParent.has(nodeId)) {
      nodeByParent.set(nodeId, {
        id: nodeId,
        parentId,
        children: [],
        depth,
        subproblem,
        action,
        status: deriveNodeStatus(type),
        result: null,
        active: false,
        eventIndex: step,
      });
    }
    const node = nodeByParent.get(nodeId);
    node.depth = depth;
    node.subproblem = subproblem;
    node.action = action;
    node.status = deriveNodeStatus(type);
    node.eventIndex = step;
    // Record the returned value so tree nodes can annotate results. Prefer
    // meta.result (rich payloads), then fall back to stateSnapshot.result on
    // return/baseCase events (the convention used by the D&C algorithms).
    if (meta && meta.result !== undefined) {
      node.result = meta.result;
    } else if (
      (type === 'return' || type === 'baseCase') &&
      stateSnapshot.result !== undefined
    ) {
      node.result = stateSnapshot.result;
    }

    if (parentId != null && parentId !== nodeId) {
      if (!nodeByParent.has(parentId)) {
        nodeByParent.set(parentId, {
          id: parentId,
          parentId: null,
          children: [],
          depth: depth - 1,
          subproblem: '',
          action: '',
          status: 'pending',
          result: null,
          active: false,
          eventIndex: step,
        });
      }
      const parent = nodeByParent.get(parentId);
      if (!parent.children.includes(nodeId)) {
        parent.children.push(nodeId);
      }
    }

    // Track current node on stack
    if (type === 'enter' || type === 'divide' || type === 'recurse') {
      nodeStack.push(nodeId);
    } else if (type === 'baseCase' || type === 'return' || type === 'complete') {
      // Pop current node and all its descendants. A null parentId means the
      // top-level frame finished — unwind the stack entirely.
      if (parentId == null) {
        nodeStack.length = 0;
      } else {
        while (
          nodeStack.length > 0 &&
          nodeStack[nodeStack.length - 1] !== parentId
        ) {
          nodeStack.pop();
        }
      }
    }

    currentNodeId = nodeId;
  }

  // Derive phase
  const phase = PHASE_FOR_TYPE[type] ?? 'unknown';

  // Derive bounds from subproblem if it contains range info
  const currentBounds = extractBounds(subproblem);

  // Derive result if present in meta or state. Defensive clone: the projector
  // accepts raw (non-collector) event streams, so the source must not be able
  // to reach into the snapshot afterwards.
  let currentResult = null;
  if (meta && meta.result !== undefined) {
    currentResult = deepClone(meta.result);
  } else if (type === 'return' || type === 'baseCase') {
    // Try to get result from state snapshot
    currentResult = deepClone(stateSnapshot.result) ?? null;
  }

  // Track returned results
  if (type === 'return' || type === 'baseCase') {
    if (nodeId != null) {
      returnedResults.set(nodeId, currentResult);
    }
  }

  // Build tree nodes array (sorted by id for stable output)
  const treeNodes = buildTreeNodesArray(nodeByParent);

  // Mark current node as active
  if (currentNodeId != null) {
    const current = nodeByParent.get(currentNodeId);
    if (current) {
      current.active = true;
    }
  }

  // Build call stack from node path
  const callStack = buildCallStack(nodeStack, nodeByParent, label);

  // Build vars from current state
  const vars = buildVars(stateSnapshot);

  // Build memory string
  const memory = buildMemory(stateSnapshot, subproblem, currentResult);

  const snapshot = {
    step,
    activeLine: lineMap[type] ?? lineMap.complete ?? 0,
    log: `${action} · depth ${depth} · node ${nodeId ?? '—'}`,
    vars: deepClone(vars),
    memory: deepClone(memory),
    callStack: callStack.map((s) => s),
    dnc: {
      phase,
      depth,
      currentNodeId,
      currentSubproblem: subproblem,
      currentBounds,
      currentResult,
      currentCompare: deriveCompareInfo(event),
      currentCombine: deriveCombineInfo(event),
      // Raw partition metadata (when the event carries one), so visualizers
      // can show the dividing line / left-right split during divide/recurse
      // frames as well as during combine frames.
      // Shared event payload references (see module header): meta/partition
      // were deep-cloned once at the collector boundary and are read-only.
      partition: (meta && meta.partition) || null,
      meta,
      latestResult: null,
      // treeNodes is freshly built per snapshot (all values are clones or
      // primitives), so it can be shared without a second deep clone.
      treeNodes,
      // Fresh outer array + fresh [nodeId, result] entry pairs per snapshot;
      // the result values themselves are shared read-only references.
      returnedResults: Array.from(returnedResults.entries()),
    },
    complete: type === 'complete',
  };

  // Clear active flag after snapshot (it's per-step)
  if (currentNodeId != null) {
    const current = nodeByParent.get(currentNodeId);
    if (current) {
      current.active = false;
    }
  }

  return snapshot;
}

/**
 * Derive node status from event type.
 */
function deriveNodeStatus(type) {
  switch (type) {
    case 'enter':
      return 'active';
    case 'divide':
      return 'splitting';
    case 'recurse':
      return 'active';
    case 'baseCase':
      return 'base';
    case 'compare':
      return 'comparing';
    case 'combine':
      return 'combining';
    case 'return':
      return 'returned';
    case 'complete':
      return 'done';
    default:
      return 'pending';
  }
}

/**
 * Extract bounds from subproblem string if it contains range info.
 * Supports formats like "range[0..7]", "points:5", "matrix:2x2", etc.
 */
function extractBounds(subproblem) {
  // Try to extract range pattern [a..b]
  const rangeMatch = subproblem.match(/range\[(\d+)\.\.(\d+)\]/);
  if (rangeMatch) {
    return {
      kind: 'range',
      start: parseInt(rangeMatch[1], 10),
      end: parseInt(rangeMatch[2], 10),
    };
  }

  // Try to extract point count
  const pointsMatch = subproblem.match(/points:(\d+)/);
  if (pointsMatch) {
    return {
      kind: 'points',
      count: parseInt(pointsMatch[1], 10),
    };
  }

  // Try to extract matrix dimensions. Supports both the "matrix:2x2" form
  // and the human-readable "A 2×2 · B 2×2" form used by the matrix algorithms
  // (U+00D7 multiplication sign).
  const matrixMatch =
    subproblem.match(/matrix:(\d+)x(\d+)/) ?? subproblem.match(/(\d+)×(\d+)/);
  if (matrixMatch) {
    return {
      kind: 'matrix',
      rows: parseInt(matrixMatch[1], 10),
      cols: parseInt(matrixMatch[2], 10),
    };
  }

  return null;
}

/**
 * Build tree nodes array from node map, sorted by id.
 *
 * The returned nodes are freshly allocated with cloned children arrays, but
 * their field values are primitives or clones already — callers may embed the
 * array into a snapshot without an additional deep clone.
 */
function buildTreeNodesArray(nodeByParent) {
  const nodes = [];
  const sortedIds = Array.from(nodeByParent.keys()).sort();

  for (const id of sortedIds) {
    const node = nodeByParent.get(id);
    nodes.push({
      id: node.id,
      parentId: node.parentId,
      depth: node.depth,
      subproblem: node.subproblem,
      action: node.action,
      status: node.status,
      children: node.children.slice(),
      result: node.result,
      active: node.active,
      eventIndex: node.eventIndex,
    });
  }

  return nodes;
}

/**
 * Build call stack from node path.
 *
 * The node stack is pushed on enter/divide/recurse AND on the child's own
 * recurse announcement (parent pushing while the child enters), so consecutive
 * duplicate frames are collapsed — a frame set is only repeated once the
 * stack genuinely holds distinct subproblems.
 */
function buildCallStack(nodeStack, nodeByParent, label) {
  const stack = [`${label}()`];

  for (const nodeId of nodeStack) {
    const node = nodeByParent.get(nodeId);
    if (!node) continue;
    const frame = `  └ ${node.subproblem}`;
    if (stack[stack.length - 1] === frame) continue;
    stack.push(frame);
  }

  return stack;
}

/**
 * Build vars object from state snapshot.
 */
function buildVars(stateSnapshot) {
  const vars = {};

  if (stateSnapshot.result !== undefined) {
    vars.result = String(stateSnapshot.result);
  }

  if (stateSnapshot.current !== undefined) {
    vars.current = String(stateSnapshot.current);
  }

  if (stateSnapshot.bounds !== undefined) {
    vars.bounds = String(stateSnapshot.bounds);
  }

  if (stateSnapshot.size !== undefined) {
    vars.size = String(stateSnapshot.size);
  }

  // Include numeric/string top-level fields, plus array-valued fields
  // (e.g. `pair` or the full `pts` list for the coordinate-plane renderer).
  // BigInt values are stringified too — String(123n) === '123', which keeps
  // Karatsuba's arbitrary-precision operands readable in the vars panel.
  for (const key of Object.keys(stateSnapshot)) {
    const val = stateSnapshot[key];
    if (
      typeof val === 'number' ||
      typeof val === 'string' ||
      typeof val === 'bigint'
    ) {
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
function buildMemory(stateSnapshot, subproblem, currentResult) {
  const parts = [];

  parts.push(`subproblem: ${subproblem}`);

  if (currentResult !== null && currentResult !== undefined) {
    parts.push(`result: ${formatValue(currentResult)}`);
  }

  if (Object.keys(stateSnapshot).length > 0) {
    const snapshotStr = formatSnapshot(stateSnapshot);
    parts.push(`state: ${snapshotStr}`);
  }

  return parts.join('\n');
}

/**
 * Format a value for display.
 */
function formatValue(value) {
  if (value == null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{${entries.map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ')}}`;
  }
  return String(value);
}

/**
 * Format snapshot for display.
 *
 * Long array-of-object fields like `pts` (the full point set) are excluded
 * from the memory string — they are already exposed through vars for the
 * visualizer and would otherwise drown out the readable state line.
 */
function formatSnapshot(snapshot) {
  const entries = Object.entries(snapshot).filter(
    ([k]) => k !== 'pts' && k !== 'points',
  );
  if (entries.length === 0) return '{}';
  return entries
    .map(([k, v]) => `${k}: ${formatValue(v)}`)
    .join(', ');
}

/**
 * Derive compare info from event.
 */
function deriveCompareInfo(event) {
  if (event.type !== 'compare') return null;

  // Defensive clones: raw event streams may have their meta mutated after
  // projection, so compare payloads are copied out per snapshot.
  return {
    description: event.action ?? 'compare',
    meta: event.meta ? deepClone(event.meta) : null,
    comparing: (event.meta && event.meta.comparing)
      ? deepClone(event.meta.comparing)
      : null,
    partition: (event.meta && event.meta.partition)
      ? deepClone(event.meta.partition)
      : null,
  };
}

/**
 * Derive combine info from event.
 */
function deriveCombineInfo(event) {
  if (event.type !== 'combine') return null;

  // Defensive clones: see deriveCompareInfo.
  return {
    description: event.action ?? 'combine',
    meta: event.meta ? deepClone(event.meta) : null,
    partition: (event.meta && event.meta.partition)
      ? deepClone(event.meta.partition)
      : null,
  };
}
