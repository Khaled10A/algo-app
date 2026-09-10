/**
 * Huffman coding snapshot projector.
 *
 * Maps a deterministic Huffman event stream into debugger snapshot schema:
 *
 *   {
 *     step, activeLine, log, vars, memory, callStack,
 *     greedy: {
 *       phase,
 *       codeStatus,
 *       currentSubproblem,
 *       currentResult,
 *       currentMerge,
 *       currentSelect,
 *       frequencyTable,
 *       queueState,
 *       treeNodes,
 *       currentNodes,
 *       nodesBeingMerged,
 *       newlyCreatedNode,
 *       finalRoot,
 *       generatedCodes,
 *       encodedOutput,
 *       solution,
 *     },
 *     complete
 *   }
 *
 * Snapshots are fully immutable: every snapshot is a fresh plain object with
 * cloned nested arrays/objects.
 */

import { deepClone, isHuffmanEventStream } from './huffmanEvents';

/** @type {{ frequency-count: number; queue-insert: number; select-min: number; merge: number; queue-update: number; tree-update: number; assign-code: number; encode: number; complete: number }} */
export const HUFFMAN_LINE_MAP = {
  'frequency-count': 0,
  'queue-insert': 1,
  'select-min': 2,
  'merge': 3,
  'queue-update': 4,
  'tree-update': 5,
  'assign-code': 6,
  'encode': 7,
  'complete': 8,
};

/** @type {{ frequency-count: string; queue-insert: string; select-min: string; merge: string; queue-update: string; tree-update: string; assign-code: string; encode: string; complete: string }} */
const PHASE_FOR_TYPE = {
  'frequency-count': 'frequency',
  'queue-insert': 'queue',
  'select-min': 'select',
  'merge': 'merge',
  'queue-update': 'queue-update',
  'tree-update': 'tree',
  'assign-code': 'code',
  'encode': 'encode',
  'complete': 'complete',
};

/**
 * Project Huffman events into an array of immutable snapshots.
 *
 * @param {Array<object>} events
 * @param {object} opts
 * @param {object} [opts.lineMap]
 * @param {string} [opts.label]
 * @returns {Array<object>}
 */
export function projectHuffmanEvents(events, opts = {}) {
  if (!isHuffmanEventStream(events)) {
    return [];
  }

  const lineMap = opts.lineMap ?? HUFFMAN_LINE_MAP;
  const label = opts.label ?? 'huffman';

  const snapshots = [];
  let frequencyTable = [];
  let queueState = [];
  let treeNodes = [];
  let currentNodes = [];
  let nodesBeingMerged = [];
  let newlyCreatedNode = null;
  let finalRoot = null;
  let generatedCodes = [];
  let encodedOutput = null;
  let solution = null;
  let nodeMap = new Map(); // nodeId -> node info for tree reconstruction

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Update state based on event type
    if (event.type === 'frequency-count' && event.meta && event.meta.frequencies) {
      frequencyTable = deepClone(event.meta.frequencies);
    }

    if (event.type === 'queue-insert' && event.meta) {
      const { nodeId, char, freq, queueState: qs } = event.meta;
      queueState = deepClone(qs || queueState);

      // Track node in node map
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          id: nodeId,
          char: char || null,
          freq,
          isLeaf: char !== null && char !== undefined,
          left: null,
          right: null,
          parent: null,
          code: null,
        });
      }
    }

    if (event.type === 'select-min' && event.meta) {
      const { leftNodeId, rightNodeId, queueState: qs } = event.meta;
      nodesBeingMerged = [leftNodeId, rightNodeId];
      queueState = deepClone(qs || queueState);
      currentNodes = [leftNodeId, rightNodeId];
    }

    if (event.type === 'merge' && event.meta) {
      const { leftNodeId, rightNodeId, parentNodeId, mergedFreq, queueState: qs, treeState: ts } = event.meta;

      // Update node map: create parent, link children
      const leftNode = nodeMap.get(leftNodeId);
      const rightNode = nodeMap.get(rightNodeId);

      const parentNode = {
        id: parentNodeId,
        char: null,
        freq: mergedFreq,
        isLeaf: false,
        left: leftNodeId,
        right: rightNodeId,
        parent: null,
        code: null,
      };

      nodeMap.set(parentNodeId, parentNode);

      if (leftNode) {
        leftNode.parent = parentNodeId;
        leftNode.right = null; // Will be updated when tree is built
      }
      if (rightNode) {
        rightNode.parent = parentNodeId;
      }

      // Update children references
      if (leftNode) leftNode.right = null;
      if (rightNode) rightNode.left = null;

      newlyCreatedNode = parentNodeId;
      queueState = deepClone(qs || queueState);
      if (ts) {
        treeNodes = deepClone(ts);
      }

      nodesBeingMerged = [];
      currentNodes = [];
    }

    if (event.type === 'queue-update' && event.meta && event.meta.queueState) {
      queueState = deepClone(event.meta.queueState);
    }

    if (event.type === 'tree-update' && event.meta && event.meta.treeState) {
      treeNodes = deepClone(event.meta.treeState);
    }

    if (event.type === 'assign-code' && event.meta) {
      const { char, code, nodeId } = event.meta;
      generatedCodes = generatedCodes.filter(c => c.char !== char);
      generatedCodes.push({ char, code, nodeId });
    }

    if (event.type === 'encode' && event.meta && event.meta.encoded) {
      encodedOutput = {
        encoded: event.meta.encoded,
        originalLength: event.meta.originalLength,
        encodedLength: event.meta.encodedLength,
      };
    }

    if (event.type === 'complete' && event.meta && event.meta.solution) {
      solution = deepClone(event.meta.solution);
      finalRoot = solution.rootId;
    }

    const snapshot = projectSingleHuffmanEvent(
      event,
      i,
      lineMap,
      label,
      frequencyTable,
      queueState,
      treeNodes,
      currentNodes,
      nodesBeingMerged,
      newlyCreatedNode,
      finalRoot,
      generatedCodes,
      encodedOutput,
      solution,
    );

    snapshots.push(snapshot);
  }

  return snapshots;
}

