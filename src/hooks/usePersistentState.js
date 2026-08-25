import { useCallback, useState } from "react";

const PREFIX = "algo-app:v1:";

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => read(key, initial));

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          window.localStorage.setItem(PREFIX + key, JSON.stringify(resolved));
        } catch {
          
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, update];
}
