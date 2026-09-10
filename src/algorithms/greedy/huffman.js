/**
 * Huffman Coding implementation.
 *
 * Standard Huffman coding using a min-priority queue.
 * Time: O(n log n) for tree construction, where n = unique symbols.
 *        Code assignment is O(t) where t = tree nodes.
 *        Encoding/decoding is O(L) where L = input length.
 * Space: O(n) for tree, codes, and priority queue.
 *
 * This module also provides a `debug(text)` function that generates a full
 * event stream for visualization in the debugger tab.
 */

// ---------------------------------------------------------------------------
// Min-priority queue (deterministic, simple array-based for visualization)
// ---------------------------------------------------------------------------

/**
 * A min-priority queue entry.
 * @typedef {{ freq: number; node: HuffmanNode; order: number }} PQEntry
 */

/**
 * Create a priority queue entry.
 * @param {number} freq
 * @param {HuffmanNode} node
 * @param {number} order - insertion order for deterministic tie-breaking
 * @returns {PQEntry}
 */
function makeEntry(freq, node, order) {
  return { freq, node, order };
}

/**
 * Min-priority queue backed by a sorted array.
 * For visualization we keep it small and deterministic.
 */
export class MinPriorityQueue {
  constructor() {
    this._entries = [];
    this._order = 0;
  }

  get size() {
    return this._entries.length;
  }

  isEmpty() {
    return this._entries.length === 0;
  }

  /** Peek at the minimum-frequency entry without removing it. */
  peek() {
    if (this._entries.length === 0) return null;
    return this._entries[0];
  }

  /** Dequeue and return the minimum-frequency entry. */
  dequeue() {
    if (this._entries.length === 0) return null;
    const entry = this._entries.shift();
    return entry;
  }

  /** Enqueue a (frequency, node) pair with deterministic order. */
  enqueue(freq, node) {
    const entry = makeEntry(freq, node, this._order++);
    // Insert in sorted position (ascending by freq, then order for ties)
    let lo = 0;
    let hi = this._entries.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      const candidate = this._entries[mid];
      if (candidate.freq < freq || (candidate.freq === freq && candidate.order < entry.order)) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    this._entries.splice(lo, 0, entry);
  }

  /** Return a snapshot of queue entries for visualization. */
  snapshot() {
    return this._entries.map((e) => ({ freq: e.freq, order: e.order, nodeId: e.node.id }));
  }

  /** Clear the queue. */
  clear() {
    this._entries = [];
    this._order = 0;
  }
}

// ---------------------------------------------------------------------------
// Huffman tree nodes
// ---------------------------------------------------------------------------

/** @typedef {{ id: number; char: string | null; freq: number; left: HuffmanNode | null; right: HuffmanNode | null; parent: HuffmanNode | null; isLeaf: boolean; code: string | null }} HuffmanNode */

/**
 * Create a leaf node.
 * @param {number} id
 * @param {string} char
 * @param {number} freq
 * @returns {HuffmanNode}
 */
export function createLeafNode(id, char, freq) {
  return {
    id,
    char,
    freq,
    left: null,
    right: null,
    parent: null,
    isLeaf: true,
    code: null,
  };
}

/**
 * Create an internal node.
 * @param {number} id
 * @param {number} freq
 * @param {HuffmanNode} left
 * @param {HuffmanNode} right
 * @returns {HuffmanNode}
 */
export function createInternalNode(id, freq, left, right) {
  const node = {
    id,
    char: null,
    freq,
    left,
    right,
    parent: null,
    isLeaf: false,
    code: null,
  };
  if (left) left.parent = node;
  if (right) right.parent = node;
  return node;
}

// ---------------------------------------------------------------------------
// Frequency calculation
// ---------------------------------------------------------------------------

/**
 * Calculate character frequencies from input text.
 * @param {string} text
 * @returns {Array<{ char: string; freq: number }>}
 */
export function calculateFrequencies(text) {
  const freqMap = new Map();
  for (const ch of text) {
    freqMap.set(ch, (freqMap.get(ch) || 0) + 1);
  }
  return Array.from(freqMap.entries()).map(([char, freq]) => ({ char, freq }));
}

// ---------------------------------------------------------------------------
// Tree construction
// ---------------------------------------------------------------------------

// Counter for unique node IDs
let _nodeIdCounter = 1;
export function resetNodeIdCounter() {
  _nodeIdCounter = 1;
}
export function nextNodeId() {
  return _nodeIdCounter++;
}

/**
 * Build the Huffman tree from character frequencies.
 * Returns the root node and emits a snapshot of the final tree.
 * @param {Array<{ char: string; freq: number }>} frequencies
 * @returns {HuffmanNode | null}
 */
