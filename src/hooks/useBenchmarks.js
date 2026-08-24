import { useCallback, useEffect, useRef, useState } from "react";
import { runBenchmark, BenchmarkCancelledError } from "../core/benchmark/runner";
import { validateSpec, parseNumberList } from "../core/benchmark/jobs";
import { usePersistentState } from "./usePersistentState";

let idCounter = 0;
function makeRunId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `${Date.now()}-${idCounter}`;
}

function describeBenchmarkError(err) {
  if (err instanceof BenchmarkCancelledError || err?.cancelled) return null;
  if (err?.timeout) return err.message;
  if (err instanceof TypeError) return `Benchmark failed: ${err.message}`;
  return err?.message ? `Benchmark failed: ${err.message}` : "Benchmark failed unexpectedly.";
}

export function useBenchmarks() {
  const [sortResults, setSortResults] = usePersistentState("results:sort", null);
  const [searchResults, setSearchResults] = usePersistentState("results:search", null);
  const [sortRunning, setSortRunning] = useState(false);
  const [searchRunning, setSearchRunning] = useState(false);
  const [sortError, setSortError] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const sortAbortRef = useRef(null);
  const searchAbortRef = useRef(null);

  useEffect(
    () => () => {
      sortAbortRef.current?.abort();
      searchAbortRef.current?.abort();
    },
    []
  );

  function begin(kind, abortRef, setError) {
    if (abortRef.current) return false;
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    (kind === "sort" ? setSortRunning : setSearchRunning)(true);
    return controller;
  }

  function end(kind, abortRef, setError, err) {
    abortRef.current = null;
    (kind === "sort" ? setSortRunning : setSearchRunning)(false);
    if (err) setError(describeBenchmarkError(err));
  }

  const cancelSort = useCallback(() => {
    sortAbortRef.current?.abort();
  }, []);

  const cancelSearch = useCallback(() => {
    searchAbortRef.current?.abort();
  }, []);

  const runSort = useCallback(
    async ({ algoIds, types, sizesStr, metric, inputMode, customArrayStr, label }) => {
      if (sortAbortRef.current) return;
      const sizes = parseNumberList(sizesStr);
      const spec = { kind: "sorting", algoIds, types, sizes, inputMode, customArrayStr, metric };
      const error = validateSpec(spec);
      if (error) {
        setSortError(error);
        return;
      }

      const controller = begin("sort", sortAbortRef, setSortError);
      if (!controller) return;

      try {
        const results = await runBenchmark(spec, { signal: controller.signal });
        const sizesOut =
          inputMode === "custom" ? [parseNumberList(customArrayStr).length] : sizes;
        const envelope = {
          id: makeRunId(),
          kind: "sorting",
          label: label || `Sort Run #${makeRunId()}`,
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
      } catch (err) {
        end("sort", sortAbortRef, setSortError, err);
        return undefined;
      } finally {
        if (sortAbortRef.current === controller) {
          sortAbortRef.current = null;
          setSortRunning(false);
        }
      }
    },
    [setSortResults]
  );

  const runSearch = useCallback(
    async ({ algoIds, scenarios, sizesStr, metric, inputMode, pattern, text, fileName, label }) => {
      if (searchAbortRef.current) return;
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
      if (error) {
        setSearchError(error);
        return;
      }

      const controller = begin("search", searchAbortRef, setSearchError);
      if (!controller) return;

      try {
        const results = await runBenchmark(spec, { signal: controller.signal });
        const base = {
          id: makeRunId(),
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
            label: label || `Search Run #${makeRunId()}`,
            sizes: spec.sizes,
            scenarios: [...scenarios],
          };
        }
        setSearchResults(envelope);
        return envelope;
      } catch (err) {
        end("search", searchAbortRef, setSearchError, err);
        return undefined;
      } finally {
        if (searchAbortRef.current === controller) {
          searchAbortRef.current = null;
          setSearchRunning(false);
        }
      }
    },
    [setSearchResults]
  );

  return {
    sortResults,
    searchResults,
    sortRunning,
    searchRunning,
    sortError,
    searchError,
    cancelSort,
    cancelSearch,
    runSort,
    runSearch,
  };
}
