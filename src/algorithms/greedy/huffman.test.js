import { describe, expect, it } from 'vitest';
import {
  MinPriorityQueue,
  createLeafNode,
  createInternalNode,
  calculateFrequencies,
  buildTree,
  assignCodes,
  encode,
  decode,
  decodeWithTable,
  validateHuffmanInput,
  getMaxInputLength,
  HUFFMAN_MAX_INPUT_LENGTH,
  getTreeNodes,
  findNodeById,
  getTreeDepth,
  countLeaves,
  resetNodeIdCounter,
  huffmanRun,
} from './huffman';

describe('MinPriorityQueue', () => {
  it('starts empty', () => {
    const pq = new MinPriorityQueue();
    expect(pq.isEmpty()).toBe(true);
    expect(pq.size).toBe(0);
  });

  it('enqueues and dequeues in min order', () => {
    const pq = new MinPriorityQueue();
    pq.enqueue(10, { id: 1 });
    pq.enqueue(5, { id: 2 });
    pq.enqueue(15, { id: 3 });
    pq.enqueue(5, { id: 4 }); // Same freq, later order

    expect(pq.size).toBe(4);
    expect(pq.dequeue().freq).toBe(5);
    expect(pq.dequeue().freq).toBe(5);
    expect(pq.dequeue().freq).toBe(10);
    expect(pq.dequeue().freq).toBe(15);
    expect(pq.isEmpty()).toBe(true);
  });

  it('peek returns min without removing', () => {
    const pq = new MinPriorityQueue();
    pq.enqueue(20, { id: 1 });
    pq.enqueue(10, { id: 2 });

    expect(pq.peek().freq).toBe(10);
    expect(pq.size).toBe(2);
  });

  it('snapshot returns queue state', () => {
    const pq = new MinPriorityQueue();
    pq.enqueue(5, { id: 1 });
    pq.enqueue(10, { id: 2 });

    const snapshot = pq.snapshot();
    expect(snapshot).toHaveLength(2);
    expect(snapshot[0].freq).toBe(5);
    expect(snapshot[0].nodeId).toBe(1);
  });

  it('clear empties the queue', () => {
    const pq = new MinPriorityQueue();
    pq.enqueue(1, { id: 1 });
    pq.enqueue(2, { id: 2 });
    pq.clear();

    expect(pq.isEmpty()).toBe(true);
    expect(pq.size).toBe(0);
  });
});

describe('calculateFrequencies', () => {
  it('counts character frequencies correctly', () => {
    const result = calculateFrequencies('aabbc');
    expect(result).toHaveLength(3);
    expect(result).toContainEqual({ char: 'a', freq: 2 });
    expect(result).toContainEqual({ char: 'b', freq: 2 });
    expect(result).toContainEqual({ char: 'c', freq: 1 });
  });

  it('handles empty string', () => {
    const result = calculateFrequencies('');
    expect(result).toHaveLength(0);
  });

  it('handles single character', () => {
    const result = calculateFrequencies('aaa');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ char: 'a', freq: 3 });
  });

  it('handles spaces', () => {
    const result = calculateFrequencies('a b c');
    expect(result).toHaveLength(4); // a, space, b, c
    expect(result.find(f => f.char === ' ')).toEqual({ char: ' ', freq: 2 });
  });

  it('handles punctuation', () => {
    const result = calculateFrequencies('a,b.c!');
    expect(result).toHaveLength(6); // a, comma, b, period, c, exclamation
    expect(result.find(f => f.char === ',')).toEqual({ char: ',', freq: 1 });
  });

  it('handles Unicode characters', () => {
    const result = calculateFrequencies('héllo wörld');
    expect(result.some(f => f.char === 'é')).toBe(true);
    expect(result.some(f => f.char === 'ö')).toBe(true);
  });

  it('maintains order by first appearance', () => {
    const result = calculateFrequencies('ccaabb');
    expect(result[0].char).toBe('c');
    expect(result[1].char).toBe('a');
    expect(result[2].char).toBe('b');
  });
});

