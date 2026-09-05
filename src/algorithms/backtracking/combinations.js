import { createEventCollector } from "../../core/execution/events";

/**
 * Combinations — generate all combinations of size k from n elements.
 *
 * Uses standard backtracking: at each depth, try elements from `start`
 * to n-1. Starting index ensures we never generate duplicate orderings
 * of the same combination (order doesn't matter).
 *
 * Output size is C(n,k) — educational input bounds keep this manageable.
 *
 * Emits deterministic events via createEventCollector for visualization.
 *
 * @param {number[]} arr – input array of distinct numbers
 * @param {number} k – size of each combination
 * @returns {{ events: Array, solutions: Array<number[]>, count: number }}
 */
export function combinations(arr, k) {
  if (!Array.isArray(arr)) {
    throw new Error("Input must be an array");
  }
  if (typeof k !== "number" || !Number.isInteger(k) || k < 0) {
    throw new Error(`k must be a non-negative integer, got ${k}`);
  }

  const collector = createEventCollector();
  const { emit } = collector;

  const n = arr.length;
  const solutions = [];
  const currentPath = [];

  emit("init", {
    state: {
      arr: [...arr],
      path: [],
      start: 0,
      depth: 0,
    },
    inputVars: {
      arr: `[${arr.join(", ")}]`,
      k: String(k),
      n: String(n),
    },
    log: `Generate all C(${n},${k}) combinations of size ${k} from [${arr.join(", ")}]`,
  });

  function solve(start, depth) {
    if (depth === k) {
      const solution = [...currentPath];
      solutions.push(solution);

      emit("solution", {
        depth: k,
        solution: [...solution],
        state: {
          arr: [...arr],
          path: [...currentPath],
          start,
          depth,
        },
        vars: {
          depth: String(depth),
          solution: String(solutions.length),
        },
        log: `Solution #${solutions.length}: [${solution.join(", ")}]`,
      });
      return;
    }

    // Build list of available candidates (from start to n-1)
    const available = [];
    for (let i = start; i < n; i++) {
      available.push(i);
    }

    emit("enter", {
      depth: depth + 1,
      candidates: available.map((i) => arr[i]),
      state: {
        arr: [...arr],
        path: [...currentPath],
        start,
        depth,
      },
      label: `depth=${depth}`,
      vars: {
        depth: String(depth),
        start: String(start),
        available: available.map((i) => `${arr[i]}[${i}]`).join(", "),
      },
      log: `Depth ${depth} — try candidates from index ${start} onwards`,
    });

    for (const idx of available) {
      // Choose element
      emit("choose", {
        depth: depth + 1,
        candidate: arr[idx],
        candidates: available.map((i) => arr[i]),
        state: {
          arr: [...arr],
          path: [...currentPath],
          start,
          depth,
        },
        vars: {
          depth: String(depth),
          choice: String(arr[idx]),
          index: String(idx),
        },
        log: `Choose arr[${idx}] = ${arr[idx]} for position ${depth}`,
      });

      // Add to path
      currentPath.push(arr[idx]);

      emit("constraint-check", {
        depth: depth + 1,
        candidate: arr[idx],
        valid: true,
        state: {
          arr: [...arr],
          path: [...currentPath],
          start,
          depth,
        },
        vars: {
          depth: String(depth),
          path: `[${currentPath.join(", ")}]`,
          count: String(currentPath.length),
        },
        log: `Add ${arr[idx]} → path=[${currentPath.join(", ")}]`,
      });

      // Recurse with start = idx + 1 (no going back)
      solve(idx + 1, depth + 1);

      // Backtrack: remove from path
      currentPath.pop();

      emit("backtrack", {
        depth: depth + 1,
        removed: arr[idx],
        candidates: available.map((i) => arr[i]),
        state: {
          arr: [...arr],
          path: [...currentPath],
          start,
          depth,
        },
        vars: {
          depth: String(depth),
          removed: String(arr[idx]),
          path: `[${currentPath.join(", ")}]`,
        },
        log: `Backtrack — remove ${arr[idx]} from position ${depth}`,
      });
    }
  }

  solve(0, 0);

  emit("complete", {
    state: {
      arr: [...arr],
      path: [],
      start: 0,
      depth: 0,
    },
    vars: {
      totalSolutions: String(solutions.length),
      k: String(k),
      n: String(n),
    },
    log: `Done — ${solutions.length} combination(s) of size ${k}`,
  });

  return { events: collector.events, solutions, count: solutions.length };
}
