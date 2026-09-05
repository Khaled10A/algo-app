import { createEventCollector } from "../../core/execution/events";

/**
 * Subset Sum — find all subsets of an array that sum to a target value.
 *
 * Uses standard backtracking with include/exclude decisions at each index.
 * At index i, the algorithm explores two branches:
 *   1. Include arr[i] in the current subset
 *   2. Exclude arr[i] from the current subset
 *
 * Pruning rule (mathematically valid):
 *   When all remaining elements (indices i..n-1) are non-negative,
 *   and currentSum + sum(remaining) < target, no valid solution can
 *   be reached from this branch, so we prune it.
 *   This is only applied when every remaining element ≥ 0, because
 *   with negative numbers the sum could decrease then increase.
 *   For arrays with any negative values, no pruning is applied.
 *
 * Emits deterministic events via createEventCollector for visualization.
 *
 * @param {number[]} arr – input array of numbers
 * @param {number} target – target sum
 * @returns {{ events: Array, solutions: Array<number[]>, count: number }}
 */
export function subsetSum(arr, target) {
  if (!Array.isArray(arr)) {
    throw new Error("Input must be an array");
  }
  if (typeof target !== "number" || !Number.isFinite(target)) {
    throw new Error(`Target must be a finite number, got ${target}`);
  }

  const collector = createEventCollector();
  const { emit } = collector;

  const n = arr.length;
  const solutions = [];
  const currentSubset = [];
  let currentSum = 0;

  // Precompute suffix sums for pruning
  const suffixSums = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    suffixSums[i] = suffixSums[i + 1] + arr[i];
  }

  // Check if all remaining elements are non-negative
  const allNonNeg = new Array(n + 1).fill(true);
  for (let i = n - 1; i >= 0; i--) {
    allNonNeg[i] = allNonNeg[i + 1] && arr[i] >= 0;
  }

  emit("init", {
    state: {
      arr: [...arr],
      target,
      index: 0,
      subset: [],
      sum: 0,
    },
    inputVars: {
      arr: `[${arr.join(", ")}]`,
      target: String(target),
      n: String(n),
    },
    log: `Find subsets of [${arr.join(", ")}] that sum to ${target}`,
  });

  function solve(index) {
    if (index === n) {
      if (currentSum === target) {
        const solution = [...currentSubset];
        solutions.push(solution);
        emit("solution", {
          depth: index,
          solution: [...solution],
          state: {
            arr: [...arr],
            target,
            index,
            subset: [...currentSubset],
            sum: currentSum,
          },
          vars: {
            index: String(index),
            sum: String(currentSum),
            target: String(target),
            solution: String(solutions.length),
          },
          log: `Solution #${solutions.length}: [${solution.join(", ")}] sums to ${target}`,
        });
      }
      return;
    }

    const remaining = suffixSums[index];
    const canPrune = allNonNeg[index] && currentSum + remaining < target;

    emit("enter", {
      depth: index + 1,
      candidates: ["include", "exclude"],
      state: {
        arr: [...arr],
        target,
        index,
        subset: [...currentSubset],
        sum: currentSum,
      },
      label: `i=${index}`,
      vars: {
        index: String(index),
        value: String(arr[index]),
        sum: String(currentSum),
        remaining: String(remaining),
      },
      log: `At index ${index}, value=${arr[index]}, current sum=${currentSum}`,
    });

    if (canPrune) {
      // All remaining are non-negative and even including everything won't reach target
      emit("prune", {
        depth: index + 1,
        reason: `sum=${currentSum} + remaining=${remaining} < target=${target}`,
        state: {
          arr: [...arr],
          target,
          index,
          subset: [...currentSubset],
          sum: currentSum,
        },
        vars: {
          index: String(index),
          sum: String(currentSum),
          remaining: String(remaining),
          target: String(target),
        },
        log: `Prune: ${currentSum} + ${remaining} = ${currentSum + remaining} < ${target} — even including all remaining won't reach target`,
      });
      return;
    }

    // ── Branch 1: Include arr[index] ──
    emit("choose", {
      depth: index + 1,
      candidate: "include",
      candidates: ["include", "exclude"],
      state: {
        arr: [...arr],
        target,
        index,
        subset: [...currentSubset],
        sum: currentSum,
      },
      highlightCells: [[0, index]],
      vars: {
        index: String(index),
        value: String(arr[index]),
        action: "include",
      },
      log: `Include arr[${index}] = ${arr[index]}`,
    });

    currentSubset.push(arr[index]);
    currentSum += arr[index];

    emit("constraint-check", {
      depth: index + 1,
      candidate: "include",
      valid: true,
      state: {
        arr: [...arr],
        target,
        index,
        subset: [...currentSubset],
        sum: currentSum,
      },
      vars: {
        index: String(index),
        sum: String(currentSum),
        target: String(target),
      },
      log: `Include → subset=[${currentSubset.join(", ")}], sum=${currentSum}`,
    });

    solve(index + 1);

    // Backtrack: undo include
    currentSubset.pop();
    currentSum -= arr[index];

    emit("backtrack", {
      depth: index + 1,
      removed: "include",
      candidates: ["include", "exclude"],
      state: {
        arr: [...arr],
        target,
        index,
        subset: [...currentSubset],
        sum: currentSum,
      },
      vars: {
        index: String(index),
        sum: String(currentSum),
      },
      log: `Undo include of ${arr[index]} → sum back to ${currentSum}`,
    });

    // ── Branch 2: Exclude arr[index] ──
    emit("choose", {
      depth: index + 1,
      candidate: "exclude",
      candidates: ["include", "exclude"],
      state: {
        arr: [...arr],
        target,
        index,
        subset: [...currentSubset],
        sum: currentSum,
      },
      vars: {
        index: String(index),
        value: String(arr[index]),
        action: "exclude",
      },
      log: `Exclude arr[${index}] = ${arr[index]}`,
    });

    emit("constraint-check", {
      depth: index + 1,
      candidate: "exclude",
      valid: true,
      state: {
        arr: [...arr],
        target,
        index,
        subset: [...currentSubset],
        sum: currentSum,
      },
      vars: {
        index: String(index),
        sum: String(currentSum),
        target: String(target),
      },
      log: `Exclude → subset=[${currentSubset.join(", ")}], sum=${currentSum}`,
    });

    solve(index + 1);

    emit("backtrack", {
      depth: index + 1,
      removed: "exclude",
      candidates: ["include", "exclude"],
      state: {
        arr: [...arr],
        target,
        index,
        subset: [...currentSubset],
        sum: currentSum,
      },
      vars: {
        index: String(index),
        sum: String(currentSum),
      },
      log: `Undo exclude of ${arr[index]}`,
    });
  }

  solve(0);

  emit("complete", {
    state: {
      arr: [...arr],
      target,
      index: n,
      subset: [],
      sum: 0,
    },
    vars: {
      totalSolutions: String(solutions.length),
      target: String(target),
    },
    log: `Done — ${solutions.length} subset(s) sum to ${target}`,
  });

  return { events: collector.events, solutions, count: solutions.length };
}