export function buildTree(frequencies) {
  resetNodeIdCounter();

  if (frequencies.length === 0) return null;

  const queue = new MinPriorityQueue();
  const leaves = [];

  // Create leaf nodes and insert into priority queue
  for (const { char, freq } of frequencies) {
    const leaf = createLeafNode(nextNodeId(), char, freq);
    leaves.push(leaf);
    queue.enqueue(freq, leaf);
  }

  // Special case: single unique character
  if (queue.size === 1) {
    const leaf = queue.dequeue().node;
    // Create a parent so we have a proper tree structure
    const parent = createInternalNode(nextNodeId(), leaf.freq, leaf, null);
    return parent;
  }

  // Repeatedly merge two lowest-frequency nodes
  while (queue.size > 1) {
    const leftEntry = queue.dequeue();
    const rightEntry = queue.dequeue();

    if (!leftEntry || !rightEntry) break;

    const mergedFreq = leftEntry.freq + rightEntry.freq;
    const parent = createInternalNode(nextNodeId(), mergedFreq, leftEntry.node, rightEntry.node);

    queue.enqueue(mergedFreq, parent);
  }

  const rootEntry = queue.dequeue();
  return rootEntry ? rootEntry.node : null;
}

// ---------------------------------------------------------------------------
// Code assignment (DFS traversal)
// ---------------------------------------------------------------------------

/**
 * Assign Huffman codes to all leaf nodes via DFS traversal.
 * @param {HuffmanNode} root
 * @returns {Array<{ char: string; code: string; freq: number }>}
 */
export function assignCodes(root) {
  if (!root) return [];

  const codes = [];
  const stack = [{ node: root, prefix: '' }];
  let leafCount = 0;

  // First pass: count leaves
  const tempStack = [root];
  while (tempStack.length > 0) {
    const node = tempStack.pop();
    if (node.isLeaf && node.char !== null) {
      leafCount++;
    }
    if (node.right) tempStack.push(node.right);
    if (node.left) tempStack.push(node.left);
  }

  // Special case: root is the only leaf (single character)
  if (leafCount === 1 && root.isLeaf) {
    root.code = '0';
    codes.push({ char: root.char, code: '0', freq: root.freq });
    return codes;
  }

  while (stack.length > 0) {
    const { node, prefix } = stack.pop();

    if (node.isLeaf && node.char !== null) {
      node.code = prefix;
      codes.push({ char: node.char, code: prefix, freq: node.freq });
    }

    if (node.right) {
      stack.push({ node: node.right, prefix: prefix + '1' });
    }
    if (node.left) {
      stack.push({ node: node.left, prefix: prefix + '0' });
    }
  }

  return codes;
}

// ---------------------------------------------------------------------------
// Encoding and decoding
// ---------------------------------------------------------------------------

/**
 * Encode text using Huffman codes.
 * @param {string} text
 * @param {Array<{ char: string; code: string }>} codeTable
 * @returns {{ encoded: string; charToCode: Map<string, string> }}
 */
export function encode(text, codeTable) {
  const charToCode = new Map(codeTable.map((c) => [c.char, c.code]));
  let encoded = '';
  for (const ch of text) {
    const code = charToCode.get(ch);
    if (code === undefined) {
      throw new Error(`Character '${ch}' not in code table`);
    }
    encoded += code;
  }
  return { encoded, charToCode };
}

/**
 * Decode a Huffman-encoded bit string using the tree.
 * @param {string} encoded - bit string of '0' and '1'
 * @param {HuffmanNode} root - Huffman tree root
 * @returns {string}
 */
export function decode(encoded, root) {
  if (!root) return '';
  if (encoded.length === 0) return '';

  let decoded = '';
  let current = root;

  for (const bit of encoded) {
    if (bit !== '0' && bit !== '1') {
      throw new Error(`Invalid bit '${bit}' in encoded string`);
    }

    // Navigate the tree
    if (bit === '0') {
      if (current.left) {
        current = current.left;
      } else {
        // If no left child, stay at current node (single child case)
        // This handles the case where root has only one child
      }
    } else {
      if (current.right) {
        current = current.right;
      } else {
        // If no right child, stay at current node
      }
    }

    if (current.isLeaf && current.char !== null) {
      decoded += current.char;
      current = root;
    }
  }

  // If we end at an internal node with a single child, we might have a valid decode
  // Check if we should accept this as valid
  if (!current.isLeaf) {
    // If current is root and we've decoded something, it might be valid for single-char case
    if (current === root && decoded.length > 0 && root.left === null && root.right !== null) {
      // Single character case handled via right child only
      return decoded;
    }
    throw new Error('Invalid encoded string: incomplete code at end');
  }

  return decoded;
}

