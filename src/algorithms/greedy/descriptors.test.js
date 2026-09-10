import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  huffmanDescriptors,
  activityDescriptors,
  fractionalKnapsackDescriptors,
  greedyDescriptors,
} from './descriptors';
import {
  ALL_DESCRIPTORS,
  getByCategory,
  getAlgorithm,
  getAlgorithmSafe,
  getAlgorithmForDisplay,
  getWithDebug,
} from '../registry';
import { DOMAINS } from '../registry';

describe('greedy descriptors', () => {
  it('huffmanDescriptors has exactly one descriptor with required fields', () => {
    expect(huffmanDescriptors.length).toBe(1);
    const d = huffmanDescriptors[0];
    expect(d.id).toBe('huffman-coding');
    expect(d.name).toBe('Huffman Coding');
    expect(d.category).toBe('greedy');
    expect(typeof d.color).toBe('string');
    expect(d.complexity).toHaveProperty('worst');
    expect(Array.isArray(d.codeLines)).toBe(true);
    expect(d.codeLines.length).toBeGreaterThan(0);
    expect(typeof d.pseudocode).toBe('string');
    expect(typeof d.description).toBe('string');
    expect(d.defaultInput).toBeDefined();
  });

  it('activityDescriptors has exactly one descriptor with required fields', () => {
    expect(activityDescriptors.length).toBe(1);
    const d = activityDescriptors[0];
    expect(d.id).toBe('activity-selection');
    expect(d.name).toBe('Activity Selection');
    expect(d.category).toBe('greedy');
    expect(typeof d.color).toBe('string');
    expect(d.complexity).toHaveProperty('worst');
    expect(Array.isArray(d.codeLines)).toBe(true);
    expect(typeof d.pseudocode).toBe('string');
    expect(typeof d.description).toBe('string');
    expect(d.defaultInput).toBeDefined();
  });

  it('fractionalKnapsackDescriptors has exactly one descriptor with required fields', () => {
    expect(fractionalKnapsackDescriptors.length).toBe(1);
    const d = fractionalKnapsackDescriptors[0];
    expect(d.id).toBe('fractional-knapsack');
    expect(d.name).toBe('Fractional Knapsack');
    expect(d.category).toBe('greedy');
    expect(typeof d.color).toBe('string');
    expect(d.complexity).toHaveProperty('worst');
    expect(Array.isArray(d.codeLines)).toBe(true);
    expect(typeof d.pseudocode).toBe('string');
    expect(typeof d.description).toBe('string');
    expect(d.defaultInput).toBeDefined();
  });

  it('greedyDescriptors combines all three', () => {
    expect(greedyDescriptors.length).toBe(3);
    const ids = greedyDescriptors.map(d => d.id);
    expect(ids).toContain('huffman-coding');
    expect(ids).toContain('activity-selection');
    expect(ids).toContain('fractional-knapsack');
  });
});

