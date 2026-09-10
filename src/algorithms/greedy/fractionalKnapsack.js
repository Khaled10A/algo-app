/**
 * Fractional Knapsack implementation.
 *
 * Standard greedy fractional knapsack algorithm.
 * Time: O(n log n) for sorting, O(n) for selection = O(n log n) total.
 * Space: O(n) for storing items and solution.
 *
 * Educational contrast with 0/1 Knapsack:
 * - Fractional Knapsack: items can be partially taken, greedy by value/weight ratio
 * - 0/1 Knapsack: items taken or not, requires dynamic programming
 *
 * This module also provides a `debug(items, capacity)` function that generates a full
 * event stream for visualization in the debugger tab.
 */

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

/** @typedef {{ id: number; weight: number; value: number; ratio: number; name?: string }} Item */
/** @typedef {{ id: number; weight: number; value: number; ratio: number; taken?: number; fraction?: number; full?: boolean; name?: string }} ItemWithStatus */

// -------------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------------

/** Maximum item count for visualization. */
export const FRACTIONAL_KNAPSACK_MAX_ITEMS = 30;

/** Maximum capacity for visualization. */
export const FRACTIONAL_KNAPSACK_MAX_CAPACITY = 1000;

/**
 * Validate Fractional Knapsack input.
 * @param {Array<{ weight: number; value: number }>} items
 * @param {number} capacity
 * @returns {{ valid: boolean; reason: string | null; processed: { items: Array<Item>; capacity: number } }}
 */
export function validateFractionalKnapsackInput(items, capacity) {
  if (!Array.isArray(items)) {
    return { valid: false, reason: 'Items must be an array.', processed: null };
  }

  if (items.length === 0) {
    return { valid: false, reason: 'Items list is empty.', processed: null };
  }

  if (items.length > FRACTIONAL_KNAPSACK_MAX_ITEMS) {
    return {
      valid: false,
      reason: `Too many items (${items.length}). Maximum is ${FRACTIONAL_KNAPSACK_MAX_ITEMS} for visualization.`,
      processed: null,
    };
  }

  if (typeof capacity !== 'number' || capacity <= 0) {
    return { valid: false, reason: 'Capacity must be a positive number.', processed: null };
  }

  if (capacity > FRACTIONAL_KNAPSACK_MAX_CAPACITY) {
    return {
      valid: false,
      reason: `Capacity too large (${capacity}). Maximum is ${FRACTIONAL_KNAPSACK_MAX_CAPACITY} for visualization.`,
      processed: null,
    };
  }

  const processed = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item.weight !== 'number' || typeof item.value !== 'number') {
      return {
        valid: false,
        reason: `Item at index ${i} is invalid. Each item must have numeric weight and value.`,
        processed: null,
      };
    }
    if (item.weight <= 0) {
      return {
        valid: false,
        reason: `Item at index ${i} has non-positive weight (${item.weight}). Weight must be > 0.`,
        processed: null,
      };
    }
    if (item.value < 0) {
      return {
        valid: false,
        reason: `Item at index ${i} has negative value (${item.value}). Value must be >= 0.`,
        processed: null,
      };
    }

    // Calculate ratio, handling zero-weight items gracefully
    const ratio = item.weight === 0 ? Infinity : item.value / item.weight;

    processed.push({
      id: i,
      weight: item.weight,
      value: item.value,
      ratio: ratio,
      name: item.name || `Item ${i}`,
    });
  }

  return { valid: true, reason: null, processed: { items: processed, capacity } };
}

/** @returns {number} */
export function getMaxItemsCount() {
  return FRACTIONAL_KNAPSACK_MAX_ITEMS;
}

/** @returns {number} */
export function getMaxCapacity() {
  return FRACTIONAL_KNAPSACK_MAX_CAPACITY;
}

// -------------------------------------------------------------------------
// Sorting
// -------------------------------------------------------------------------

/**
 * Sort items by value/weight ratio (descending).
 * @param {Array<Item>} items
 * @returns {Array<Item>}
 */
export function sortByRatio(items) {
  return [...items].sort((a, b) => b.ratio - a.ratio);
}

// -------------------------------------------------------------------------
// Algorithm
// -------------------------------------------------------------------------

/**
 * Run Fractional Knapsack greedy algorithm.
 * @param {Array<Item>} items
 * @param {number} capacity
 * @returns {{ selected: Array<{ item: Item; taken: number; fraction: number; full: boolean }>; totalValue: number; remainingCapacity: number }}
 */
export function fractionalKnapsack(items, capacity) {
  if (items.length === 0 || capacity <= 0) {
    return { selected: [], totalValue: 0, remainingCapacity: capacity };
  }

  const sorted = sortByRatio(items);
  const selected = [];
  let remainingCapacity = capacity;
  let totalValue = 0;

  for (const item of sorted) {
    if (remainingCapacity <= 0) {
      break;
    }

    if (item.weight <= remainingCapacity) {
      // Take the entire item
      const taken = item.weight;
      const fraction = 1;
      const valueGained = item.value;

      selected.push({
        item,
        taken,
        fraction,
        full: true,
      });

      totalValue += valueGained;
      remainingCapacity -= taken;
    } else {
      // Take a fraction of the item
      const fraction = remainingCapacity / item.weight;
      const taken = remainingCapacity;
      const valueGained = item.value * fraction;

      selected.push({
        item,
        taken,
        fraction,
        full: false,
      });

      totalValue += valueGained;
      remainingCapacity = 0;
    }
  }

  return {
    selected,
    totalValue,
    remainingCapacity,
    sortedItems: sorted,
  };
}

