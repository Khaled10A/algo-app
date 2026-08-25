import { describe, expect, it } from "vitest";
import { countingSort, countingSortEvents } from "./countingSort";
import { countingSortDebug, COUNTING_SORT_LINE_MAP } from "./countingSortDebug";
import { COUNTING_SORT_CODE_LINES } from "./countingSort";
import { projectSortingEvents } from "./sortingSteps";

const REFERENCE = (a) => [...a].sort((x, y) => x - y);

describe("countingSort - correctness", () => {
  it.each([
    ["empty array", []],
    ["single element", [7]],
    ["already sorted", [1, 2, 3, 4, 5]],
    ["reverse sorted", [5, 4, 3, 2, 1]],
    ["duplicates", [2, 2, 2, 1, 1, 3, 3]],
    ["negative values", [-3, -1, -2, -1]],
    ["mixed positive/negative", [5, -1, 3, 0, -4, 12]],
    ["large random array", Array.from({ length: 200 }, () => Math.floor(Math.random() * 200) - 100)],
  ])("sorts %s correctly", (_name, input) => {
    const original = [...input];
    const { sorted, comparisons } = countingSort(input);
    expect(sorted).toEqual(REFERENCE(input));
    expect(input).toEqual(original);
    expect(comparisons).toBe(0);
    expect(sorted).toHaveLength(input.length);
  });

  it("is stable (equal keys retain relative order)", () => {
    const input = [3, 1, 3, 1, 3];
    const { sorted } = countingSort(input);
    expect(sorted).toEqual([1, 1, 3, 3, 3]);
  });

  it("handles zero as a value", () => {
    const { sorted } = countingSort([0, 5, 0, -3, 0]);
    expect(sorted).toEqual([-3, 0, 0, 0, 5]);
  });

  it("handles a range spanning zero", () => {
    const { sorted } = countingSort([-5, 5, 0, -1, 1]);
    expect(sorted).toEqual([-5, -1, 0, 1, 5]);
  });

  it("preserves array membership across all placement events", () => {
    const input = [4, 1, 3, 1, 2];
    const { events } = countingSortEvents(input);
    let output = new Array(input.length).fill(null);
    for (const e of events) {
      if (e.type === "place-element") {
        output[e.outputIndex] = e.value;
        const placed = output.filter((v) => v !== null);
        for (const v of placed) {
          expect(input).toContain(v);
        }
      }
    }
    expect(output.filter((v) => v !== null)).toHaveLength(input.length);
  });
});

describe("countingSort - event model", () => {
  it("starts with init and ends with complete", () => {
    const { events } = countingSortEvents([3, 1, 2]);
    expect(events[0].type).toBe("init");
    expect(events.at(-1).type).toBe("complete");
  });

  it("emits count-update for each input element", () => {
    const { events } = countingSortEvents([5, 3, 5]);
    const counts = events.filter((e) => e.type === "count-update");
    expect(counts).toHaveLength(3);
    expect(counts[0]).toMatchObject({ inputIndex: 0, value: 5, countIndex: 2, count: 1 });
  });

  it("emits count-complete after all count-updates", () => {
    const { events } = countingSortEvents([2, 1]);
    const lastCount = events.filter((e) => e.type === "count-update").at(-1);
    const completeIdx = events.findIndex((e) => e.type === "count-complete");
    expect(events.indexOf(lastCount)).toBeLessThan(completeIdx);
  });

  it("emits prefix-update events in ascending slot order", () => {
    const { events } = countingSortEvents([1, 2, 3]);
    const prefixes = events.filter((e) => e.type === "prefix-update");
    const indices = prefixes.map((e) => e.countIndex);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    for (const p of prefixes) {
      expect(p.cumulative).toBeGreaterThan(0);
    }
  });

  it("emits place-element events in right-to-left input order", () => {
    const { events } = countingSortEvents([10, 20, 30]);
    const placements = events.filter((e) => e.type === "place-element");
    expect(placements.map((e) => e.inputIndex)).toEqual([2, 1, 0]);
  });

  it("carries the progressive output on place-element events", () => {
    const { events } = countingSortEvents([2, 1]);
    const placements = events.filter((e) => e.type === "place-element");
    for (const p of placements) {
      expect(Array.isArray(p.output)).toBe(true);
      expect(p.output).toHaveLength(2);
    }
    expect(placements.at(-1).output).toEqual([1, 2]);
  });

  it("is fully deterministic across repeated executions", () => {
    const input = [4, -1, 3, 0, 2];
    const a = countingSortEvents(input);
    const b = countingSortEvents(input);
    expect(a.events).toEqual(b.events);
    expect(a.sorted).toEqual(b.sorted);
  });

  it("never mutates the input graph or array", () => {
    const input = [3, 1, 2];
    const snapshot = JSON.stringify(input);
    countingSortEvents(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("countingSortDebug - projector", () => {
  it("maps one event to exactly one step", () => {
    const { events } = countingSortEvents([3, 1, 2]);
    const steps = countingSortDebug([3, 1, 2]);
    expect(steps).toHaveLength(events.length);
    expect(steps[0].log).toMatch(/Load array/i);
    expect(steps.at(-1).log).toMatch(/Done/i);
  });

  it("keeps every activeLine within codeLines bounds", () => {
    const steps = countingSortDebug([4, 1, 3, 2, 1]);
    const max = COUNTING_SORT_CODE_LINES.length;
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(max);
    }
  });

  it("carries the base schema on every step", () => {
    const steps = countingSortDebug([3, 1, 2]);
    for (const s of steps) {
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack[0]).toContain("countingSort");
      expect(Array.isArray(s.arr)).toBe(true);
    }
  });

  it("carries the count array on counting events", () => {
    const steps = countingSortDebug([3, 1, 2]);
    const countSteps = steps.filter((s) => s.countArray);
    expect(countSteps.length).toBeGreaterThan(0);
  });

  it("shows the sorted output in the final step", () => {
    const steps = countingSortDebug([3, 1, 2]);
    const last = steps.at(-1);
    expect(last.sortedFrom).toBe(0);
    expect(last.arr).toEqual([1, 2, 3]);
  });

  it("is deterministic for repeated debug runs", () => {
    expect(countingSortDebug([5, 2, 8])).toEqual(countingSortDebug([5, 2, 8]));
  });
});

describe("countingSort - line map integrity", () => {
  it("maps every event type the algorithm emits", () => {
    const { events } = countingSortEvents([3, 1, 2]);
    for (const e of events) {
      expect(COUNTING_SORT_LINE_MAP[e.type]).toBeDefined();
    }
  });
});
