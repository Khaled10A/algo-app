import { createEventCollector } from "../../core/execution/events";

/**
 * Permutations — generate all permutations of an array of distinct values.
 *
 * Uses standard backtracking: at each depth, try every unused element.
 * Track a `used` boolean array to know which elements are available.
 *
 * Output size is n! — educational input bounds keep this manageable.
 *
 * Emits deterministic events via createEventCollector for visualization.
 *
 * @param {number[]} arr – input array of distinct numbers
 * @returns {{ events: Array, solutions: Array<number[]>, count: number }}
 */
export function permutations(arr) {
  if (!Array.isArray(arr)) {
    throw new Error("Input must be an array");
  }

  const collector = createEventCollector();
  const { emit } = collector;

  const n = arr.length;
  const solutions = [];
  const currentPath = [];
  const used = new Array(n).fill(false);

  emit("init", {
    state: {
      arr: [...arr],
      path: [],
      used: [...used],
      depth: 0,
    },
    inputVars: {
      arr: `[${arr.join(", ")}]`,
      n: String(n),
    },
    log: `Generate all permutations of [${arr.join(", ")}]`,
  });

  function solve(depth) {
    if (depth === n) {
      const solution = [...currentPath];
      solutions.push(solution);

      emit("solution", {
        depth: n,
        solution: [...solution],
        state: {
          arr: [...arr],
          path: [...currentPath],
          used: [...used],
          depth: n,
        },
        vars: {
          depth: String(n),
          solution: String(solutions.length),
        },
        log: `Solution #${solutions.length}: [${solution.join(", ")}]`,
      });
      return;
    }

    // Build list of available (unused) elements
    const available = [];
    for (let i = 0; i < n; i++) {
      if (!used[i]) available.push(i);
    }

    emit("enter", {
      depth: depth + 1,
      candidates: available.map((i) => arr[i]),
      state: {
        arr: [...arr],
        path: [...currentPath],
        used: [...used],
        depth,
      },
      label: `depth=${depth}`,
      vars: {
        depth: String(depth),
        available: available.map((i) => `${arr[i]}[${i}]`).join(", "),
      },
      log: `Depth ${depth} — try ${available.length} unused element(s)`,
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
          used: [...used],
          depth,
        },
        vars: {
          depth: String(depth),
          choice: String(arr[idx]),
          index: String(idx),
        },
        log: `Choose arr[${idx}] = ${arr[idx]} for position ${depth}`,
      });

      // Mark used, add to path
      used[idx] = true;
      currentPath.push(arr[idx]);

      emit("constraint-check", {
        depth: depth + 1,
        candidate: arr[idx],
        valid: true,
        state: {
          arr: [...arr],
          path: [...currentPath],
          used: [...used],
          depth,
        },
        vars: {
          depth: String(depth),
          path: `[${currentPath.join(", ")}]`,
          usedCount: String(currentPath.length),
        },
        log: `Add ${arr[idx]} → path=[${currentPath.join(", ")}]`,
      });

      // Recurse
      solve(depth + 1);

      // Backtrack: remove from path, mark unused
      currentPath.pop();
      used[idx] = false;

      emit("backtrack", {
        depth: depth + 1,
        removed: arr[idx],
        candidates: available.map((i) => arr[i]),
        state: {
          arr: [...arr],
          path: [...currentPath],
          used: [...used],
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

  solve(0);

  emit("complete", {
    state: {
      arr: [...arr],
      path: [],
      used: new Array(n).fill(false),
      depth: 0,
    },
    vars: {
      totalSolutions: String(solutions.length),
      n: String(n),
    },
    log: `Done — ${solutions.length} permutation(s) of ${n} element(s)`,
  });

  return { events: collector.events, solutions, count: solutions.length };
}