/**
 * Decode using the code table (reverse lookup) — O(n) per character.
 * This is simpler for visualization but less efficient than tree traversal.
 * @param {string} encoded
 * @param {Array<{ char: string; code: string }>} codeTable
 * @returns {string}
 */
export function decodeWithTable(encoded, codeTable) {
  if (encoded.length === 0) return '';

  const codeToChar = new Map(codeTable.map((c) => [c.code, c.char]));
  let decoded = '';
  let currentCode = '';

  for (const bit of encoded) {
    currentCode += bit;
    const ch = codeToChar.get(currentCode);
    if (ch !== undefined) {
      decoded += ch;
      currentCode = '';
    }
  }

  if (currentCode !== '') {
    throw new Error('Invalid encoded string: incomplete code at end');
  }

  return decoded;
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

/** Maximum input length for Huffman visualization. */
export const HUFFMAN_MAX_INPUT_LENGTH = 200;

/**
 * Validate Huffman input text.
 * @param {string} text
 * @returns {{ valid: boolean; reason: string | null; processed: string }}
 */
export function validateHuffmanInput(text) {
  if (text == null || typeof text !== 'string') {
    return { valid: false, reason: 'Input must be a string.', processed: '' };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Input is empty.', processed: '' };
  }

  if (text.length > HUFFMAN_MAX_INPUT_LENGTH) {
    return {
      valid: false,
      reason: `Input too long (${text.length} chars). Maximum is ${HUFFMAN_MAX_INPUT_LENGTH} characters for visualization performance.`,
      processed: '',
    };
  }

  // We accept any valid string characters (including Unicode)
  // The algorithm works with any character set.
  return { valid: true, reason: null, processed: text };
}

/**
 * Get the maximum input length.
 * @returns {number}
 */
export function getMaxInputLength() {
  return HUFFMAN_MAX_INPUT_LENGTH;
}

// ---------------------------------------------------------------------------
// Tree utilities for visualization
// ---------------------------------------------------------------------------

/**
 * Get all nodes in the tree (for visualization snapshots).
 * @param {HuffmanNode | null} root
 * @returns {Array<HuffmanNode>}
 */
export function getTreeNodes(root) {
  if (!root) return [];
  const nodes = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    nodes.push(node);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return nodes;
}

/**
 * Find a node by ID.
 * @param {HuffmanNode | null} root
 * @param {number} id
 * @returns {HuffmanNode | null}
 */
export function findNodeById(root, id) {
  if (!root) return null;
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.id === id) return node;
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return null;
}

/**
 * Get the depth of the tree.
 * @param {HuffmanNode | null} root
 * @returns {number}
 */
export function getTreeDepth(root) {
  if (!root) return 0;
  let maxDepth = 0;
  const stack = [{ node: root, depth: 0 }];
  while (stack.length > 0) {
    const { node, depth } = stack.pop();
    if (depth > maxDepth) maxDepth = depth;
    if (node.left) stack.push({ node: node.left, depth: depth + 1 });
    if (node.right) stack.push({ node: node.right, depth: depth + 1 });
  }
  return maxDepth;
}

/**
 * Count leaves in the tree.
 * @param {HuffmanNode | null} root
 * @returns {number}
 */
export function countLeaves(root) {
  if (!root) return 0;
  let count = 0;
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.isLeaf) count++;
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return count;
}

// ---------------------------------------------------------------------------
// Debug function for visualization
// ---------------------------------------------------------------------------

import { createHuffmanCollector, createHuffmanEvent } from './huffmanEvents';
import { projectHuffmanEvents } from './huffmanSteps';

/**
 * Get queue state as serializable snapshot.
 * @param {MinPriorityQueue} queue
 * @returns {Array<{ freq: number; nodeId: number; order: number }>}
 */
function getQueueState(queue) {
  return queue.snapshot();
}

/**
 * Get tree nodes as serializable snapshot.
 * @param {Map<number, object>} nodeMap
 * @returns {Array<object>}
 */
function getTreeState(nodeMap) {
  return Array.from(nodeMap.values()).map(n => ({
    id: n.id,
    char: n.char,
    freq: n.freq,
    isLeaf: n.isLeaf,
    left: n.left ? n.left.id : null,
    right: n.right ? n.right.id : null,
    parent: n.parent ? n.parent.id : null,
    code: n.code,
  }));
}

