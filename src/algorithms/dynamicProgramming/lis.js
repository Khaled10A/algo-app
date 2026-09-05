import { createEventCollector } from "../../core/execution/events";

/**
 * Longest Increasing Subsequence — O(n²) Bottom-Up DP with Reconstruction.
 *
 * Uses the standard DP approach for educational visualization:
 *   dp[i] = length of LIS ending at index i
 *   dp[i] = max(dp[j] + 1) for all j < i where arr[j] < arr[i]
 *
 * O(n²) time, O(n) space.
 *
 * Returns { length, lisArray, events }.
 */
export function lis(arr) {
  if (!Array.isArray(arr)) {
    throw new Error("Input must be an array");
  }

  const n = arr.length;

  const { emit, events } = createEventCollector();

  // ── Edge case: empty array ──
  if (n === 0) {
    emit("init", {
      table: [[{ value: null, state: "computed" }]],
      rowLabels: ["dp"],
      colLabels: [],
      inputVars: { n: "0", arr: "(empty)" },
      log: "Empty array — no LIS",
    });
    emit("complete", {
      answer: "(none)",
      vars: { length: "0", lis: "(none)" },
      log: "Done — LIS length: 0",
    });
    return { length: 0, lisArray: [], events };
  }

  // ── Edge case: single element ──
  if (n === 1) {
    const table = [[{ value: 1, state: "computed" }]];
    emit("init", {
      table: deepCopy(table),
      rowLabels: ["dp"],
      colLabels: buildColLabels(arr),
      inputVars: { n: "1", arr: String(arr[0]) },
      log: `LIS — [${arr.join(", ")}] — single element`,
    });
    emit("skip-cell", {
      cell: [0, 0],
      value: 1,
      vars: { i: "0", "arr[0]": String(arr[0]), "dp[0]": "1" },
      log: "Base case: dp[0] = 1 (single element is its own LIS)",
    });
    emit("backtrack-start", {
      cell: [0, 0],
      answer: String(arr[0]),
      vars: { "lis length": "1", phase: "backtrack" },
      log: "Fill complete — LIS length = 1. Starting reconstruction",
    });
    emit("backtrack-step", {
      cell: [0, 0],
      dependencies: [],
      answer: String(arr[0]),
      vars: {
        decision: "INCLUDE",
        element: `arr[0]=${arr[0]}`,
        "lis so far": String(arr[0]),
      },
      log: `INCLUDE arr[0]=${arr[0]} → LIS: [${arr[0]}]`,
      path: [[0, 0]],
    });
    emit("complete", {
      answer: `[${arr[0]}]`,
      vars: { length: "1", lis: `[${arr[0]}]` },
      log: `Done — LIS length: 1, LIS: [${arr[0]}]`,
    });
    return { length: 1, lisArray: [arr[0]], events };
  }

  // ── Build DP table: single row with n columns ──
  const dp = new Array(n).fill(1);
  const prev = new Array(n).fill(-1);

  const cellStates = new Array(n).fill("empty");

  const initTable = [
    arr.map((_, i) => ({ value: dp[i], state: cellStates[i] })),
  ];

  emit("init", {
    table: deepCopy(initTable),
    rowLabels: ["dp"],
    colLabels: buildColLabels(arr),
    inputVars: {
      n: String(n),
      arr: `[${arr.join(", ")}]`,
    },
    log: `LIS — [${arr.join(", ")}] — dp[${n}] initialized to 1`,
  });

  // Base case: dp[0] = 1
  cellStates[0] = "computed";
  emit("skip-cell", {
    cell: [0, 0],
    value: 1,
    vars: { i: "0", "arr[0]": String(arr[0]), "dp[0]": "1" },
    log: "Base case: dp[0] = 1",
  });

  // ── Fill phase ──
  let bestLen = 1;
  let bestIdx = 0;

  for (let i = 1; i < n; i++) {
    // First, highlight the current element being considered
    emit("compare-cell", {
      cell: [0, i],
      dependencies: [],
      vars: {
        i: String(i),
        "arr[i]": String(arr[i]),
        "dp[i] (current)": String(dp[i]),
        phase: "scan predecessors",
      },
      log: `Consider arr[${i}]=${arr[i]} — scan all j < ${i} for predecessors`,
    });

    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
        // Found a better predecessor
        emit("compare-cell", {
          cell: [0, i],
          dependencies: [[0, j]],
          vars: {
            i: String(i),
            j: String(j),
            "arr[j]": String(arr[j]),
            "arr[i]": String(arr[i]),
            "dp[j]": String(dp[j]),
            "dp[j]+1": String(dp[j] + 1),
            "dp[i] (current)": String(dp[i]),
            valid: "✓",
          },
          log: `arr[${j}]=${arr[j]} < arr[${i}]=${arr[i]} ✓ → dp[${j}]+1=${dp[j] + 1} > dp[${i}]=${dp[i]} → UPDATE`,
        });

        dp[i] = dp[j] + 1;
        prev[i] = j;
      } else if (arr[j] < arr[i]) {
        // Valid predecessor but doesn't improve
        emit("compare-cell", {
          cell: [0, i],
          dependencies: [[0, j]],
          vars: {
            i: String(i),
            j: String(j),
            "arr[j]": String(arr[j]),
            "arr[i]": String(arr[i]),
            "dp[j]": String(dp[j]),
            "dp[j]+1": String(dp[j] + 1),
            "dp[i] (current)": String(dp[i]),
            valid: "✗ (not better)",
          },
          log: `arr[${j}]=${arr[j]} < arr[${i}]=${arr[i]} ✓ but dp[${j}]+1=${dp[j] + 1} ≤ dp[${i}]=${dp[i]} → skip`,
        });
      } else {
        // Not a valid predecessor (not increasing)
        emit("compare-cell", {
          cell: [0, i],
          dependencies: [[0, j]],
          vars: {
            i: String(i),
            j: String(j),
            "arr[j]": String(arr[j]),
            "arr[i]": String(arr[i]),
            valid: "✗ (not increasing)",
          },
          log: `arr[${j}]=${arr[j]} ≥ arr[${i}]=${arr[i]} → not a valid predecessor`,
        });
      }
    }

    // Compute the final value for dp[i]
    cellStates[i] = "computed";
    emit("compute-cell", {
      cell: [0, i],
      value: dp[i],
      dependencies: prev[i] >= 0 ? [[0, prev[i]]] : [],
      vars: {
        i: String(i),
        "arr[i]": String(arr[i]),
        "dp[i]": String(dp[i]),
        ...(prev[i] >= 0
          ? { "prev[i]": `arr[${prev[i]}]=${arr[prev[i]]}` }
          : {}),
      },
      log: `dp[${i}] = ${dp[i]}${prev[i] >= 0 ? ` (extends arr[${prev[i]}]=${arr[prev[i]]})` : " (no improvement)"}`,
    });

    if (dp[i] > bestLen) {
      bestLen = dp[i];
      bestIdx = i;
    }
  }

  // ── Solution reconstruction ──
  const lisIndices = [];
  let idx = bestIdx;
  while (idx >= 0) {
    lisIndices.push(idx);
    idx = prev[idx];
  }
  lisIndices.reverse();
  const lisArray = lisIndices.map((i) => arr[i]);

  emit("backtrack-start", {
    cell: [0, bestIdx],
    answer: String(bestLen),
    vars: {
      "lis length": String(bestLen),
      "best index": String(bestIdx),
      phase: "backtrack",
    },
    log: `Fill complete — LIS length = ${bestLen}. Starting reconstruction from index ${bestIdx}`,
  });

  // Replay backtrack steps
  const backtrackPath = [];
  idx = bestIdx;
  const soFar = [];
  while (idx >= 0) {
    soFar.unshift(arr[idx]);
    backtrackPath.unshift([0, idx]);
    emit("backtrack-step", {
      cell: [0, idx],
      dependencies: prev[idx] >= 0 ? [[0, prev[idx]]] : [],
      answer: String(bestLen),
      vars: {
        index: String(idx),
        element: `arr[${idx}]=${arr[idx]}`,
        decision: "INCLUDE",
        "dp[idx]": String(dp[idx]),
        ...(prev[idx] >= 0
          ? {
              "prev idx": String(prev[idx]),
              "prev element": `arr[${prev[idx]}]=${arr[prev[idx]]}`,
            }
          : {}),
        "lis so far": `[${soFar.join(", ")}]`,
      },
      log: `INCLUDE arr[${idx}]=${arr[idx]} (dp=${dp[idx]}) → LIS so far: [${soFar.join(", ")}]`,
      path: [...backtrackPath],
    });
    idx = prev[idx];
  }

  emit("complete", {
    answer: `[${lisArray.join(", ")}]`,
    vars: {
      "lis length": String(bestLen),
      lis: `[${lisArray.join(", ")}]`,
      arr: `[${arr.join(", ")}]`,
    },
    log: `Done — LIS length: ${bestLen}, LIS: [${lisArray.join(", ")}]`,
  });

  return { length: bestLen, lisArray, events };
}

// ── Helpers ──────────────────────────────────────────────────

function buildColLabels(arr) {
  return arr.map((v, i) => `[${i}]${v}`);
}

function deepCopy(table) {
  return table.map((row) => row.map((cell) => ({ ...cell })));
}
