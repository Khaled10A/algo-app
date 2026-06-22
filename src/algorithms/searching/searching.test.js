import { describe, expect, it } from "vitest";
import { bruteForceSearch, horspoolSearch, kmpSearch } from "./index";

const algorithms = [
  ["Brute Force", bruteForceSearch],
  ["Horspool", horspoolSearch],
  ["KMP", kmpSearch],
];

describe("string searching algorithms", () => {
  algorithms.forEach(([algoName, search]) => {
    it(`${algoName} finds all non-overlapping benchmark matches`, () => {
      const result = search("algo xx algo yy algo", "algo");

      expect(result.matches).toEqual([0, 8, 16]);
      expect(result.comparisons).toBeGreaterThanOrEqual(0);
    });

    it(`${algoName} returns no matches when the pattern is absent`, () => {
      const result = search("design and analysis", "algo");

      expect(result.matches).toEqual([]);
      expect(result.comparisons).toBeGreaterThanOrEqual(0);
    });
  });

  it("search algorithms handle an empty pattern consistently", () => {
    algorithms.forEach(([, search]) => {
      expect(search("abc", "").matches).toEqual([]);
    });
  });
});