// -------------------------------------------------------------------------
// Debug event generation
// -------------------------------------------------------------------------

import {
  createGreedyEvent,
  createGreedyCollector,
} from './greedyEvents';
import { projectGreedyEvents } from './greedySteps';

/**
 * Debug function that generates a full event stream for visualization.
 *
 * @param {Array<{ weight: number; value: number }>} items
 * @param {number} capacity
 * @returns {Array<object>} event stream for projector
 */
export function fractionalKnapsackDebug(items, capacity) {
  const collector = createGreedyCollector();
  let stepCounter = 1;

  // Validate input
  const validation = validateFractionalKnapsackInput(items, capacity);
  if (!validation.valid) {
    return [createGreedyEvent({
      type: 'complete',
      eventId: `e-1`,
      step: 1,
      subproblem: 'error',
      action: validation.reason,
      stateSnapshot: { error: validation.reason },
      meta: { solution: { error: validation.reason } },
    })];
  }

  const { items: validatedItems, capacity: validatedCapacity } = validation.processed;
  const totalItems = validatedItems.length;

  // Step 1: Input received
  collector.emit('enter', {
    counter: stepCounter++,
    subproblem: 'input received',
    action: `enter: ${totalItems} items, capacity ${validatedCapacity}`,
    stateSnapshot: {
      items: validatedItems.map(i => ({ id: i.id, weight: i.weight, value: i.value, ratio: i.ratio, name: i.name })),
      capacity: validatedCapacity,
      totalItems,
    },
    meta: {
      items: validatedItems.map(i => ({ id: i.id, weight: i.weight, value: i.value, ratio: i.ratio, name: i.name })),
      capacity: validatedCapacity,
      totalItems,
    },
  });

  // Step 2: Calculate ratios and sort
  const sorted = sortByRatio(validatedItems);
  collector.emit('update', {
    counter: stepCounter++,
    subproblem: 'sort by value/weight ratio',
    action: `update: sorted ${totalItems} items by ratio (descending)`,
    stateSnapshot: {
      items: sorted.map(i => ({ id: i.id, weight: i.weight, value: i.value, ratio: i.ratio, name: i.name })),
      sortedOrder: sorted.map(i => i.id),
      capacity: validatedCapacity,
      totalItems,
    },
    meta: {
      sortedItems: sorted.map(i => ({ id: i.id, weight: i.weight, value: i.value, ratio: i.ratio, name: i.name })),
      sortOrder: sorted.map(i => i.id),
    },
  });

  // Step 3-5: Consider each item
  let remainingCapacity = validatedCapacity;
  let totalValue = 0;
  const results = [];

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];

    if (remainingCapacity <= 0) {
      break;
    }

    // Consider item
    collector.emit('compare', {
      counter: stepCounter++,
      subproblem: `consider ${item.name}`,
      action: `compare: ${item.name} (weight ${item.weight}, value ${item.value}, ratio ${item.ratio.toFixed(2)})`,
      stateSnapshot: {
        items: sorted.map(j => ({ id: j.id, weight: j.weight, value: j.value, ratio: j.ratio, name: j.name })),
        currentItem: { id: item.id, weight: item.weight, value: item.value, ratio: item.ratio, name: item.name },
        remainingCapacity,
        totalValue,
        capacity: validatedCapacity,
        totalItems,
      },
      meta: {
        currentItem: { id: item.id, weight: item.weight, value: item.value, ratio: item.ratio, name: item.name },
        remainingCapacity,
        itemFits: item.weight <= remainingCapacity,
      },
    });

    if (item.weight <= remainingCapacity) {
      // Take full item
      const valueGained = item.value;
      totalValue += valueGained;
      remainingCapacity -= item.weight;

      results.push({
        ...item,
        taken: item.weight,
        fraction: 1,
        full: true,
      });

      collector.emit('select', {
        counter: stepCounter++,
        subproblem: `take ${item.name} (full)`,
        action: `select: took ${item.name} completely (weight ${item.weight}, value ${item.value})`,
        stateSnapshot: {
          items: sorted.map(j => ({ id: j.id, weight: j.weight, value: j.value, ratio: j.ratio, name: j.name })),
          currentItem: { id: item.id, weight: item.weight, value: item.value, ratio: item.ratio, name: item.name },
          takenAmount: item.weight,
          fraction: 1,
          fullItem: true,
          remainingCapacity,
          totalValue,
          capacity: validatedCapacity,
          totalItems,
        },
        meta: {
          item: { id: item.id, weight: item.weight, value: item.value, ratio: item.ratio, name: item.name },
          taken: item.weight,
          fraction: 1,
          full: true,
          valueGained,
          remainingCapacity,
          totalValue,
        },
      });
    } else {
      // Take fraction
      const fraction = remainingCapacity / item.weight;
      const taken = remainingCapacity;
      const valueGained = item.value * fraction;
      totalValue += valueGained;
      remainingCapacity = 0;

      results.push({
        ...item,
        taken,
        fraction,
        full: false,
      });

      collector.emit('select', {
        counter: stepCounter++,
        subproblem: `take ${item.name} (fraction)`,
        action: `select: took ${fraction.toFixed(2)} of ${item.name} (weight ${taken.toFixed(2)}, value ${valueGained.toFixed(2)})`,
        stateSnapshot: {
          items: sorted.map(j => ({ id: j.id, weight: j.weight, value: j.value, ratio: j.ratio, name: j.name })),
          currentItem: { id: item.id, weight: item.weight, value: item.value, ratio: item.ratio, name: item.name },
          takenAmount: taken,
          fraction,
          fullItem: false,
          remainingCapacity,
          totalValue,
          capacity: validatedCapacity,
          totalItems,
        },
        meta: {
          item: { id: item.id, weight: item.weight, value: item.value, ratio: item.ratio, name: item.name },
          taken,
          fraction,
          full: false,
          valueGained,
          remainingCapacity,
          totalValue,
        },
      });
    }
  }

  // Step 6: Complete
  collector.emit('complete', {
    counter: stepCounter++,
    subproblem: 'complete',
    action: `complete: total value ${totalValue.toFixed(2)}, ${selectedLength(results)} items taken`,
    stateSnapshot: {
      items: sorted.map(j => ({ id: j.id, weight: j.weight, value: j.value, ratio: j.ratio, name: j.name })),
      results: results.map(r => ({
        id: r.id,
        weight: r.weight,
        value: r.value,
        ratio: r.ratio,
        name: r.name,
        taken: r.taken,
        fraction: r.fraction,
        full: r.full,
      })),
      totalValue,
      remainingCapacity,
      capacity: validatedCapacity,
      totalItems,
      itemsTaken: results.length,
    },
    meta: {
      solution: {
        items: results.map(r => ({
          id: r.id,
          weight: r.weight,
          value: r.value,
          ratio: r.ratio,
          name: r.name,
          taken: r.taken,
          fraction: r.fraction,
          full: r.full,
        })),
        totalValue,
        remainingCapacity,
        capacity: validatedCapacity,
        totalItems,
        itemsTaken: results.length,
      },
    },
  });

  return collector.events;
}