/**
 * Debug function that generates a full event stream for visualization.
 *
 * @param {string} text - input text to encode
 * @returns {Array<object>} event stream for projector
 */
export function huffmanDebug(text) {
  const collector = createHuffmanCollector();
  let stepCounter = 1;

  // Validate input
  const validation = validateHuffmanInput(text);
  if (!validation.valid) {
    // Return minimal event stream with error info
    return [createHuffmanEvent({
      type: 'complete',
      eventId: `h-1`,
      step: 1,
      subproblem: 'error',
      action: validation.reason,
      stateSnapshot: { error: validation.reason },
      meta: { solution: { error: validation.reason } },
    })];
  }

  const inputText = validation.processed;

  // Step 1: Calculate frequencies
  const frequencies = calculateFrequencies(inputText);
  const totalChars = inputText.length;
  const uniqueChars = frequencies.length;

  collector.emit('frequency-count', {
    counter: stepCounter++,
    subproblem: 'character frequency analysis',
    action: `frequency-count: ${uniqueChars} unique characters in ${totalChars} total characters`,
    stateSnapshot: {
      inputText,
      totalFrequency: totalChars,
      uniqueChars,
      frequencies: frequencies.map(f => ({ char: f.char, freq: f.freq })),
    },
    meta: {
      frequencies: frequencies.map(f => ({ char: f.char, freq: f.freq })),
      totalFrequency: totalChars,
      uniqueChars,
    },
  });

  // Step 2: Create leaf nodes and insert into priority queue
  const queue = new MinPriorityQueue();
  const nodeMap = new Map(); // id -> node
  
  for (const { char, freq } of frequencies) {
    const nodeId = nextNodeId();
    const leaf = createLeafNode(nodeId, char, freq);
    nodeMap.set(nodeId, leaf);
    
    queue.enqueue(freq, leaf);
    
    collector.emit('queue-insert', {
      counter: stepCounter++,
      subproblem: 'priority queue insertion',
      action: `queue-insert: leaf node ${nodeId} ('${char}' freq ${freq})`,
      stateSnapshot: {
        queueState: getQueueState(queue),
        treeState: getTreeState(nodeMap),
      },
      meta: {
        nodeId,
        char,
        freq,
        queueState: getQueueState(queue),
      },
    });
  }

  // Special case: single unique character
  if (queue.size === 1) {
    const entry = queue.dequeue();
    const leaf = entry.node;
    const parentId = nextNodeId();
    const parent = createInternalNode(parentId, leaf.freq, leaf, null);
    nodeMap.set(parentId, parent);
    leaf.parent = parent;
    
    collector.emit('merge', {
      counter: stepCounter++,
      subproblem: 'single character special case',
      action: `merge: creating parent node ${parentId} for single character '${leaf.char}' (freq ${leaf.freq})`,
      stateSnapshot: {
        queueState: getQueueState(queue),
        treeState: getTreeState(nodeMap),
      },
      meta: {
        leftNodeId: leaf.id,
        rightNodeId: null,
        parentNodeId: parentId,
        mergedFreq: leaf.freq,
        queueState: getQueueState(queue),
        treeState: getTreeState(nodeMap),
      },
    });
  } else {
    // Step 3: Repeatedly merge two lowest-frequency nodes
    while (queue.size > 1) {
      const leftEntry = queue.dequeue();
      const rightEntry = queue.dequeue();

      if (!leftEntry || !rightEntry) break;

      // Emit select-min event
      collector.emit('select-min', {
        counter: stepCounter++,
        subproblem: 'select two minimum-frequency nodes',
        action: `select-min: node ${leftEntry.node.id} (freq ${leftEntry.freq}) and node ${rightEntry.node.id} (freq ${rightEntry.freq})`,
        stateSnapshot: {
          queueState: getQueueState(queue),
        },
        meta: {
          leftNodeId: leftEntry.node.id,
          rightNodeId: rightEntry.node.id,
          leftFreq: leftEntry.freq,
          rightFreq: rightEntry.freq,
          queueState: getQueueState(queue),
        },
      });

      // Create merged parent node
      const mergedFreq = leftEntry.freq + rightEntry.freq;
      const parentId = nextNodeId();
      const parent = createInternalNode(parentId, mergedFreq, leftEntry.node, rightEntry.node);
      nodeMap.set(parentId, parent);

      // Enqueue parent
      queue.enqueue(mergedFreq, parent);

      // Emit merge event
      collector.emit('merge', {
        counter: stepCounter++,
        subproblem: 'merge nodes',
        action: `merge: node ${leftEntry.node.id} + node ${rightEntry.node.id} → node ${parentId} (freq ${mergedFreq})`,
        stateSnapshot: {
          queueState: getQueueState(queue),
          treeState: getTreeState(nodeMap),
        },
        meta: {
          leftNodeId: leftEntry.node.id,
          rightNodeId: rightEntry.node.id,
          parentNodeId: parentId,
          mergedFreq,
          queueState: getQueueState(queue),
          treeState: getTreeState(nodeMap),
        },
      });
    }
  }

  // Get root node
  const rootEntry = queue.dequeue();
  const root = rootEntry ? rootEntry.node : null;

  // Step 4: Assign Huffman codes
  let codes = [];
  if (root) {
    codes = assignCodes(root);
    
    for (const { char, code } of codes) {
      const nodeId = [...nodeMap.values()].find(n => n.char === char)?.id || 0;
      
      collector.emit('assign-code', {
        counter: stepCounter++,
        subproblem: 'code assignment',
        action: `assign-code: ${char} → ${code}`,
        stateSnapshot: {
          treeState: getTreeState(nodeMap),
          generatedCodes: codes.map(c => ({ char: c.char, code: c.code })),
        },
        meta: {
          char,
          code,
          nodeId,
        },
      });
    }
  }

  // Step 5: Encode the input
  let encoded = '';
  if (root && codes.length > 0) {
    const codeTable = codes.map(c => ({ char: c.char, code: c.code }));
    const result = encode(inputText, codeTable);
    encoded = result.encoded;
    
    collector.emit('encode', {
      counter: stepCounter++,
      subproblem: 'encode input text',
      action: `encode: ${totalChars} characters → ${encoded.length} bits (${totalChars * 8} bits original)`,
      stateSnapshot: {
        encodedOutput: {
          encoded,
          originalLength: totalChars,
          encodedLength: encoded.length,
        },
        generatedCodes: codes.map(c => ({ char: c.char, code: c.code })),
      },
      meta: {
        encoded,
        originalLength: totalChars,
        encodedLength: encoded.length,
      },
    });
  }

  // Step 6: Complete
  collector.emit('complete', {
    counter: stepCounter++,
    subproblem: 'Huffman coding complete',
    action: 'complete: Huffman coding finished',
    stateSnapshot: {
      inputText,
      totalFrequency: totalChars,
      uniqueChars,
      treeState: getTreeState(nodeMap),
      generatedCodes: codes.map(c => ({ char: c.char, code: c.code, freq: c.freq })),
      encodedOutput: {
        encoded: encoded || '',
        originalLength: totalChars,
        encodedLength: encoded ? encoded.length : 0,
        compressionRatio: encoded ? ((encoded.length / (totalChars * 8)) * 100).toFixed(2) + '%' : 'N/A',
      },
      rootId: root ? root.id : null,
    },
    meta: {
      solution: {
        rootId: root ? root.id : null,
        codes: codes.map(c => ({ char: c.char, code: c.code, freq: c.freq })),
        encoded: encoded || '',
        originalLength: totalChars,
        encodedLength: encoded ? encoded.length : 0,
        compressionRatio: encoded ? ((encoded.length / (totalChars * 8)) * 100).toFixed(2) + '%' : 'N/A',
      },
    },
  });

  return collector.events;
}