/**
 * Project a single Huffman event into an immutable snapshot.
 */
function projectSingleHuffmanEvent(
  event,
  stepIdx,
  lineMap,
  label,
  frequencyTable,
  queueState,
  treeNodes,
  currentNodes,
  nodesBeingMerged,
  newlyCreatedNode,
  finalRoot,
  generatedCodes,
  encodedOutput,
  solution,
) {
  const type = event.type;
  const subproblem = event.subproblem ?? '';
  const action = event.action ?? type;
  const stateSnapshot = event.stateSnapshot ?? {};
  const meta = event.meta ?? null;

  const phase = PHASE_FOR_TYPE[type] ?? 'unknown';
  const activeLine = lineMap[type] ?? lineMap.complete ?? 0;

  // Build vars from state snapshot
  const vars = buildHuffmanVars(stateSnapshot, meta);

  // Build memory string
  const memory = buildHuffmanMemory(stateSnapshot, subproblem, meta, phase);

  const callStack = [`${label}()`];

  const snapshot = {
    step: stepIdx,
    activeLine,
    log: `${action} · ${subproblem}`,
    vars: deepClone(vars),
    memory: deepClone(memory),
    callStack: callStack.slice(),
    greedy: {
      phase,
      depth: 0,
      currentNodeId: null,
      currentSubproblem: subproblem,
      currentBounds: null,
      currentResult: deriveCurrentResult(meta),
      currentCompare: deriveCompareInfo(event, meta),
      currentSelect: deriveSelectInfo(event, meta),
      currentMerge: deriveMergeInfo(event, meta),
      currentCombine: null,
      partition: null,
      meta: meta,
      latestResult: null,
      treeNodes: deepClone(treeNodes),
      returnedResults: [],
      // Huffman-specific fields
      codeStatus: phase === 'code' ? 'assigning' : phase === 'complete' ? 'complete' : 'pending',
      frequencyTable: deepClone(frequencyTable),
      queueState: deepClone(queueState),
      currentNodes: deepClone(currentNodes),
      nodesBeingMerged: deepClone(nodesBeingMerged),
      newlyCreatedNode: newlyCreatedNode ? { id: newlyCreatedNode } : null,
      finalRoot: finalRoot ? { id: finalRoot } : null,
      generatedCodes: deepClone(generatedCodes),
      encodedOutput: encodedOutput ? deepClone(encodedOutput) : null,
      solution: solution ? deepClone(solution) : null,
    },
    complete: type === 'complete',
  };

  return snapshot;
}

/**
 * Derive current result from meta.
 */
function deriveCurrentResult(meta) {
  if (!meta) return null;
  if (meta.frequencies) return meta.frequencies;
  if (meta.mergedFreq) return { freq: meta.mergedFreq };
  if (meta.code) return { code: meta.code };
  if (meta.encoded) return { encoded: meta.encoded };
  if (meta.solution) return meta.solution;
  if (meta.nodeId) return { nodeId: meta.nodeId };
  return null;
}

/**
 * Derive compare info (for select-min events).
 */
function deriveCompareInfo(event, meta) {
  if (event.type !== 'select-min') return null;
  return {
    description: event.action ?? 'select-min',
    comparing: (meta && meta.leftNodeId != null && meta.rightNodeId != null)
      ? { leftNodeId: meta.leftNodeId, rightNodeId: meta.rightNodeId, leftFreq: meta.leftFreq, rightFreq: meta.rightFreq }
      : null,
  };
}

