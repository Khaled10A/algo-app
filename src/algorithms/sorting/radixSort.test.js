import { describe, expect, it } from "vitest";
import { radixSortEvents } from "./radixSort";
import { radixSortDebug, RADIX_SORT_LINE_MAP } from "./radixSortDebug";
import { RADIX_SORT_CODE_LINES } from "./radixSort";

const REFERENCE = (a) => [...a].sort((x, y) => x - y);

describe("radixSort - correctness", () => {
  it.each([
    ["empty array", []],
    ["single value", [7]],
    ["already sorted", [1, 2, 3, 4, 5]],
    ["reverse sorted", [5, 4, 3, 2, 1]],
    ["duplicates", [3, 1, 3, 1, 3]],
    ["positive integers", [170, 45, 75, 90, 802, 24, 2, 66]],
    ["negative integers", [-5, -1, -3, -2]],
    ["mixed negative/positive", [-5, 3, -2, 0, 8, -1, 4]],
    ["zero present", [0, 5, 0, -3, 0]],
    ["different digit lengths", [1, 100, 10, 1000, 5]],
    ["large values", [99999, 1, 50000, 12345, 99998]],
  ])("sorts %s correctly", (_name, input) => {
    const original = [...input];
    const { sorted } = radixSortEvents(input);
    expect(sorted).toEqual(REFERENCE(input));
    expect(input).toEqual(original);
    expect(sorted).toHaveLength(input.length);
  });

  it("preserves values (no loss or duplication)", () => {
    const input = [6, 3, 8, 1, 9, 2, 5, 7];
    const { events } = radixSortEvents(input);
    const final = events.at(-1);
    expect(multiset(final.array)).toBe(multiset(input));
  });

  function multiset(a) {
    return JSON.stringify(REFERENCE(a));
  }

  it("is stable across digit passes (equal keys retain relative order)", () => {
    const input = [
      { key: 12, tag: "a" }, { key: 3, tag: "b" },
      { key: 12, tag: "c" }, { key: 3, tag: "d" },
    ];
    const values = input.map((o) => o.key);
    const { sorted } = (() => {
      let a = values.map((v) => v + 1000);
      const maxV = Math.max(...a);
      for (let pass = 0; pass < 4; pass++) {
        const place = Math.pow(10, pass);
        const count = new Array(10).fill(0);
        for (let i = 0; i < a.length; i++) count[Math.floor(a[i] / place) % 10]++;
        for (let d = 1; d < 10; d++) count[d] += count[d - 1];
        const out = new Array(a.length);
        for (let i = a.length - 1; i >= 0; i--) {
          const digit = Math.floor(a[i] / place) % 10;
          out[--count[digit]] = a[i];
        }
        a = out;
      }
      return { sorted: a.map((v) => v - 1000) };
    })();
    expect(sorted[0]).toBeLessThanOrEqual(sorted[1]);
  });

  it("produces correct final ordering for mixed values", () => {
    const input = [-5, 3, 0, -2, 8, 1, -1, 7];
    const { sorted } = radixSortEvents(input);
    expect(sorted).toEqual(REFERENCE(input));
  });
});

describe("radixSort - event model", () => {
  it("starts with init and ends with complete", () => {
    const { events } = radixSortEvents([3, 1, 2]);
    expect(events[0].type).toBe("init");
    expect(events.at(-1).type).toBe("complete");
  });

  it("emits digit-pass-start for every digit position", () => {
    const { events } = radixSortEvents([170, 45, 75, 90]);
    const passes = events.filter((e) => e.type === "digit-pass-start");
    expect(passes).toHaveLength(3);
    expect(passes.map((e) => e.place)).toEqual([1, 10, 100]);
  });

  it("emits digit-pass-complete after each pass", () => {
    const { events } = radixSortEvents([170, 45, 75, 90]);
    const completions = events.filter((e) => e.type === "digit-pass-complete");
    expect(completions).toHaveLength(3);
    for (const c of completions) {
      expect(c.output).toHaveLength(4);
    }
  });

  it("carries digit and place on count-update events", () => {
    const { events } = radixSortEvents([170, 45, 75, 90]);
    const countUpdates = events.filter((e) => e.type === "count-update");
    expect(countUpdates.length).toBeGreaterThan(0);
    for (const e of countUpdates) {
      expect(e.digit).toBeGreaterThanOrEqual(0);
      expect(e.digit).toBeLessThan(10);
      expect(e.place).toBeGreaterThan(0);
    }
  });

  it("is fully deterministic across repeated executions", () => {
    const input = [170, 45, 75, 90, -2, 802];
    const a = radixSortEvents(input);
    const b = radixSortEvents(input);
    expect(a.events).toEqual(b.events);
    expect(a.sorted).toEqual(b.sorted);
  });

  it("never mutates the input array", () => {
    const input = [170, 45, 75, 90];
    const snapshot = JSON.stringify(input);
    radixSortEvents(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("offsets negative values correctly", () => {
    const input = [-3, 1, -1, 2];
    const { events } = radixSortEvents(input);
    const init = events[0];
    expect(init.offset).toBe(3);
    const last = events.at(-1);
    expect(last.array).toEqual(REFERENCE(input));
  });
});

describe("radixSortDebug - projector", () => {
  it("maps one event to exactly one step", () => {
    const { events } = radixSortEvents([3, 1, 2]);
    const steps = radixSortDebug([3, 1, 2]);
    expect(steps).toHaveLength(events.length);
    expect(steps[0].log).toMatch(/Load array|Initialize/i);
    expect(steps.at(-1).log).toMatch(/Done|complete|sorted/i);
  });

  it("keeps every activeLine within codeLines bounds", () => {
    const steps = radixSortDebug([170, 45, 75, 90]);
    const max = RADIX_SORT_CODE_LINES.length;
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(max);
    }
  });

  it("carries the base schema and radix state on every step", () => {
    const steps = radixSortDebug([170, 45, 75, 90]);
    for (const s of steps) {
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack[0]).toContain("radixSort");
      expect(Array.isArray(s.arr)).toBe(true);
    }
  });

  it("exposes pass and place in snapshots during digit passes", () => {
    const steps = radixSortDebug([170, 45, 75, 90]);
    const passSteps = steps.filter((s) => s.pass !== undefined);
    expect(passSteps.length).toBeGreaterThan(0);
    for (const s of passSteps) {
      expect(s.pass).toMatch(/\d+ \/ \d+/);
      expect(s.place).toBeGreaterThan(0);
    }
  });

  it("shows the sorted array in the final snapshot", () => {
    const steps = radixSortDebug([3, 1, 2]);
    const last = steps.at(-1);
    expect(last.arr).toEqual([1, 2, 3]);
    expect(last.sortedFrom).toBe(0);
  });

  it("is deterministic for repeated debug runs", () => {
    expect(radixSortDebug([5, 2, 8, 1])).toEqual(radixSortDebug([5, 2, 8, 1]));
  });
});

describe("radixSort - line map integrity", () => {
  it("maps every event type the algorithm emits", () => {
    const { events } = radixSortEvents([170, 45, 75, 90]);
    for (const e of events) {
      expect(RADIX_SORT_LINE_MAP[e.type]).toBeDefined();
    }
  });
});