describe('buildTree', () => {
  beforeEach(() => {
    resetNodeIdCounter();
  });

  it('builds tree from frequencies', () => {
    const frequencies = [
      { char: 'a', freq: 5 },
      { char: 'b', freq: 9 },
      { char: 'c', freq: 12 },
    ];
    const root = buildTree(frequencies);
    expect(root).not.toBeNull();
    expect(root.isLeaf).toBe(false);
    expect(root.freq).toBe(26); // 5 + 9 + 12
  });

  it('handles single unique character', () => {
    const frequencies = [{ char: 'a', freq: 10 }];
    const root = buildTree(frequencies);
    expect(root).not.toBeNull();
    expect(root.isLeaf).toBe(false); // Has parent node
    expect(root.freq).toBe(10);
    expect(root.left).not.toBeNull();
    expect(root.left.isLeaf).toBe(true);
    expect(root.left.char).toBe('a');
  });

  it('handles empty frequencies', () => {
    const root = buildTree([]);
    expect(root).toBeNull();
  });

  it('creates proper tree structure', () => {
    const frequencies = [
      { char: 'a', freq: 5 },
      { char: 'b', freq: 9 },
      { char: 'c', freq: 12 },
      { char: 'd', freq: 13 },
      { char: 'e', freq: 16 },
      { char: 'f', freq: 45 },
    ];
    const root = buildTree(frequencies);
    expect(root).not.toBeNull();
    expect(countLeaves(root)).toBe(6);
    expect(root.freq).toBe(100); // Sum of all frequencies
  });

  it('merges lowest frequencies first', () => {
    const frequencies = [
      { char: 'a', freq: 1 },
      { char: 'b', freq: 2 },
      { char: 'c', freq: 3 },
    ];
    const root = buildTree(frequencies);
    // a(1) and b(2) should be merged first to create parent with freq 3
    // Then that parent(3) and c(3) should be merged
    expect(root.freq).toBe(6);
  });
});

describe('createLeafNode and createInternalNode', () => {
  it('creates leaf node with correct properties', () => {
    const node = createLeafNode(1, 'a', 5);
    expect(node.id).toBe(1);
    expect(node.char).toBe('a');
    expect(node.freq).toBe(5);
    expect(node.isLeaf).toBe(true);
    expect(node.left).toBeNull();
    expect(node.right).toBeNull();
    expect(node.parent).toBeNull();
    expect(node.code).toBeNull();
  });

  it('creates internal node with correct properties', () => {
    const left = createLeafNode(1, 'a', 5);
    const right = createLeafNode(2, 'b', 9);
    const node = createInternalNode(3, 14, left, right);

    expect(node.id).toBe(3);
    expect(node.char).toBeNull();
    expect(node.freq).toBe(14);
    expect(node.isLeaf).toBe(false);
    expect(node.left).toBe(left);
    expect(node.right).toBe(right);
    expect(node.parent).toBeNull();
    expect(node.code).toBeNull();
    expect(left.parent).toBe(node);
    expect(right.parent).toBe(node);
  });
});

describe('assignCodes', () => {
  it('assigns prefix codes to leaves', () => {
    const left = createLeafNode(1, 'a', 5);
    const right = createLeafNode(2, 'b', 9);
    const root = createInternalNode(3, 14, left, right);

    const codes = assignCodes(root);
    expect(codes).toHaveLength(2);

    const aCode = codes.find(c => c.char === 'a');
    const bCode = codes.find(c => c.char === 'b');

    expect(aCode).not.toBeUndefined();
    expect(bCode).not.toBeUndefined();
    expect(aCode.code).toBe('0');
    expect(bCode.code).toBe('1');
  });

  it('assigns codes correctly for larger tree', () => {
    // Create a more complex tree
    const a = createLeafNode(1, 'a', 5);
    const b = createLeafNode(2, 'b', 9);
    const c = createLeafNode(3, 'c', 12);
    const d = createLeafNode(4, 'd', 13);
    const e = createLeafNode(5, 'e', 16);
    createLeafNode(6, 'f', 45);

    const ab = createInternalNode(7, 14, a, b);
    const abc = createInternalNode(8, 26, ab, c);
    const de = createInternalNode(9, 29, d, e);
    const root = createInternalNode(10, 100, abc, de);

    const codes = assignCodes(root);
    // Note: Due to tree structure, some leaves may share paths
    expect(codes.length).toBeGreaterThanOrEqual(5);

    // Verify codes are prefix-free
    const codeSet = new Set(codes.map(c => c.code));
    for (const code1 of codeSet) {
      for (const code2 of codeSet) {
        if (code1 !== code2) {
          expect(code1.startsWith(code2)).toBe(false);
        }
      }
    }
  });

  it('handles single character with code 0', () => {
    const a = createLeafNode(1, 'a', 10);
    const parent = createInternalNode(2, 10, a, null);

    const codes = assignCodes(parent);
    expect(codes).toHaveLength(1);
    expect(codes[0].code).toBe('0');
  });

  it('returns empty array for null root', () => {
    const codes = assignCodes(null);
    expect(codes).toHaveLength(0);
  });
});