/** Helper to count selected items */
function selectedLength(results) {
  return results.length;
}

/**
 * Steps function that projects debug events into debugger snapshots.
 *
 * @param {Array<{ weight: number; value: number }>} items
 * @param {number} capacity
 * @returns {Array<object>} debugger snapshots
 */
export function fractionalKnapsackSteps(items, capacity) {
  const events = fractionalKnapsackDebug(items, capacity);
  return projectGreedyEvents(events);
}

/**
 * Run function that executes Fractional Knapsack and returns results.
 *
 * @param {Array<{ weight: number; value: number }>} items
 * @param {number} capacity
 * @returns {{ success: boolean; error?: string; selected?: Array<{ item: Item; taken: number; fraction: number; full: boolean }>; totalValue?: number; remainingCapacity?: number }}
 */
export function fractionalKnapsackRun(items, capacity) {
  const validation = validateFractionalKnapsackInput(items, capacity);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason,
    };
  }

  const result = fractionalKnapsack(validation.processed.items, validation.processed.capacity);
  return {
    success: true,
    selected: result.selected,
    totalValue: result.totalValue,
    remainingCapacity: result.remainingCapacity,
  };
}

// -------------------------------------------------------------------------
// Utility: generate random items
// -------------------------------------------------------------------------

/**
 * Generate random items for demonstration.
 * @param {number} count - number of items to generate
 * @param {number} capacity - knapsack capacity
 * @param {number} seed - seed for deterministic generation
 * @returns {Array<Item>}
 */
export function generateRandomItems(count, capacity, seed = 42) {
  // Simple seeded PRNG (mulberry32)
  let state = seed;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const items = [];

  for (let i = 0; i < count; i++) {
    const weight = 1 + Math.floor(next() * capacity);
    const value = 1 + Math.floor(next() * 100);
    items.push({
      id: i,
      weight,
      value,
      ratio: value / weight,
      name: `Item ${i}`,
    });
  }

  return items;
}

/**
 * Generate a deterministic default dataset.
 * @returns {{ items: Array<Item>; capacity: number }}
 */
export function getDefaultKnapsack() {
  return {
    items: [
      { id: 0, weight: 10, value: 60, ratio: 6, name: 'A' },
      { id: 1, weight: 20, value: 100, ratio: 5, name: 'B' },
      { id: 2, weight: 30, value: 120, ratio: 4, name: 'C' },
    ],
    capacity: 50,
  };
}