/**
 * Derive select info.
 */
function deriveSelectInfo(event, meta) {
  if (event.type !== 'select-min') return null;
  return {
    description: event.action ?? 'select-min',
    selected: (meta && meta.leftNodeId != null)
      ? { leftNodeId: meta.leftNodeId, rightNodeId: meta.rightNodeId }
      : null,
  };
}

/**
 * Derive merge info.
 */
function deriveMergeInfo(event, meta) {
  if (event.type !== 'merge') return null;
  return {
    description: event.action ?? 'merge',
    merging: (meta && meta.leftNodeId != null && meta.rightNodeId != null && meta.parentNodeId != null)
      ? { leftNodeId: meta.leftNodeId, rightNodeId: meta.rightNodeId, parentNodeId: meta.parentNodeId, mergedFreq: meta.mergedFreq }
      : null,
  };
}

/**
 * Build vars object from state snapshot.
 */
function buildHuffmanVars(stateSnapshot, meta) {
  const vars = {};

  // Include frequency table if present
  if (meta && meta.frequencies) {
    vars.frequencies = meta.frequencies;
  }

  // Include queue state if present in snapshot
  if (stateSnapshot.queueState) {
    vars.queueState = stateSnapshot.queueState;
  }

  // Include tree nodes if present
  if (stateSnapshot.treeNodes) {
    vars.treeNodes = stateSnapshot.treeNodes;
  }

  // Include generated codes
  if (stateSnapshot.generatedCodes) {
    vars.generatedCodes = stateSnapshot.generatedCodes;
  }

  // Include encoded output
  if (stateSnapshot.encodedOutput) {
    vars.encodedOutput = stateSnapshot.encodedOutput;
  }

  // Include scalar fields
  if (stateSnapshot.totalFrequency !== undefined) {
    vars.totalFrequency = String(stateSnapshot.totalFrequency);
  }
  if (stateSnapshot.uniqueChars !== undefined) {
    vars.uniqueChars = String(stateSnapshot.uniqueChars);
  }
  if (stateSnapshot.encodedLength !== undefined) {
    vars.encodedLength = String(stateSnapshot.encodedLength);
  }

  // Include any other scalar fields
  for (const key of Object.keys(stateSnapshot)) {
    const val = stateSnapshot[key];
    if (typeof val === 'number' || typeof val === 'string' || typeof val === 'bigint') {
      if (!Object.prototype.hasOwnProperty.call(vars, key)) {
        vars[key] = String(val);
      }
    } else if (Array.isArray(val)) {
      if (!Object.prototype.hasOwnProperty.call(vars, key)) {
        vars[key] = deepClone(val);
      }
    }
  }

  return vars;
}

/**
 * Build memory string from state snapshot.
 */
function buildHuffmanMemory(stateSnapshot, subproblem, meta, phase) {
  const parts = [];

  parts.push(`phase: ${phase}`);
  parts.push(`subproblem: ${subproblem}`);

  if (meta && meta.frequencies) {
    parts.push(`frequencies: ${meta.frequencies.length} unique chars`);
  }
  if (meta && meta.leftFreq != null && meta.rightFreq != null) {
    parts.push(`selecting: ${meta.leftFreq} + ${meta.rightFreq}`);
  }
  if (meta && meta.mergedFreq != null) {
    parts.push(`merged freq: ${meta.mergedFreq}`);
  }
  if (meta && meta.code != null) {
    parts.push(`code: ${meta.code}`);
  }
  if (meta && meta.encoded != null) {
    parts.push(`encoded: ${meta.encoded.length} bits`);
  }

  if (Object.keys(stateSnapshot).length > 0) {
    const snapshotStr = formatHuffmanSnapshot(stateSnapshot);
    parts.push(`state: ${snapshotStr}`);
  }

  return parts.join('\n');
}

/**
 * Format snapshot for display.
 */
function formatHuffmanSnapshot(snapshot) {
  const entries = Object.entries(snapshot).filter(
    ([k]) => k !== 'queueState' && k !== 'treeNodes' && k !== 'generatedCodes',
  );
  if (entries.length === 0) return '{}';
  return entries
    .map(([k, v]) => `${k}: ${formatHuffmanValue(v)}`)
    .join(', ');
}



/**
 * Format a value for display.
 */
function formatHuffmanValue(value) {
  if (value == null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 5) {
      return `[${value.map(formatHuffmanValue).join(', ')}]`;
    }
    return `[${value.length} items]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    if (entries.length <= 3) {
      return `{${entries.map(([k, v]) => `${k}: ${formatHuffmanValue(v)}`).join(', ')}}`;
    }
    return `{${entries.length} fields}`;
  }
  return String(value);
}
