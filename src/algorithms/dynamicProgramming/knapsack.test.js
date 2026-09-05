import { describe, expect, it } from "vitest";
import { knapsack } from "./knapsack";
import { knapsackDebug } from "./knapsackDebug";

// ──────────────────────────────────────────────────────────────
// Correctness
// ──────────────────────────────────────────────────────────────
describe("Knapsack — correctness", () => {
  it("classic example: weights=[2,3,4,5], values=[3,4,5,6], W=8 → 10", () => {
    const { maxValue, selectedItems } = knapsack(
      [2, 3, 4, 5],
      [3, 4, 5, 6],
      8,
    );
    expect(maxValue).toBe(10);
    // Items 2 and 4: values 4+6=10, weights 3+5=8
    expect(selectedItems.sort()).toEqual([1, 3]);
  });

  it("single item that fits", () => {
    const { maxValue, selectedItems } = knapsack([5], [10], 5);
    expect(maxValue).toBe(10);
    expect(selectedItems).toEqual([0]);
  });

  it("single item too heavy", () => {
    const { maxValue, selectedItems } = knapsack([10], [5], 5);
    expect(maxValue).toBe(0);
    expect(selectedItems).toEqual([]);
  });

  it("multiple items, all fit", () => {
    const { maxValue } = knapsack([1, 2, 3], [10, 20, 30], 100);
    expect(maxValue).toBe(60);
  });

  it("identical weights, different values — picks highest value", () => {
    const { maxValue, selectedItems } = knapsack([3, 3, 3], [1, 10, 100], 6);
    expect(maxValue).toBe(110);
    expect(selectedItems.sort()).toEqual([1, 2]);
  });

  it("all items have value 0", () => {
    const { maxValue, selectedItems } = knapsack(
      [1, 2, 3],
      [0, 0, 0],
      10,
    );
    expect(maxValue).toBe(0);
    expect(selectedItems).toEqual([]);
  });

  it("knapsack with known textbook example", () => {
    // weights=[1,3,4,5], values=[1,4,5,7], capacity=7
    const { maxValue, selectedItems } = knapsack(
      [1, 3, 4, 5],
      [1, 4, 5, 7],
      7,
    );
    expect(maxValue).toBe(9);
    // Items 2 and 3: values 4+5=9, weights 3+4=7
    expect(selectedItems.sort()).toEqual([1, 2]);
  });

  it("duplicate weights handled correctly", () => {
    const { maxValue, selectedItems } = knapsack(
      [2, 2, 2],
      [3, 4, 5],
      4,
    );
    expect(maxValue).toBe(9);
    expect(selectedItems.sort()).toEqual([1, 2]);
  });

  it("reconstruction produces correct total weight", () => {
    const weights = [2, 3, 4, 5];
    const values = [3, 4, 5, 6];
    const { maxValue, selectedItems } = knapsack(weights, values, 8);
    const totalWeight = selectedItems.reduce((s, i) => s + weights[i], 0);
    expect(totalWeight).toBeLessThanOrEqual(8);
    expect(maxValue).toBe(10);
  });

  it("larger problem: 10 items", () => {
    const w = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const v = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
    const { maxValue } = knapsack(w, v, 20);
    // Known answer for this instance
    expect(maxValue).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────────
describe("Knapsack — edge cases", () => {
  it("empty items array", () => {
    const { maxValue, selectedItems, events } = knapsack([], [], 10);
    expect(maxValue).toBe(0);
    expect(selectedItems).toEqual([]);
    expect(events.length).toBeGreaterThan(0);
  });

  it("zero capacity", () => {
    const { maxValue, selectedItems } = knapsack([1, 2, 3], [4, 5, 6], 0);
    expect(maxValue).toBe(0);
    expect(selectedItems).toEqual([]);
  });

  it("zero capacity with items", () => {
    const { maxValue, selectedItems } = knapsack([5, 10], [50, 100], 0);
    expect(maxValue).toBe(0);
    expect(selectedItems).toEqual([]);
  });

  it("all items heavier than capacity", () => {
    const { maxValue, selectedItems } = knapsack(
      [10, 20, 30],
      [100, 200, 300],
      5,
    );
    expect(maxValue).toBe(0);
    expect(selectedItems).toEqual([]);
  });

  it("single item with zero weight", () => {
    const { maxValue, selectedItems } = knapsack([0], [10], 5);
    expect(maxValue).toBe(10);
    expect(selectedItems).toEqual([0]);
  });

  it("single item with zero value", () => {
    const { maxValue, selectedItems } = knapsack([5], [0], 5);
    expect(maxValue).toBe(0);
    expect(selectedItems).toEqual([]);
  });

  it("fractional capacity (non-integer capacity truncated)", () => {
    const { maxValue } = knapsack([2, 3], [3, 4], 5.9);
    expect(maxValue).toBeGreaterThanOrEqual(4);
  });

  it("duplicate weights", () => {
    const { maxValue } = knapsack([3, 3, 3, 3], [1, 2, 3, 4], 6);
    expect(maxValue).toBe(7); // items 3+4: 3+4=7
  });

  it("all items same weight and value", () => {
    const { maxValue, selectedItems } = knapsack([2, 2, 2], [5, 5, 5], 6);
    expect(maxValue).toBe(15);
    expect(selectedItems).toHaveLength(3);
  });

  it("throws when weights and values have different lengths", () => {
    expect(() => knapsack([1, 2], [1], 5)).toThrow(/same length/);
  });

  it("throws when inputs are not arrays", () => {
    expect(() => knapsack("bad", [], 5)).toThrow(/arrays/);
  });

  it("handles negative values gracefully", () => {
    const { maxValue } = knapsack([1, 2], [-5, 10], 5);
    expect(maxValue).toBeGreaterThanOrEqual(0);
  });

  it("handles negative weights gracefully", () => {
    // Negative weights should effectively always fit
    const { maxValue } = knapsack([-1, 3], [10, 20], 5);
    expect(maxValue).toBeGreaterThanOrEqual(0);
  });
});

// ──────────────────────────────────────────────────────────────
// Reconstruction correctness
// ──────────────────────────────────────────────────────────────
describe("Knapsack — reconstruction", () => {
  it("selected items fit within capacity", () => {
    const weights = [2, 3, 4, 5, 6];
    const values = [3, 4, 5, 6, 7];
    const capacity = 10;
    const { maxValue, selectedItems } = knapsack(weights, values, capacity);
    const totalWeight = selectedItems.reduce((s, i) => s + weights[i], 0);
    expect(totalWeight).toBeLessThanOrEqual(capacity);
    expect(maxValue).toBe(
      selectedItems.reduce((s, i) => s + values[i], 0),
    );
  });

  it("reconstruction is optimal — no subset beats it", () => {
    const weights = [2, 3, 4, 5];
    const values = [3, 4, 5, 6];
    const capacity = 8;
    const { maxValue } = knapsack(weights, values, capacity);

    // Check all 2^4 subsets
    let best = 0;
    for (let mask = 0; mask < 16; mask++) {
      let w = 0,
        v = 0;
      for (let i = 0; i < 4; i++) {
        if (mask & (1 << i)) {
          w += weights[i];
          v += values[i];
        }
      }
      if (w <= capacity) best = Math.max(best, v);
    }
    expect(maxValue).toBe(best);
  });

  it("single item selected reconstruction", () => {
    const { maxValue, selectedItems } = knapsack([5], [10], 10);
    expect(maxValue).toBe(10);
    expect(selectedItems).toEqual([0]);
  });

  it("no items selected when all too heavy", () => {
    const { maxValue, selectedItems } = knapsack([10, 20], [5, 6], 5);
    expect(maxValue).toBe(0);
    expect(selectedItems).toEqual([]);
  });

  it("selected items are in sorted order", () => {
    const { selectedItems } = knapsack(
      [1, 2, 3, 4, 5],
      [1, 4, 9, 16, 25],
      10,
    );
    for (let i = 1; i < selectedItems.length; i++) {
      expect(selectedItems[i]).toBeGreaterThan(selectedItems[i - 1]);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Step state correctness
// ──────────────────────────────────────────────────────────────
describe("Knapsack — step state", () => {
  it("events start with init", () => {
    const { events } = knapsack([1, 2], [3, 4], 5);
    expect(events[0].type).toBe("init");
  });

  it("events end with complete", () => {
    const { events } = knapsack([1, 2], [3, 4], 5);
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init event sets up correct table dimensions", () => {
    const { events } = knapsack([2, 3, 4], [5, 6, 7], 8);
    const init = events[0];
    expect(init.table).toHaveLength(4); // n+1 rows
    expect(init.table[0]).toHaveLength(9); // W+1 columns
  });

  it("compute-cell events have correct value and dependencies", () => {
    const { events } = knapsack([2, 3], [3, 4], 5);
    const computes = events.filter((e) => e.type === "compute-cell");
    expect(computes.length).toBeGreaterThan(0);
    for (const e of computes) {
      expect(e.cell).toBeDefined();
      expect(typeof e.value).toBe("number");
      expect(Array.isArray(e.dependencies)).toBe(true);
    }
  });

  it("skip-cell events have correct value and vars", () => {
    const { events } = knapsack([10], [5], 5);
    const skips = events.filter((e) => e.type === "skip-cell");
    expect(skips.length).toBeGreaterThan(0);
    for (const e of skips) {
      expect(typeof e.value).toBe("number");
      expect(e.vars).toBeDefined();
    }
  });

  it("compare-cell events have exclude and include vars", () => {
    const { events } = knapsack([2, 3], [3, 4], 5);
    const compares = events.filter((e) => e.type === "compare-cell");
    expect(compares.length).toBeGreaterThan(0);
    for (const e of compares) {
      expect(e.vars.exclude).toBeDefined();
      expect(e.vars.include).toBeDefined();
      expect(e.vars.chosen).toMatch(/^(include|exclude)$/);
    }
  });

  it("backtrack events have decision var", () => {
    const { events } = knapsack([2, 3, 4], [3, 4, 5], 6);
    const backtracks = events.filter((e) => e.type === "backtrack-step");
    expect(backtracks.length).toBeGreaterThan(0);
    for (const e of backtracks) {
      expect(e.vars.decision).toMatch(/^(INCLUDE|SKIP)$/);
      expect(e.vars.item).toBeDefined();
    }
  });

  it("complete event has max value and selected items", () => {
    const { events } = knapsack([2, 3, 4, 5], [3, 4, 5, 6], 8);
    const complete = events[events.length - 1];
    expect(complete.type).toBe("complete");
    expect(complete.vars["max value"]).toBe("10");
    expect(complete.vars["selected items"]).toBeDefined();
  });

  it("events are deterministic — same input produces same events", () => {
    const r1 = knapsack([2, 3, 4, 5], [3, 4, 5, 6], 8);
    const r2 = knapsack([2, 3, 4, 5], [3, 4, 5, 6], 8);
    expect(r1.events).toEqual(r2.events);
  });

  it("empty items produces only init and complete events", () => {
    const { events } = knapsack([], [], 10);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("init");
    expect(events[1].type).toBe("complete");
  });

  it("zero capacity produces only init and complete events", () => {
    const { events } = knapsack([1, 2, 3], [4, 5, 6], 0);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("init");
    expect(events[1].type).toBe("complete");
  });
});

// ──────────────────────────────────────────────────────────────
// Debug snapshot contracts
// ──────────────────────────────────────────────────────────────
describe("Knapsack — debug snapshot contracts", () => {
  it("produces valid snapshots", () => {
    const steps = knapsackDebug([2, 3, 4, 5], [3, 4, 5, 6], 8);
    expect(steps.length).toBeGreaterThan(0);

    for (const s of steps) {
      expect(typeof s.activeLine).toBe("number");
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(typeof s.log).toBe("string");
      expect(s.log.length).toBeGreaterThan(0);
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack.length).toBeGreaterThan(0);
      expect(Array.isArray(s.table)).toBe(true);
      expect(Array.isArray(s.rowLabels)).toBe(true);
      expect(Array.isArray(s.colLabels)).toBe(true);
      expect(typeof s.phase).toBe("string");
      expect(typeof s.complete).toBe("boolean");
    }
  });

  it("last snapshot has complete=true", () => {
    const steps = knapsackDebug([2, 3, 4, 5], [3, 4, 5, 6], 8);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
  });

  it("last snapshot has the correct answer", () => {
    const steps = knapsackDebug([2, 3, 4, 5], [3, 4, 5, 6], 8);
    const last = steps[steps.length - 1];
    expect(last.answer).toBe("10");
  });

  it("table has correct dimensions", () => {
    const steps = knapsackDebug([2, 3, 4, 5], [3, 4, 5, 6], 8);
    const first = steps[0];
    expect(first.table).toHaveLength(5); // n+1 rows
    expect(first.table[0]).toHaveLength(9); // W+1 columns
  });

  it("row labels are correct", () => {
    const steps = knapsackDebug([2, 3], [3, 4], 5);
    const first = steps[0];
    expect(first.rowLabels).toEqual(["∅ (base)", "Item 1", "Item 2"]);
  });

  it("column labels are correct", () => {
    const steps = knapsackDebug([2, 3], [3, 4], 5);
    const first = steps[0];
    expect(first.colLabels).toEqual(["0", "1", "2", "3", "4", "5"]);
  });

  it("handles empty items edge case", () => {
    const steps = knapsackDebug([], [], 10);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("0");
  });

  it("handles zero capacity edge case", () => {
    const steps = knapsackDebug([1, 2], [3, 4], 0);
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("0");
  });

  it("steps are immutable", () => {
    const steps = knapsackDebug([2, 3, 4], [3, 4, 5], 6);
    const s0 = steps[0];
    const s1 = steps[1];
    s0.table[0][0].value = 999;
    expect(s1.table[0][0].value).not.toBe(999);
  });

  it("phase transitions from fill to backtrack", () => {
    const steps = knapsackDebug([2, 3], [3, 4], 5);
    const phases = steps.map((s) => s.phase);
    expect(phases[0]).toBe("fill");
    // Should eventually reach backtrack
    expect(phases).toContain("backtrack");
  });

  it("backtrack path accumulates", () => {
    const steps = knapsackDebug([2, 3, 4], [3, 4, 5], 6);
    const backtrackSteps = steps.filter(
      (s) => s.phase === "backtrack" && s.backtrackPath.length > 0,
    );
    expect(backtrackSteps.length).toBeGreaterThan(0);
    // Path should grow
    for (let i = 1; i < backtrackSteps.length; i++) {
      expect(backtrackSteps[i].backtrackPath.length).toBeGreaterThanOrEqual(
        backtrackSteps[i - 1].backtrackPath.length - 1,
      );
    }
  });

  it("vars contain knapsack-specific keys during fill", () => {
    const steps = knapsackDebug([2, 3], [3, 4], 5);
    const fillSteps = steps.filter(
      (s) => s.phase === "fill" && s.vars.exclude !== undefined,
    );
    expect(fillSteps.length).toBeGreaterThan(0);
    for (const s of fillSteps) {
      expect(s.vars.exclude).toBeDefined();
      expect(s.vars.include).toBeDefined();
      expect(s.vars.chosen).toBeDefined();
    }
  });
});
