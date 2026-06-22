import { describe, expect, it } from "vitest";
import {
  bubbleSort,
  insertionSort,
  mergeSort,
  quickSort,
  selectionSort,
} from "./index";

const cases = [
  {
    name: "mixed values with duplicates",
    input: [5, -1, 3, 3, 0, 12, -4],
    expected: [-4, -1, 0, 3, 3, 5, 12],
  },
  {
    name: "already sorted values",
    input: [1, 2, 3, 4],
    expected: [1, 2, 3, 4],
  },
  {
    name: "empty input",
    input: [],
    expected: [],
  },
];

const algorithms = [
  ["Bubble Sort", bubbleSort],
  ["Insertion Sort", insertionSort],
  ["Merge Sort", mergeSort],
  ["Quick Sort", quickSort],
  ["Selection Sort", selectionSort],
];

describe("sorting algorithms", () => {
  algorithms.forEach(([algoName, sort]) => {
    cases.forEach(({ name, input, expected }) => {
      it(`${algoName} sorts ${name}`, () => {
        const original = [...input];
        const result = sort(input);

        expect(result.sorted).toEqual(expected);
        expect(input).toEqual(original);
        expect(result.comparisons).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
