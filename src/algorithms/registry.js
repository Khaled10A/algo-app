import { sortingDescriptors } from './sorting/descriptors';
import { searchingDescriptors } from './searching/descriptors';
import { graphDescriptors } from './graphs/descriptors';

export const ALL_DESCRIPTORS = [
  ...sortingDescriptors,
  ...searchingDescriptors,
  ...graphDescriptors,
];

const BY_ID = new Map(ALL_DESCRIPTORS.map((d) => [d.id, d]));

export const DOMAINS = [
  {
    id: "sorting",
    label: "Sorting",
    subTabs: ["benchmark", "visualizer", "complexity", "pseudocode", "history", "report", "debugger", "ai"],
  },
  {
    id: "searching",
    label: "String Matching",
    subTabs: ["benchmark", "complexity", "pseudocode", "history", "report", "debugger", "ai"],
  },
  {
    id: "graphs",
    label: "Graphs",
    subTabs: ["debugger"],
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

export function hasAlgorithm(id) {
  return BY_ID.has(id);
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
    (d) => cats.includes(d.category) && typeof d.debug === "function"
  );
}