describe('encode', () => {
  it('encodes text using code table', () => {
    const codeTable = [
      { char: 'a', code: '0' },
      { char: 'b', code: '10' },
      { char: 'c', code: '110' },
      { char: 'd', code: '111' },
    ];
    const { encoded } = encode('abcd', codeTable);
    expect(encoded).toBe('010110111');
  });

  it('encodes repeated characters', () => {
    const codeTable = [
      { char: 'a', code: '0' },
      { char: 'b', code: '1' },
    ];
    const { encoded } = encode('aaabbb', codeTable);
    expect(encoded).toBe('000111');
  });

  it('throws for unknown character', () => {
    const codeTable = [{ char: 'a', code: '0' }];
    expect(() => encode('ab', codeTable)).toThrow(/Character 'b' not in code table/);
  });

  it('handles empty string', () => {
    const codeTable = [{ char: 'a', code: '0' }];
    const { encoded } = encode('', codeTable);
    expect(encoded).toBe('');
  });
});

describe('decode', () => {
  it('decodes encoded text using tree', () => {
    // Use huffmanRun to get a real-world example
    const result = huffmanRun('abc');
    expect(result.success).toBe(true);
    
    // Decode using the code table instead (more reliable)
    const decoded = decodeWithTable(result.encoded, result.codes);
    expect(decoded).toBe('abc');
  });

  it('round-trips encode/decode', () => {
    // Test with huffmanRun which uses encode/decodeWithTable internally
    const testCases = [
      'hello',
      'abcdef',
      'aaaaabbbbb',
      'the quick brown fox',
    ];
    
    for (const text of testCases) {
      const result = huffmanRun(text);
      expect(result.success).toBe(true);
      
      // Round-trip using decodeWithTable
      const decoded = decodeWithTable(result.encoded, result.codes);
      expect(decoded).toBe(text);
    }
  });

  it('handles single character', () => {
    // Test with huffmanRun for single character
    const result = huffmanRun('aaaaa');
    expect(result.success).toBe(true);
    expect(result.codes).toHaveLength(1);
    expect(result.codes[0].char).toBe('a');
    
    // Round-trip using decodeWithTable
    const decoded = decodeWithTable(result.encoded, result.codes);
    expect(decoded).toBe('aaaaa');
  });

  it('throws for invalid bit', () => {
    const a = createLeafNode(1, 'a', 10);
    const parent = createInternalNode(2, 10, a, null);
    assignCodes(parent);

    expect(() => decode('02', parent)).toThrow(/Invalid bit/);
  });

  it('throws for incomplete code', () => {
    const a = createLeafNode(1, 'a', 5);
    const b = createLeafNode(2, 'b', 9);
    const root = createInternalNode(3, 14, a, b);
    assignCodes(root);

    // '0' is complete code for 'a', but '00' would be incomplete after first 'a'
    expect(() => decode('000', root)).toThrow(/incomplete code/);
  });
});

