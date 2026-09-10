import { describe, expect, it } from 'vitest';
import {
  validateFractionalKnapsackInput,
  sortByRatio,
  fractionalKnapsack,
  fractionalKnapsackRun,
  generateRandomItems,
  getDefaultKnapsack,
  FRACTIONAL_KNAPSACK_MAX_ITEMS,
  FRACTIONAL_KNAPSACK_MAX_CAPACITY,
  getMaxItemsCount,
  getMaxCapacity,
} from './fractionalKnapsack';

describe('validateFractionalKnapsackInput', () => {
  it('accepts valid input', () => {
    const items = [
      { weight: 10, value: 60 },
      { weight: 20, value: 100 },
    ];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.processed.items).toHaveLength(2);
    expect(result.processed.capacity).toBe(50);
  });

  it('rejects empty items array', () => {
    const result = validateFractionalKnapsackInput([], 50);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects non-array items', () => {
    const result = validateFractionalKnapsackInput(null, 50);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('array');
  });

  it('rejects excessive item count', () => {
    const items = Array.from({ length: FRACTIONAL_KNAPSACK_MAX_ITEMS + 1 }, (_, i) => ({
      weight: i + 1,
      value: i + 1,
    }));
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Too many');
    expect(result.reason).toContain(FRACTIONAL_KNAPSACK_MAX_ITEMS.toString());
  });

  it('accepts items at max count', () => {
    const items = Array.from({ length: FRACTIONAL_KNAPSACK_MAX_ITEMS }, (_, i) => ({
      weight: i + 1,
      value: i + 1,
    }));
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid capacity', () => {
    const items = [{ weight: 10, value: 60 }];
    expect(validateFractionalKnapsackInput(items, 0).valid).toBe(false);
    expect(validateFractionalKnapsackInput(items, -1).valid).toBe(false);
    expect(validateFractionalKnapsackInput(items, null).valid).toBe(false);
  });

  it('rejects excessive capacity', () => {
    const items = [{ weight: 10, value: 60 }];
    const result = validateFractionalKnapsackInput(items, FRACTIONAL_KNAPSACK_MAX_CAPACITY + 1);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('too large');
  });

  it('accepts capacity at max', () => {
    const items = [{ weight: 10, value: 60 }];
    const result = validateFractionalKnapsackInput(items, FRACTIONAL_KNAPSACK_MAX_CAPACITY);
    expect(result.valid).toBe(true);
  });

  it('rejects item with non-positive weight', () => {
    const items = [{ weight: 0, value: 60 }];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('weight');
  });

  it('rejects item with negative weight', () => {
    const items = [{ weight: -5, value: 60 }];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.valid).toBe(false);
  });

  it('rejects item with negative value', () => {
    const items = [{ weight: 10, value: -10 }];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('value');
  });

  it('accepts item with zero value', () => {
    const items = [{ weight: 10, value: 0 }];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.valid).toBe(true);
  });

  it('calculates ratio correctly', () => {
    const items = [{ weight: 10, value: 60 }];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.processed.items[0].ratio).toBe(6);
  });

  it('assigns unique IDs', () => {
    const items = [
      { weight: 10, value: 60 },
      { weight: 20, value: 100 },
    ];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.processed.items[0].id).toBe(0);
    expect(result.processed.items[1].id).toBe(1);
  });

  it('preserves names if provided', () => {
    const items = [
      { weight: 10, value: 60, name: 'Gold' },
      { weight: 20, value: 100, name: 'Silver' },
    ];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.processed.items[0].name).toBe('Gold');
    expect(result.processed.items[1].name).toBe('Silver');
  });

  it('adds default names if not provided', () => {
    const items = [{ weight: 10, value: 60 }];
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.processed.items[0].name).toBe('Item 0');
  });

  it('handles division by zero (zero weight)', () => {
    const items = [{ weight: 0, value: 60 }];
    // Should be rejected
    const result = validateFractionalKnapsackInput(items, 50);
    expect(result.valid).toBe(false);
  });
});

describe('sortByRatio', () => {
  it('sorts items by ratio descending', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
      { id: 2, weight: 30, value: 120, ratio: 4, name: 'C' },
    ];
    const sorted = sortByRatio(items);
    expect(sorted[0].ratio).toBe(6);
    expect(sorted[1].ratio).toBe(5);
    expect(sorted[2].ratio).toBe(4);
  });

  it('returns new array (does not mutate original)', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6 },
      { id: 1, weight: 20, value: 100, ratio: 5 },
    ];
    const original = [...items];
    sortByRatio(items);
    expect(items).toEqual(original);
  });

  it('handles empty array', () => {
    const result = sortByRatio([]);
    expect(result).toHaveLength(0);
  });

  it('handles single item', () => {
    const items = [{ id: 0, weight: 10, value: 60, ratio: 6 }];
    const sorted = sortByRatio(items);
    expect(sorted).toHaveLength(1);
  });

  it('handles items with same ratio', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6 },
      { id: 1, weight: 20, value: 120, ratio: 6 },
    ];
    const sorted = sortByRatio(items);
    expect(sorted.length).toBe(2);
    expect(sorted[0].ratio).toBe(6);
    expect(sorted[1].ratio).toBe(6);
  });
});

