/**
 * Navigation model — defines the primary sections, their sub-navigation,
 * and the algorithm detail views. This is the single source of truth for
 * the app's information architecture.
 */

export const SECTIONS = [
  { id: "learn", label: "Learn" },
  { id: "playground", label: "Playground" },
  { id: "analyze", label: "Analyze" },
  { id: "reference", label: "Reference" },
  { id: "ai", label: "AI" },
];

export const LEARN_CATEGORIES = [
  { id: "sorting", label: "Sorting" },
  { id: "searching", label: "Searching" },
  { id: "graphs", label: "Graphs" },
];

export const ALGORITHM_VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "visualize", label: "Visualize" },
  { id: "debug", label: "Debug" },
  { id: "complexity", label: "Complexity" },
];

export const PLAYGROUND_TYPES = [
  { id: "array", label: "Array Playground" },
  { id: "graph", label: "Graph Playground" },
];

export const ANALYZE_TABS = [
  { id: "benchmark", label: "Benchmark" },
  { id: "history", label: "History" },
  { id: "reports", label: "Reports" },
];

export const REFERENCE_TABS = [
  { id: "complexity", label: "Complexity" },
  { id: "pseudocode", label: "Pseudocode" },
];

/** Maps a learn category + view to the legacy sub-tab used by ConfigSidebar. */
export function sidebarContext(learnCategory, algorithmView) {
  if (algorithmView === "visualize") return "visualizer";
  if (algorithmView === "debug") return "debugger";
  return "visualizer";
}

/** Maps a learn category to the registry category id. */
export function learnCategoryToRegistry(categoryId) {
  return categoryId;
}

/** Algorithms available for a given learn category. */
export function algorithmsForCategory(categoryId, getByCategory) {
  return getByCategory(categoryId);
}
