import { sortingDescriptors } from "./sorting/descriptors";
import { searchingDescriptors } from "./searching/descriptors";
import { graphDescriptors } from "./graphs/descriptors";
import { dpDescriptors } from "./dynamicProgramming/descriptors";
import { backtrackingDescriptors } from "./backtracking/descriptors";

export const ALL_DESCRIPTORS = [
  ...sortingDescriptors,
  ...searchingDescriptors,
  ...graphDescriptors,
  ...dpDescriptors,
  ...backtrackingDescriptors,
];

const BY_ID = new Map(ALL_DESCRIPTORS.map((d) => [d.id, d]));

export const DOMAINS = [
  {
    id: "sorting",
    label: "Sorting",
    subTabs: [
      "benchmark",
      "visualizer",
      "complexity",
      "pseudocode",
      "history",
      "report",
      "debugger",
      "ai",
    ],
  },
  {
    id: "searching",
    label: "String Matching",
    subTabs: [
      "benchmark",
      "complexity",
      "pseudocode",
      "history",
      "report",
      "debugger",
      "ai",
    ],
  },
  {
    id: "graphs",
    label: "Graphs",
    subTabs: ["debugger"],
  },
  {
    id: "dynamicProgramming",
    label: "Dynamic Programming",
    subTabs: ["debugger", "complexity", "pseudocode", "ai"],
  },
  {
    id: "backtracking",
    label: "Backtracking",
    subTabs: ["debugger", "complexity", "pseudocode", "ai"],
  },
];

export function getDomain(id) {
  return DOMAINS.find((d) => d.id === id) || null;
}

export function getAlgorithm(id) {
  const d = BY_ID.get(id);
  if (!d) throw new Error(`Unknown algorithm id: ${id}`);
  return d;
}

const FALLBACK_COMPLEXITY = {
  best: "—",
  average: "—",
  worst: "—",
  space: "—",
  paradigm: "Unknown",
};

/**
 * Never throws. Returns null for unknown/stale IDs so render paths can
 * degrade gracefully instead of crashing on persisted state.
 */
export function getAlgorithmSafe(id) {
  return BY_ID.get(id) || null;
}

/** Safe descriptor for display contexts; falls back to a stub using the raw id. */
export function getAlgorithmForDisplay(id) {
  return (
    BY_ID.get(id) || {
      id,
      name: id,
      category: "unknown",
      color: "#94a3b8",
      complexity: FALLBACK_COMPLEXITY,
      run: null,
      steps: null,
      debug: null,
      pseudocode: null,
      codeLines: [],
    }
  );
}

export function getByCategory(category) {
  return ALL_DESCRIPTORS.filter((d) => d.category === category);
}

export function getBenchmarkable(category) {
  return getByCategory(category).filter((d) => typeof d.run === "function");
}

export function getWithSteps(category) {
  return getByCategory(category).filter((d) => typeof d.steps === "function");
}

export function getWithDebug(categories) {
  const cats = Array.isArray(categories) ? categories : [categories];
  return ALL_DESCRIPTORS.filter(
    (d) => cats.includes(d.category) && typeof d.debug === "function",
  );
}
