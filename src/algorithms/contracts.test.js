import { describe, expect, it } from "vitest";
import {
  ALL_DESCRIPTORS,
  getByCategory,
  getBenchmarkable,
  getWithDebug,
  getAlgorithm,
} from "./registry";
import { bfsDebug } from "./graphs/bfs";
import { dfsDebug } from "./graphs/dfs";

function isSortedAsc(a) {
  for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
  return true;
}

function randomArray(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    // || 0 normalizes the -0 that -Math.floor(0) produces; Vitest's toEqual
    // distinguishes -0 from 0, which made this fixture flaky.
    if (Math.random() < 0.2) out.push(-Math.floor(Math.random() * 50) || 0);
    else out.push(Math.floor(Math.random() * 100));
    if (out.length > 1 && Math.random() < 0.3) out[out.length - 1] = out[0];
  }
  return out;
}

describe("registry integrity", () => {
  it("exposes unique ids with required metadata", () => {
    const ids = new Set();
    for (const d of ALL_DESCRIPTORS) {
      expect(ids.has(d.id)).toBe(false);
      ids.add(d.id);
      expect(typeof d.name).toBe("string");
      expect(d.category).toMatch(/^(sorting|searching|graphs)$/);
      expect(typeof d.color).toBe("string");
      expect(d.complexity).toHaveProperty("worst");
      expect(Array.isArray(d.codeLines)).toBe(true);
      expect(d.codeLines.length).toBeGreaterThan(0);
      expect(typeof d.pseudocode).toBe("string");
    }
    expect(getBenchmarkable("sorting")).toHaveLength(8);
    expect(getBenchmarkable("searching")).toHaveLength(3);
    expect(getWithDebug(["sorting"])).toHaveLength(8);
  });

  it("getAlgorithm throws for unknown ids", () => {
    expect(() => getAlgorithm("nope-sort")).toThrow(/Unknown algorithm/);
  });
});

describe("run/steps/debug equivalence (sorting)", () => {
  const sorts = getByCategory("sorting");

  it.each(sorts.map((d) => [d.id, d]))(
    "%s: run, steps and debug agree with reference sort",
    (_id, d) => {
      const inputs = [
        [],
        [1],
        [2, 2, 2],
        [5, -1, 3, 3, 0, 12, -4],
        ...Array.from({ length: 8 }, () =>
          randomArray(Math.floor(Math.random() * 40) + 1)
        ),
      ];
      for (const arr of inputs) {
        const expected = [...arr].sort((a, b) => a - b);

        const runOut = d.run(arr);
        expect(runOut.sorted).toEqual(expected);
        expect(runOut.comparisons).toBeGreaterThanOrEqual(0);
        expect(arr).toEqual([...arr]);

        if (typeof d.steps === "function") {
          const steps = d.steps(arr);
          expect(steps.length).toBeGreaterThan(0);
          expect(steps[steps.length - 1].arr).toEqual(expected);
        }

        if (typeof d.debug === "function") {
          const dbg = d.debug(arr);
          expect(dbg.length).toBeGreaterThan(0);
          expect(dbg[dbg.length - 1].arr).toEqual(expected);
        }
      }
    }
  );
});

describe("debug snapshot invariants", () => {
  const debuggables = [...getWithDebug("sorting"), ...getWithDebug("searching")];

  it.each(debuggables.map((d) => [d.id, d]))(
    "%s: snapshots stay within codeLines bounds and carry required fields",
    (_id, d) => {
      const maxLine = d.codeLines.length;
      const samples =
        d.category === "sorting"
          ? [d.debug([4, 1, 3])]
          : [
              d.debug("abcababc", "abc"),
              d.debug("aaaa", "aa"),
              d.debug("xyz", "qqq"),
            ];

      for (const steps of samples) {
        expect(steps.length).toBeGreaterThan(0);
        for (const s of steps) {
          expect(s.activeLine).toBeGreaterThanOrEqual(0);
          expect(s.activeLine).toBeLessThan(maxLine);
          expect(typeof s.log).toBe("string");
          expect(s.vars).toBeDefined();
          expect(s.memory).toBeDefined();
          expect(Array.isArray(s.callStack)).toBe(true);
        }
        expect(steps[steps.length - 1].log).toMatch(/Done|not found|Found!/i);
      }
    }
  );

  it("mergeSortDebug highlights real indices", () => {
    const steps = getAlgorithm("merge-sort").debug([5, 2, 9, 1]);
    const withHighlight = steps.filter((s) => s.highlight.length > 0);
    expect(withHighlight.length).toBeGreaterThan(0);
    for (const s of withHighlight) {
      for (const idx of s.highlight) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(s.arr.length);
      }
    }
  });

  it("quickSortDebug tracks recursion frames", () => {
    const steps = getAlgorithm("quick-sort").debug([7, 6, 5, 4, 3, 2, 1]);
    const framed = steps.filter((s) => s.callStack.length > 1);
    expect(framed.length).toBeGreaterThan(0);
  });

  it("binarySearch debug supports found and not-found targets", () => {
    const d = getAlgorithm("binary-search");
    const arr = [10, 3, 8, 1, 9];
    const foundSteps = d.debug(arr);
    const sorted = [...arr].sort((a, b) => a - b);
    const midValue = sorted[Math.floor(sorted.length / 2)];
    expect(foundSteps.some((s) => s.log.includes("Found"))).toBe(true);

    const missingTarget = Math.max(...sorted) + 1;
    const missingSteps = d.debug(arr, missingTarget);
    expect(missingSteps[missingSteps.length - 1].log).toMatch(/not found/i);
    expect(foundSteps.every((s) => isSortedAsc(s.arr))).toBe(true);
  });
});

describe("run/debug equivalence (string searching)", () => {
  const stringMatchers = getWithDebug("searching").filter((d) => d.group === "string");

  it.each(stringMatchers.map((d) => [d.id, d]))(
    "%s: final matchPositions equal run() matches",
    (_id, d) => {
      const cases = [
        ["algo xx algo yy algo", "algo"],
        ["aaaa", "aa"],
        ["aaaa", "aaa"],
        ["abcababcabcabc", "abc"],
        ["mississippi", "issip"],
        ["xyz", "abc"],
        ["a", "a"],
      ];
      for (const [text, pattern] of cases) {
        const expected = d.run(text, pattern).matches;
        const dbg = d.debug(text, pattern);
        expect(dbg[dbg.length - 1].matchPositions).toEqual(expected);
      }
    }
  );

  it.each(stringMatchers.map((d) => [d.id, d]))(
    "%s: handles overlapping matches identically",
    (_id, d) => {
      expect(d.run("aaaa", "aaa").matches).toEqual([0, 1]);
      expect(d.run("aaaaa", "aa").matches).toEqual([0, 1, 2, 3]);
    }
  );
});

describe("graph traversal debuggers", () => {
  const graph = {
    A: ["B", "D"],
    B: ["A", "C"],
    C: ["B"],
    D: ["A", "E"],
    E: ["D"],
  };

  it.each([
    ["dfs", dfsDebug],
    ["bfs", bfsDebug],
  ])("%s visits every reachable node exactly once", (_name, fn) => {
    const steps = fn(graph, "A");
    const last = steps[steps.length - 1];
    expect(last.visitOrder[0]).toBe("A");
    expect(new Set(last.visitOrder).size).toBe(last.visitOrder.length);
    expect(last.visitOrder.sort().join("")).toBe("ABCDE");
    expect(last.queue ?? []).toEqual([]);
  });
});