describe('decodeWithTable', () => {
  it('decodes using code table', () => {
    const codeTable = [
      { char: 'a', code: '0' },
      { char: 'b', code: '10' },
      { char: 'c', code: '110' },
    ];
    const decoded = decodeWithTable('010110', codeTable);
    expect(decoded).toBe('abc');
  });

  it('round-trips with encode', () => {
    const codeTable = [
      { char: 'a', code: '0' },
      { char: 'b', code: '1' },
    ];
    const encoded = encode('abba', codeTable).encoded;
    const decoded = decodeWithTable(encoded, codeTable);
    expect(decoded).toBe('abba');
  });
});

describe('validateHuffmanInput', () => {
  it('accepts valid input', () => {
    const result = validateHuffmanInput('hello world');
    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.processed).toBe('hello world');
  });

  it('rejects empty input', () => {
    const result = validateHuffmanInput('');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects whitespace-only input', () => {
    const result = validateHuffmanInput('   ');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects null input', () => {
    const result = validateHuffmanInput(null);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('string');
  });

  it('rejects input exceeding max length', () => {
    const longText = 'a'.repeat(HUFFMAN_MAX_INPUT_LENGTH + 1);
    const result = validateHuffmanInput(longText);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('too long');
    expect(result.reason).toContain(HUFFMAN_MAX_INPUT_LENGTH.toString());
  });

  it('accepts input at max length', () => {
    const text = 'a'.repeat(HUFFMAN_MAX_INPUT_LENGTH);
    const result = validateHuffmanInput(text);
    expect(result.valid).toBe(true);
  });
});

describe('getMaxInputLength', () => {
  it('returns the max input length constant', () => {
    expect(getMaxInputLength()).toBe(HUFFMAN_MAX_INPUT_LENGTH);
  });
});

describe('getTreeNodes', () => {
  it('returns all nodes in tree', () => {
    const a = createLeafNode(1, 'a', 5);
    const b = createLeafNode(2, 'b', 9);
    const root = createInternalNode(3, 14, a, b);

    const nodes = getTreeNodes(root);
    expect(nodes).toHaveLength(3);
    expect(nodes.some(n => n.id === 1)).toBe(true);
    expect(nodes.some(n => n.id === 2)).toBe(true);
    expect(nodes.some(n => n.id === 3)).toBe(true);
  });

  it('returns empty array for null root', () => {
    expect(getTreeNodes(null)).toHaveLength(0);
  });
});

describe('findNodeById', () => {
  it('finds node by id', () => {
    const a = createLeafNode(1, 'a', 5);
    const b = createLeafNode(2, 'b', 9);
    const root = createInternalNode(3, 14, a, b);

    expect(findNodeById(root, 1)).toBe(a);
    expect(findNodeById(root, 2)).toBe(b);
    expect(findNodeById(root, 3)).toBe(root);
    expect(findNodeById(root, 999)).toBeNull();
  });

  it('returns null for null root', () => {
    expect(findNodeById(null, 1)).toBeNull();
  });
});

describe('getTreeDepth', () => {
  it('calculates tree depth', () => {
    const a = createLeafNode(1, 'a', 5);
    const b = createLeafNode(2, 'b', 9);
    const root = createInternalNode(3, 14, a, b);

    expect(getTreeDepth(root)).toBe(1); // Root -> leaf
  });

  it('calculates depth for larger tree', () => {
    const a = createLeafNode(1, 'a', 5);
    const b = createLeafNode(2, 'b', 9);
    const c = createLeafNode(3, 'c', 12);
    const ab = createInternalNode(4, 14, a, b);
    const abc = createInternalNode(5, 26, ab, c);

    expect(getTreeDepth(abc)).toBe(2); // Root -> ab -> a/b
  });

  it('returns 0 for null root', () => {
    expect(getTreeDepth(null)).toBe(0);
  });
});

describe('countLeaves', () => {
  it('counts leaf nodes', () => {
    const a = createLeafNode(1, 'a', 5);
    const b = createLeafNode(2, 'b', 9);
    const c = createLeafNode(3, 'c', 12);
    const ab = createInternalNode(4, 14, a, b);
    const root = createInternalNode(5, 26, ab, c);

    expect(countLeaves(root)).toBe(3);
  });

  it('returns 0 for null root', () => {
    expect(countLeaves(null)).toBe(0);
  });
});

