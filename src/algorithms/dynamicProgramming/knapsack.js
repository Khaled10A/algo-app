import { createEventCollector } from "../../core/execution/events";

/**
 * 0/1 Knapsack — Bottom-Up Tabulation with Solution Reconstruction.
 *
 * O(n·W) time, O(n·W) space.
 *
 * Emits events for every DP table cell computation and backtracking step.
 *
 * Returns { maxValue, selectedItems, events }.
 */
export function knapsack(weights, values, capacity) {
  if (!Array.isArray(weights) || !Array.isArray(values)) {
    throw new Error("weights and values must be arrays");
  }
  if (weights.length !== values.length) {
    throw new Error("weights and values must have the same length");
  }

  const n = weights.length;
  const W = Math.max(0, Math.floor(capacity));

  const { emit, events } = createEventCollector();

  // ── Edge case: empty items ──
  if (n === 0) {
    emit("init", {
      table: [[{ value: 0, state: "computed" }]],
      rowLabels: ["∅"],
      colLabels: ["0"],
      inputVars: { n: "0", W: String(W) },
      log: "No items — trivial solution",
    });
    emit("complete", {
      answer: "0",
      vars: { "max value": "0", "selected": "none" },
      log: "Done — max value: 0, no items selected",
    });
    return { maxValue: 0, selectedItems: [], events };
  }

  // ── Edge case: zero capacity ──
  if (W === 0) {
    emit("init", {
      table: Array.from({ length: n + 1 }, () => [
        { value: 0, state: "computed" },
      ]),
      rowLabels: buildItemLabels(n),
      colLabels: ["0"],
      inputVars: { n: String(n), W: "0" },
      log: "Zero capacity — nothing can be taken",
    });
    emit("complete", {
      answer: "0",
      vars: { "max value": "0", "selected": "none" },
      log: "Done — max value: 0, zero capacity",
    });
    return { maxValue: 0, selectedItems: [], events };
  }

  // ── Build DP table (n+1 rows × W+1 cols) ──
  const dp = Array.from({ length: n + 1 }, () =>
    Array.from({ length: W + 1 }, () => 0),
  );

  // Track which cells were computed for visualization
  const cellStates = Array.from({ length: n + 1 }, () =>
    Array.from({ length: W + 1 }, () => "empty"),
  );
  // Row 0 and column 0 are base cases (all zeros)
  for (let j = 0; j <= W; j++) cellStates[0][j] = "computed";
  for (let i = 0; i <= n; i++) cellStates[i][0] = "computed";

  // Build the initial table for the init event
  const initTable = buildInitTable(dp, cellStates, n, W);

  emit("init", {
    table: deepCopy(initTable),
    rowLabels: buildItemLabels(n),
    colLabels: buildCapacityLabels(W),
    inputVars: {
      n: String(n),
      W: String(W),
      weights: weights.join(", "),
      values: values.join(", "),
    },
    log: `0/1 Knapsack — ${n} items, capacity ${W}`,
  });

  // ── Fill phase ──
  for (let i = 1; i <= n; i++) {
    const wt = weights[i - 1];
    const val = values[i - 1];

    for (let w = 0; w <= W; w++) {
      const cell = [i, w];

      if (wt <= w) {
        const exclude = dp[i - 1][w];
        const include = val + dp[i - 1][w - wt];
        const won = include > exclude;

        // Emit a compare event first (reading dependencies)
        emit("compare-cell", {
          cell,
          dependencies: [
            [i - 1, w],
            [i - 1, w - wt],
          ],
          vars: {
            i: String(i),
            w: String(w),
            item: `Item ${i} (wt=${wt}, val=${val})`,
            exclude: String(exclude),
            include: String(include),
            chosen: won ? "include" : "exclude",
          },
          log: `Item ${i} fits (wt ${wt} ≤ w ${w}): exclude=${exclude}, include=${val}+${dp[i - 1][w - wt]}=${include} → ${won ? "INCLUDE" : "EXCLUDE"}`,
        });

        // Compute the cell
        dp[i][w] = won ? include : exclude;
        cellStates[i][w] = "computed";

        emit("compute-cell", {
          cell,
          value: dp[i][w],
          dependencies: [
            [i - 1, w],
            [i - 1, w - wt],
          ],
          vars: {
            i: String(i),
            w: String(w),
            item: `Item ${i} (wt=${wt}, val=${val})`,
            exclude: String(exclude),
            include: String(include),
            chosen: won ? "include" : "exclude",
            "dp[i][w]": String(dp[i][w]),
          },
          log: `dp[${i}][${w}] = ${won ? `include(${include})` : `exclude(${exclude})`} = ${dp[i][w]}`,
        });
      } else {
        // Item too heavy — must exclude
        dp[i][w] = dp[i - 1][w];
        cellStates[i][w] = "computed";

        emit("skip-cell", {
          cell,
          value: dp[i][w],
          vars: {
            i: String(i),
            w: String(w),
            item: `Item ${i} (wt=${wt}, val=${val})`,
            reason: `Item ${i} too heavy (${wt} > ${w})`,
          },
          log: `Item ${i} too heavy (wt ${wt} > w ${w}) → dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
        });
      }
    }
  }

  // ── Solution reconstruction ──
  const selectedItems = [];

  emit("backtrack-start", {
    cell: [n, W],
    answer: String(dp[n][W]),
    vars: {
      "max value": String(dp[n][W]),
      phase: "backtrack",
    },
    log: `Fill complete — max value = ${dp[n][W]}. Starting reconstruction from dp[${n}][${W}]`,
  });

  // Backtrack from dp[n][W]
  let i = n;
  let w = W;
  const backtrackPath = [[i, w]];

  while (i > 0 && w > 0) {
    const wt = weights[i - 1];
    const val = values[i - 1];

    if (dp[i][w] !== dp[i - 1][w]) {
      // Item was included
      selectedItems.push(i - 1);
      emit("backtrack-step", {
        cell: [i, w],
        dependencies: [[i - 1, w - wt]],
        answer: String(dp[n][W]),
        vars: {
          i: String(i),
          w: String(w),
          decision: "INCLUDE",
          item: `Item ${i} (wt=${wt}, val=${val})`,
          "dp[i][w]": String(dp[i][w]),
          "dp[i-1][w]": String(dp[i - 1][w]),
          reason: `dp[${i}][${w}] ≠ dp[${i - 1}][${w}] → item included`,
          "selected so far": selectedItems.map((idx) => `Item ${idx + 1}`).join(", "),
        },
        log: `dp[${i}][${w}]=${dp[i][w]} ≠ dp[${i - 1}][${w}]=${dp[i - 1][w]} → INCLUDE Item ${i} (wt=${wt}, val=${val})`,
        path: [...backtrackPath],
      });
      w -= wt;
    } else {
      // Item was excluded
      emit("backtrack-step", {
        cell: [i, w],
        dependencies: [[i - 1, w]],
        answer: String(dp[n][W]),
        vars: {
          i: String(i),
          w: String(w),
          decision: "SKIP",
          item: `Item ${i} (wt=${wt}, val=${val})`,
          "dp[i][w]": String(dp[i][w]),
          "dp[i-1][w]": String(dp[i - 1][w]),
          reason: `dp[${i}][${w}] = dp[${i - 1}][${w}] → item excluded`,
          "selected so far": selectedItems.length
            ? selectedItems.map((idx) => `Item ${idx + 1}`).join(", ")
            : "none",
        },
        log: `dp[${i}][${w}]=${dp[i][w]} = dp[${i - 1}][${w}]=${dp[i - 1][w]} → SKIP Item ${i} (wt=${wt})`,
        path: [...backtrackPath],
      });
    }

    i -= 1;
    backtrackPath.unshift([i, w]);
  }

  // Reverse to get items in original order
  selectedItems.reverse();

  const totalWeight = selectedItems.reduce((s, idx) => s + weights[idx], 0);
  const totalValue = selectedItems.reduce((s, idx) => s + values[idx], 0);

  emit("complete", {
    answer: String(dp[n][W]),
    vars: {
      "max value": String(dp[n][W]),
      "selected items": selectedItems.length
        ? selectedItems.map((idx) => `Item ${idx + 1}`).join(", ")
        : "none",
      "total weight": String(totalWeight),
      "total value": String(totalValue),
    },
    log: `Done — max value: ${dp[n][W]}, items: [${selectedItems.map((idx) => `Item ${idx + 1} (wt=${weights[idx]}, val=${values[idx]})`).join(", ")}], total weight: ${totalWeight}`,
  });

  return { maxValue: dp[n][W], selectedItems, events };
}

// ── Helpers ──────────────────────────────────────────────────

function buildItemLabels(n) {
  const labels = ["∅ (base)"];
  for (let i = 1; i <= n; i++) labels.push(`Item ${i}`);
  return labels;
}

function buildCapacityLabels(W) {
  return Array.from({ length: W + 1 }, (_, i) => String(i));
}

function buildInitTable(dp, cellStates, n, W) {
  const table = [];
  for (let i = 0; i <= n; i++) {
    const row = [];
    for (let j = 0; j <= W; j++) {
      row.push({ value: dp[i][j], state: cellStates[i][j] });
    }
    table.push(row);
  }
  return table;
}

function deepCopy(table) {
  return table.map((row) => row.map((cell) => ({ ...cell })));
}
