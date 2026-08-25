import { useCallback } from "react";
import { usePersistentState } from "./usePersistentState";

const MAX_HISTORY = 20;

export function useRunHistory() {
  const [history, setHistory] = usePersistentState("history", []);
  const [compare, setCompare] = usePersistentState("history:compare", []);

  const addRun = useCallback(
    (run) => {
      setHistory((h) => [run, ...h].slice(0, MAX_HISTORY));
    },
    [setHistory]
  );

  const clearAll = useCallback(() => {
    setHistory([]);
    setCompare([]);
  }, [setHistory, setCompare]);

  const clearSelection = useCallback(() => setCompare([]), [setCompare]);

  const updateCompare = useCallback(
    (updater) => setCompare((prev) => (typeof updater === "function" ? updater(prev) : updater)),
    [setCompare]
  );

  return { history, compare, addRun, clearAll, clearSelection, updateCompare };
}