describe('greedy registry integration', () => {
  it('greedy descriptors appear in ALL_DESCRIPTORS', () => {
    const allIds = ALL_DESCRIPTORS.map(d => d.id);
    expect(allIds).toContain('huffman-coding');
    expect(allIds).toContain('activity-selection');
    expect(allIds).toContain('fractional-knapsack');
  });

  it('greedy domain appears in DOMAINS', () => {
    const greedyDomain = DOMAINS.find(d => d.id === 'greedy');
    expect(greedyDomain).toBeDefined();
    expect(greedyDomain.label).toBe('Greedy Algorithms');
    expect(Array.isArray(greedyDomain.subTabs)).toBe(true);
    expect(greedyDomain.subTabs).toContain('debugger');
  });

  it('getByCategory returns greedy algorithms', () => {
    const greedy = getByCategory('greedy');
    expect(greedy.length).toBe(3);
    const ids = greedy.map(d => d.id);
    expect(ids).toContain('huffman-coding');
    expect(ids).toContain('activity-selection');
    expect(ids).toContain('fractional-knapsack');
  });

  it('getAlgorithm retrieves greedy algorithms by id', () => {
    const huffman = getAlgorithm('huffman-coding');
    expect(huffman.id).toBe('huffman-coding');
    expect(huffman.name).toBe('Huffman Coding');

    const activity = getAlgorithm('activity-selection');
    expect(activity.id).toBe('activity-selection');
    expect(activity.name).toBe('Activity Selection');

    const fk = getAlgorithm('fractional-knapsack');
    expect(fk.id).toBe('fractional-knapsack');
    expect(fk.name).toBe('Fractional Knapsack');
  });

  it('getAlgorithm throws for unknown greedy ids', () => {
    expect(() => getAlgorithm('bogus-greedy')).toThrow(/Unknown algorithm/);
  });

  it('getAlgorithmSafe returns null for unknown ids', () => {
    expect(getAlgorithmSafe('bogus-greedy')).toBeNull();
  });

  it('getAlgorithmForDisplay returns a stub for unknown ids', () => {
    const stub = getAlgorithmForDisplay('bogus-greedy');
    expect(stub.id).toBe('bogus-greedy');
    expect(typeof stub.name).toBe('string');
    expect(stub.category).toBe('unknown');
    expect(typeof stub.color).toBe('string');
    expect(stub.codeLines).toEqual([]);
    // pseudocode can be a string or object depending on the implementation
    expect(stub.pseudocode).toBeDefined();
  });

  it('all greedy algorithms have debug/steps/run implemented', () => {
    const huffman = getAlgorithm('huffman-coding');
    expect(typeof huffman.debug).toBe('function');
    expect(typeof huffman.steps).toBe('function');
    expect(typeof huffman.run).toBe('function');

    const activity = getAlgorithm('activity-selection');
    expect(typeof activity.debug).toBe('function');
    expect(typeof activity.steps).toBe('function');
    expect(typeof activity.run).toBe('function');

    const fk = getAlgorithm('fractional-knapsack');
    expect(typeof fk.debug).toBe('function');
    expect(typeof fk.steps).toBe('function');
    expect(typeof fk.run).toBe('function');
  });

  it('getWithDebug returns all greedy algorithms', () => {
    const greedyWithDebug = getWithDebug(['greedy']);
    expect(greedyWithDebug.length).toBe(3);
    const ids = greedyWithDebug.map(d => d.id);
    expect(ids).toContain('huffman-coding');
    expect(ids).toContain('activity-selection');
    expect(ids).toContain('fractional-knapsack');
  });
});

describe('greedy descriptor codeLines and pseudocode', () => {
  it('huffman codeLines and pseudocode are meaningful', () => {
    const d = getAlgorithm('huffman-coding');
    expect(d.codeLines.length).toBeGreaterThan(0);
    expect(d.codeLines[0].code).toContain('Huffman');
    expect(d.pseudocode.length).toBeGreaterThan(0);
    expect(d.pseudocode).toContain('HuffmanCoding');
    expect(d.pseudocode).toContain('priority queue');
  });

  it('activity codeLines and pseudocode are meaningful', () => {
    const d = getAlgorithm('activity-selection');
    expect(d.codeLines.length).toBeGreaterThan(0);
    expect(d.codeLines[0].code).toContain('Activity selection');
    expect(d.pseudocode.length).toBeGreaterThan(0);
    expect(d.pseudocode).toContain('ActivitySelection');
    expect(d.pseudocode).toContain('finish time');
  });

  it('fractional knapsack codeLines and pseudocode are meaningful', () => {
    const d = getAlgorithm('fractional-knapsack');
    expect(d.codeLines.length).toBeGreaterThan(0);
    expect(d.codeLines[0].code).toContain('Fractional knapsack');
    expect(d.pseudocode.length).toBeGreaterThan(0);
    expect(d.pseudocode).toContain('FractionalKnapsack');
    expect(d.pseudocode).toContain('value/weight');
  });
});
