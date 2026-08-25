import { describe, expect, it } from "vitest";
import { heapSort, heapSortEvents, HEAP_SORT_CODE_LINES } from "./heapSort";
import { heapSortDebug, HEAP_SORT_LINE_MAP } from "./heapSortDebug";
import { projectSortingEvents } from "./sortingSteps";

const REFERENCE = (a) => [...a].sort((x, y) => x - y);

function multiset(a) {
  return JSON.stringify(REFERENCE(a));
}

describe("heapSort — correctness", () => {
  it.each([
    ["empty array", []],
    ["single element", [7]],
    ["already sorted", [1, 2, 3, 4, 5]],
    ["reverse sorted", [5, 4, 3, 2, 1]],
    ["duplicates", [2, 2, 2, 1, 1, 3]],
    ["negative values", [-3, -1, -2]],
    ["mixed positive/negative", [5, -1, 3, 0, -4, 12]],
    ["large random array", Array.from({ length: 100 }, () => Math.floor(Math.random() * 200) - 100)],
  ])("sorts %s correctly and in place", (_name, input) => {
    const original = [...input];
    const { sorted, comparisons } = heapSort(input);
    expect(sorted).toEqual(REFERENCE(input));
    expect(input).toEqual(original);
    if (input.length > 1) expect(comparisons).toBeGreaterThan(0);
    expect(sorted).toHaveLength(input.length);
  });

  it("preserves array membership after every swap event", () => {
    const input = [9, 4, 7, 1, 8, 2];
    const { events } = heapSortEvents(input);
    const swaps = events.filter((e) => e.type === "swap");
    expect(swaps.length).toBeGreaterThan(0);
    for (const e of swaps) {
      expect(multiset(e.values)).toBe(multiset([e.values[0], e.values[1]]));
    }
    const final = events.at(-1);
    expect(multiset(final.array)).toBe(multiset(input));
  });

  it("never loses or duplicates values across the full run", () => {
    const input = [6, 3, 8, 1, 9, 2, 5];
    const { events } = heapSortEvents(input);
    let working = [...input];
    for (const e of events) {
      if (e.type === "swap") {
        const [x, y] = e.indices;
        [working[x], working[y]] = [working[y], working[x]];
      }
      expect(multiset(working)).toBe(multiset(input));
    }
  });

  it("is deterministic across repeated executions", () => {
    const input = [4, 9, 1, 6];
    const a = heapSortEvents(input);
    const b = heapSortEvents(input);
    expect(a.events).toEqual(b.events);
    expect(a.sorted).toEqual(b.sorted);
  });
});

describe("heapSort — event ordering & shape", () => {
  it("starts with init, contains build-start, ends with complete", () => {
    const { events } = heapSortEvents([3, 1, 2]);
    expect(events[0].type).toBe("init");
    expect(events.some((e) => e.type === "build-start")).toBe(true);
    expect(events.at(-1).type).toBe("complete");
  });

  it("emits extract-max only during the extract phase", () => {
    const { events } = heapSortEvents([5, 2, 8, 1]);
    const buildCompleteIdx = events.findIndex((e) => e.type === "build-complete");
    for (let i = 0; i < events.length; i++) {
      if (events[i].type === "extract-max") {
        expect(i).toBeGreaterThan(buildCompleteIdx);
      }
    }
  });

  it("decreases the heap boundary monotonically during extraction", () => {
    const { events } = heapSortEvents([7, 3, 9, 1, 5]);
    let prev = Infinity;
    for (const e of events) {
      if (e.phase === "extract" && e.boundary !== undefined) {
        expect(e.boundary).toBeLessThanOrEqual(prev);
        prev = e.boundary;
      }
    }
  });

  it("keeps every event index inside the array", () => {
    const input = [4, 1, 3];
    const { events } = heapSortEvents(input);
    for (const e of events) {
      for (const idx of e.indices || []) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(input.length);
      }
    }
  });

  it("carries comparisons on the complete event", () => {
    const { events } = heapSortEvents([2, 1]);
    expect(events.at(-1).comparisons).toBeGreaterThan(0);
  });
});

describe("heapSort — line map integrity", () => {
  it("maps every event type the algorithm emits", () => {
    const { events } = heapSortEvents([5, 1, 4, 2]);
    for (const e of events) {
      expect(HEAP_SORT_LINE_MAP[e.type]).toBeDefined();
    }
  });

  it("exposes code lines matching the debugger line map", () => {
    expect(HEAP_SORT_CODE_LINES.length).toBeGreaterThan(0);
    expect(HEAP_SORT_LINE_MAP.complete).toBeLessThan(HEAP_SORT_CODE_LINES.length);
  });
});

describe("sorting projector — invariants", () => {
  it("maps one event to exactly one step", () => {
    const { events } = heapSortEvents([3, 1, 2]);
    const steps = heapSortDebug([3, 1, 2]);
    expect(steps).toHaveLength(events.length);
  });

  it("keeps every activeLine within codeLines bounds", () => {
    const steps = heapSortDebug([4, 1, 3, 2]);
    const max = HEAP_SORT_CODE_LINES.length;
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(max);
    }
  });

  it("carries the base schema on every step", () => {
    const steps = heapSortDebug([4, 1, 3]);
    for (const s of steps) {
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack[0]).toContain("heapSort");
      expect(Array.isArray(s.arr)).toBe(true);
      expect(Array.isArray(s.highlight)).toBe(true);
      if (s !== steps[0]) expect(s.arr).not.toBe(steps[0].arr);
    }
  });

  it("reaches a fully sorted final state in the projector", () => {
    const steps = heapSortDebug([5, 1, 4, 2, 3]).at(-1);
    expect(steps.arr).toEqual([1, 2, 3, 4, 5]);
    expect(steps.sortedFrom).toBe(0);
    expect(steps.complete).toBe(true);
  });

  it("exposes the heap boundary during extraction", () => {
    const steps = heapSortDebug([9, 4, 7, 1]).filter((s) => s.phase === "extract");
    expect(steps.length).toBeGreaterThan(0);
    for (const s of steps) {
      expect(s.boundary).toBeLessThan(4);
      expect(s.sortedFrom).toBeGreaterThanOrEqual(s.boundary);
    }
  });

  it("is deterministic for repeated debug runs", () => {
    expect(heapSortDebug([6, 2, 8, 4])).toEqual(heapSortDebug([6, 2, 8, 4]));
  });
});
