import { describe, expect, it } from "vitest";
import { generateArray, generateText } from "./generators";

describe("generateArray", () => {
  it("produces arrays of the requested length", () => {
    for (const n of [1, 5, 50]) {
      expect(generateArray(n, "random")).toHaveLength(n);
    }
  });

  it("sorted and reverse variants are ordered", () => {
    const sorted = generateArray(30, "sorted");
    const reverse = generateArray(30, "reverse");
    expect(sorted).toEqual([...sorted].sort((a, b) => a - b));
    expect(reverse).toEqual([...reverse].sort((a, b) => b - a));
  });

  it("nearly sorted deviates only slightly from fully sorted", () => {
    const arr = generateArray(100, "nearly");
    const fullySorted = [...arr].sort((a, b) => a - b);
    let diffs = 0;
    for (let i = 0; i < arr.length; i++) if (arr[i] !== fullySorted[i]) diffs++;
    expect(diffs).toBeLessThanOrEqual(20);
    expect(diffs).toBeGreaterThan(0);
  });
});

function countOccurrences(text, pattern) {
  if (!pattern) return 0;
  let count = 0;
  for (let i = 0; i + pattern.length <= text.length; i++) {
    if (text.slice(i, i + pattern.length) === pattern) count++;
  }
  return count;
}

describe("generateText", () => {
  it("start scenario places the pattern at the beginning", () => {
    const text = generateText(100, "algo", "start");
    expect(text.startsWith("algo")).toBe(true);
    expect(text).toHaveLength(100);
  });

  it("start scenario preserves exact length even for long patterns", () => {
    expect(generateText(10, "algoreallylongpattern", "start")).toHaveLength(10);
    expect(generateText(4, "toolong", "start")).toBe("tool");
  });

  it("end scenario places the pattern at the end", () => {
    const text = generateText(100, "algo", "end");
    expect(text.endsWith("algo")).toBe(true);
  });

  it("multiple scenario embeds at least three occurrences", () => {
    const text = generateText(200, "algo", "multiple");
    expect(countOccurrences(text, "algo")).toBeGreaterThanOrEqual(3);
  });

  it.each(["algo", "abc", "zz", "q"])(
    "nomatch scenario guarantees absence of pattern '%s'",
    (pattern) => {
      for (let i = 0; i < 20; i++) {
        const text = generateText(120, pattern, "nomatch");
        expect(countOccurrences(text, pattern)).toBe(0);
      }
    },
  );
});