/**
 * Steps function that projects debug events into debugger snapshots.
 *
 * @param {string} text - input text to encode
 * @returns {Array<object>} debugger snapshots
 */
export function huffmanSteps(text) {
  const events = huffmanDebug(text);
  return projectHuffmanEvents(events);
}

/**
 * Run function that executes Huffman coding and returns results.
 *
 * @param {string} text - input text to encode
 * @returns {{ success: boolean; error?: string; root?: HuffmanNode; codes?: Array<{ char: string; code: string; freq: number }>; encoded?: string; originalLength?: number; encodedLength?: number; compressionRatio?: string }}
 */
export function huffmanRun(text) {
  const validation = validateHuffmanInput(text);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason,
    };
  }

  const inputText = validation.processed;
  const frequencies = calculateFrequencies(inputText);
  const root = buildTree(frequencies);
  const codes = root ? assignCodes(root) : [];
  const { encoded } = encode(inputText, codes.map(c => ({ char: c.char, code: c.code })));

  return {
    success: true,
    root,
    codes: codes.map(c => ({ char: c.char, code: c.code, freq: c.freq })),
    encoded,
    originalLength: inputText.length,
    encodedLength: encoded.length,
    compressionRatio: ((encoded.length / (inputText.length * 8)) * 100).toFixed(2) + '%',
  };
}
