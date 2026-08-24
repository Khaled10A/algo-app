import { useCallback, useState } from "react";
import { runBenchmark } from "../core/benchmark/runner";
import { validateSpec, parseNumberList } from "../core/benchmark/jobs";
import { usePersistentState } from "./usePersistentState";

export function useBenchmarks() {
  const [sortResults, setSortResults] = usePersistentState("results:sort", null);
  const [searchResults, setSearchResults] = usePersistentState("results:search", null);
  const [sortRunning, setSortRunning] = useState(false);
  const [searchRunning, setSearchRunning] = useState(false);

  const runSort = useCallback(
    async ({ algoIds, types, sizesStr, metric, inputMode, customArrayStr, label }) => {
      const sizes = parseNumberList(sizesStr);
      const spec = {
        kind: "sorting",
        algoIds,
        types,
        sizes,
        inputMode,
        customArrayStr,
        metric,
      };
      const error = validateSpec(spec);
      if (error || sortRunning) return;

      setSortRunning(true);
      try {
        const results = await runBenchmark(spec);
        const sizesOut =
          inputMode === "custom" ? [parseNumberList(customArrayStr).length] : sizes;
        const envelope = {
          id: Date.now(),
          kind: "sorting",
          label: label || `Sort Run #${Date.now() % 100000}`,
          ts: new Date().toLocaleTimeString(),
          inputMode,
          customArr: inputMode === "custom" ? customArrayStr : null,
          metric,
          results,
          sizes: sizesOut,
          algos: [...algoIds],
          types: [...types],
        };
        setSortResults(envelope);
        return envelope;
      } finally {
        setSortRunning(false);
      }
    },
    [setSortResults, sortRunning]
  );

  const runSearch = useCallback(
    async ({ algoIds, scenarios, sizesStr, metric, inputMode, pattern, text, fileName, label }) => {
      const spec =
        inputMode === "file"
          ? { kind: "search-file", algoIds, metric, pattern, text }
          : {
              kind: "search-generate",
              algoIds,
              scenarios,
              sizes: parseNumberList(sizesStr),
              metric,
              pattern,
            };
      const error = validateSpec(spec);
      if (error || searchRunning) return;

      setSearchRunning(true);
      try {
        const results = await runBenchmark(spec);
        const base = {
          id: Date.now(),
          kind: "search",
          ts: new Date().toLocaleTimeString(),
          metric,
          pattern,
          results,
          algos: [...algoIds],
        };

        let envelope;
        if (spec.kind === "search-file") {
          envelope = {
            ...base,
            mode: "file",
            label: label || `File Run — ${fileName}`,
            fileName,
            fileLength: text.length,
            sizes: [text.length],
            scenarios: ["file"],
          };
        } else {
          envelope = {
            ...base,
            mode: "generate",
            label: label || `Search Run #${Date.now() % 100000}`,
            sizes: spec.sizes,
            scenarios: [...scenarios],
          };
        }
        setSearchResults(envelope);
        return envelope;
      } finally {
        setSearchRunning(false);
      }
    },
    [setSearchResults, searchRunning]
  );

  return {
    sortResults,
    searchResults,
    sortRunning,
    searchRunning,
    runSort,
    runSearch,
  };
}