describe('fractionalKnapsack', () => {
  it('takes entire items when they fit', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
    ];
    const result = fractionalKnapsack(items, 50);
    expect(result.selected).toHaveLength(2);
    expect(result.selected[0].full).toBe(true);
    expect(result.selected[1].full).toBe(true);
    expect(result.totalValue).toBe(160);
    expect(result.remainingCapacity).toBe(20);
  });

  it('takes fraction when item does not fit', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
      { id: 2, weight: 30, value: 120, ratio: 4, name: 'C' },
    ];
    const result = fractionalKnapsack(items, 50);
    expect(result.selected).toHaveLength(3);
    expect(result.selected[0].full).toBe(true);
    expect(result.selected[1].full).toBe(true);
    expect(result.selected[2].full).toBe(false);
    expect(result.selected[2].fraction).toBe(20 / 30);
    expect(result.totalValue).toBeCloseTo(60 + 100 + (120 * 20 / 30));
    expect(result.remainingCapacity).toBe(0);
  });

  it('handles item heavier than capacity', () => {
    const items = [
      { id: 0, weight: 100, value: 600, ratio: 6, name: 'A' },
    ];
    const result = fractionalKnapsack(items, 50);
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0].full).toBe(false);
    expect(result.selected[0].fraction).toBe(0.5);
    expect(result.totalValue).toBe(300);
    expect(result.remainingCapacity).toBe(0);
  });

  it('handles exact capacity match', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
      { id: 2, weight: 20, value: 120, ratio: 6, name: 'C' },
    ];
    const result = fractionalKnapsack(items, 50);
    expect(result.remainingCapacity).toBe(0);
  });

  it('handles single item', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
    ];
    const result = fractionalKnapsack(items, 5);
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0].fraction).toBe(0.5);
    expect(result.totalValue).toBe(30);
  });

  it('handles empty items', () => {
    const result = fractionalKnapsack([], 50);
    expect(result.selected).toHaveLength(0);
    expect(result.totalValue).toBe(0);
    expect(result.remainingCapacity).toBe(50);
  });

  it('handles zero capacity', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
    ];
    const result = fractionalKnapsack(items, 0);
    expect(result.selected).toHaveLength(0);
    expect(result.totalValue).toBe(0);
    expect(result.remainingCapacity).toBe(0);
  });

  it('selects items in ratio order', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
      { id: 2, weight: 30, value: 120, ratio: 4, name: 'C' },
    ];
    const result = fractionalKnapsack(items, 50);
    // Should take A (full), B (full), then part of C
    expect(result.selected).toHaveLength(3);
    expect(result.selected[0].item.id).toBe(0);
    expect(result.selected[1].item.id).toBe(1);
    expect(result.selected[2].item.id).toBe(2);
    expect(result.selected[0].full).toBe(true);
    expect(result.selected[1].full).toBe(true);
    expect(result.selected[2].full).toBe(false);
  });

  it('calculates total value correctly', () => {
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
    ];
    const result = fractionalKnapsack(items, 15);
    // Take A fully (10, 60), then 5/20 of B (25 value)
    expect(result.totalValue).toBe(85);
  });
});