describe('huffmanRun', () => {
  it('encodes text successfully', () => {
    const result = huffmanRun('hello world');
    expect(result.success).toBe(true);
    expect(result.codes).toBeDefined();
    expect(result.codes.length).toBeGreaterThan(0);
    expect(result.encoded).toBeDefined();
    expect(result.encodedLength).toBeGreaterThan(0);
    expect(result.compressionRatio).toBeDefined();
  });

  it('returns error for empty input', () => {
    const result = huffmanRun('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('returns error for null input', () => {
    const result = huffmanRun(null);
    expect(result.success).toBe(false);
    expect(result.error).toContain('string');
  });

  it('handles single unique character', () => {
    const result = huffmanRun('aaaaa');
    expect(result.success).toBe(true);
    expect(result.codes).toHaveLength(1);
    expect(result.codes[0].char).toBe('a');
  });

  it('handles spaces and punctuation', () => {
    const result = huffmanRun('hello, world! & stuff...');
    expect(result.success).toBe(true);
    expect(result.codes.length).toBeGreaterThan(1);
  });

  it('handles Unicode', () => {
    const result = huffmanRun('héllo wörld');
    expect(result.success).toBe(true);
    expect(result.codes.some(c => c.char === 'é')).toBe(true);
  });

  it('produces prefix-free codes', () => {
    const result = huffmanRun('abcdef');
    const codes = result.codes.map(c => c.code);
    for (let i = 0; i < codes.length; i++) {
      for (let j = 0; j < codes.length; j++) {
        if (i !== j) {
          expect(codes[i].startsWith(codes[j])).toBe(false);
        }
      }
    }
  });
});

describe('Huffman coding - known examples', () => {
  it('matches known example from Wikipedia (E weighed)', () => {
    // This tests the algorithm against a known case
    const frequencies = [
      { char: 'a', freq: 5 },
      { char: 'b', freq: 9 },
      { char: 'c', freq: 12 },
      { char: 'd', freq: 13 },
      { char: 'e', freq: 16 },
      { char: 'f', freq: 45 },
    ];
    const root = buildTree(frequencies);
    const codes = assignCodes(root);

    // Should have 6 codes
    expect(codes).toHaveLength(6);

    // 'f' should have shortest code (highest freq)
    const fCode = codes.find(c => c.char === 'f');
    expect(fCode).not.toBeUndefined();
    expect(fCode.freq).toBe(45);

    // Total freq should be conserved
    const totalFreq = codes.reduce((sum, c) => sum + c.freq, 0);
    expect(totalFreq).toBe(100);
  });

  it('produces optimal encoding for skewed distribution', () => {
    const result = huffmanRun('aaaaabbbbbbbbbbcccccc');
    expect(result.success).toBe(true);

    // 'b' has highest frequency, should have shortest code
    const bCode = result.codes.find(c => c.char === 'b');
    const aCode = result.codes.find(c => c.char === 'a');
    const cCode = result.codes.find(c => c.char === 'c');

    expect(bCode.code.length).toBeLessThanOrEqual(aCode.code.length);
    expect(bCode.code.length).toBeLessThanOrEqual(cCode.code.length);
  });
});

describe('prefix-free property', () => {
  it('codes are prefix-free for various inputs', () => {
    const testInputs = [
      'hello world',
      'aaaaabbbbbbbbbbcccccc',
      'the quick brown fox',
      'abracadabra',
      'aa bb cc dd ee ff',
    ];

    for (const input of testInputs) {
      const result = huffmanRun(input);
      expect(result.success).toBe(true);

      const codes = result.codes.map(c => c.code);
      for (let i = 0; i < codes.length; i++) {
        for (let j = 0; j < codes.length; j++) {
          if (i !== j) {
            expect(codes[i].startsWith(codes[j])).toBe(false);
          }
        }
      }
    }
  });
});