describe('fractionalKnapsackRun', () => {
  it('runs successfully with valid input', () => {
    const items = [
      { weight: 10, value: 60 },
      { weight: 20, value: 100 },
    ];
    const result = fractionalKnapsackRun(items, 50);
    expect(result.success).toBe(true);
    expect(result.selected).toBeDefined();
    expect(result.totalValue).toBeDefined();
  });

  it('returns error for invalid input', () => {
    const result = fractionalKnapsackRun(null, 50);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error for empty items', () => {
    const result = fractionalKnapsackRun([], 50);
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('returns error for invalid capacity', () => {
    const result = fractionalKnapsackRun([{ weight: 10, value: 60 }], 0);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error for negative value', () => {
    const result = fractionalKnapsackRun([{ weight: 10, value: -10 }], 50);
    expect(result.success).toBe(false);
    expect(result.error).toContain('value');
  });
});

describe('generateRandomItems', () => {
  it('generates correct number of items', () => {
    const items = generateRandomItems(10, 50);
    expect(items).toHaveLength(10);
  });

  it('generates items with valid weights and values', () => {
    const items = generateRandomItems(5, 50);
    for (const item of items) {
      expect(item.weight).toBeGreaterThan(0);
      expect(item.weight).toBeLessThanOrEqual(50);
      expect(item.value).toBeGreaterThan(0);
    }
  });

  it('is deterministic with same seed', () => {
    const items1 = generateRandomItems(5, 50, 42);
    const items2 = generateRandomItems(5, 50, 42);
    expect(items1).toEqual(items2);
  });

  it('different seeds produce different items', () => {
    const items1 = generateRandomItems(5, 50, 42);
    const items2 = generateRandomItems(5, 50, 100);
    expect(items1).not.toEqual(items2);
  });

  it('calculates ratios correctly', () => {
    const items = generateRandomItems(5, 50);
    for (const item of items) {
      expect(item.ratio).toBeCloseTo(item.value / item.weight);
    }
  });

  it('items have default names', () => {
    const items = generateRandomItems(3, 50);
    expect(items[0].name).toBe('Item 0');
    expect(items[1].name).toBe('Item 1');
  });
});

describe('getDefaultKnapsack', () => {
  it('returns 3 items', () => {
    const { items } = getDefaultKnapsack();
    expect(items).toHaveLength(3);
  });

  it('returns capacity 50', () => {
    const { capacity } = getDefaultKnapsack();
    expect(capacity).toBe(50);
  });

  it('returns items with correct structure', () => {
    const { items } = getDefaultKnapsack();
    for (const item of items) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('weight');
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('ratio');
      expect(item).toHaveProperty('name');
    }
  });

  it('has expected default values', () => {
    const { items } = getDefaultKnapsack();
    expect(items[0].weight).toBe(10);
    expect(items[0].value).toBe(60);
    expect(items[0].ratio).toBe(6);
    expect(items[1].weight).toBe(20);
    expect(items[1].value).toBe(100);
    expect(items[1].ratio).toBe(5);
    expect(items[2].weight).toBe(30);
    expect(items[2].value).toBe(120);
    expect(items[2].ratio).toBe(4);
  });
});

describe('getMaxItemsCount and getMaxCapacity', () => {
  it('getMaxItemsCount returns FRACTIONAL_KNAPSACK_MAX_ITEMS', () => {
    expect(getMaxItemsCount()).toBe(FRACTIONAL_KNAPSACK_MAX_ITEMS);
  });

  it('getMaxCapacity returns FRACTIONAL_KNAPSACK_MAX_CAPACITY', () => {
    expect(getMaxCapacity()).toBe(FRACTIONAL_KNAPSACK_MAX_CAPACITY);
  });
});

describe('Fractional Knapsack optimality', () => {
  it('greedy approach is optimal for fractional case', () => {
    // Classic example from CLRS
    const items = [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
      { id: 2, weight: 30, value: 120, ratio: 4, name: 'C' },
    ];
    const result = fractionalKnapsackRun(items, 50);
    expect(result.success).toBe(true);

    // Should take A (full), B (full), and 20/30 of C
    // Total value = 60 + 100 + (120 * 20/30) = 60 + 100 + 80 = 240
    expect(result.totalValue).toBeCloseTo(240);
  });

  it('handles zero-value items', () => {
    const items = [
      { id: 0, weight: 10, value: 0, ratio: 0, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
    ];
    const result = fractionalKnapsackRun(items, 30);
    expect(result.success).toBe(true);
    // Should take B first (higher ratio), but will take A too if capacity allows
    expect(result.totalValue).toBeGreaterThan(0);
  });

  it('handles items sorted in different order', () => {
    // Items not sorted by ratio
    const items = [
      { id: 0, weight: 30, value: 120, ratio: 4, name: 'C' },
      { id: 1, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 2, weight: 20, value: 100, ratio: 5, name: 'B' },
    ];
    const result = fractionalKnapsackRun(items, 50);
    expect(result.success).toBe(true);
    // Despite unsorted input, should still get optimal value
    // The algorithm sorts by ratio internally
  });
});

describe('Floating-point precision', () => {
  it('handles fractional values correctly', () => {
    const items = [
      { id: 0, weight: 3, value: 10, ratio: 10 / 3, name: 'A' },
    ];
    const result = fractionalKnapsackRun(items, 1);
    expect(result.success).toBe(true);
    // Take 1/3 of item A: value = 10 * (1/3) = 3.333...
    expect(result.totalValue).toBeCloseTo(10 / 3, 2);
  });

  it('handles many small fractions', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      weight: 10,
      value: 10,
      ratio: 1,
      name: `Item ${i}`,
    }));
    const result = fractionalKnapsackRun(items, 5);
    expect(result.success).toBe(true);
    // Take 5/10 of first item
    expect(result.totalValue).toBeCloseTo(5);
  });
});
