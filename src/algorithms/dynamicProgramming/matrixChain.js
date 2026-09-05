import { createEventCollector } from "../../core/execution/events";

/**
 * Matrix Chain Multiplication — Interval DP with Reconstruction.
 *
 * Given dimensions [p0, p1, ..., pn], matrix Ai has dimensions p[i] × p[i+1].
 * dp[i][j] = min scalar multiplications to compute A0 × A1 × ... × An-1.
 *
 * O(n³) time, O(n²) space.
 *
 * Returns { minCost, parenthesization, events }.
 */
export function matrixChain(dims) {
  if (!Array.isArray(dims)) {
    throw new Error("Dimensions must be an array");
  }
  if (dims.length < 2) {
    throw new Error("Need at least 2 dimensions to define one matrix");
  }
  for (const d of dims) {
    if (typeof d !== "number" || d <= 0 || !Number.isInteger(d)) {
      throw new Error("All dimensions must be positive integers");
    }
  }

  const n = dims.length - 1; // number of matrices

  const { emit, events } = createEventCollector();

  // ── Edge case: single matrix ──
  if (n === 1) {
    emit("init", {
      table: [[{ value: 0, state: "computed" }]],
      rowLabels: ["A1"],
      colLabels: ["A1"],
      inputVars: {
        n: "1",
        dims: `[${dims.join(", ")}]`,
        A1: `${dims[0]}×${dims[1]}`,
      },
      log: `Matrix Chain — [${dims.join(", ")}] — single matrix A1 (${dims[0]}×${dims[1]}), no multiplication needed`,
    });
    emit("backtrack-start", {
      cell: [0, 0],
      answer: "A1",
      vars: { "min cost": "0", phase: "backtrack" },
      log: "Single matrix — optimal parenthesization: A1",
    });
    emit("complete", {
      answer: "A1",
      vars: {
        "min cost": "0",
        "optimal parenthesization": "A1",
        dims: `[${dims.join(", ")}]`,
      },
      log: "Done — min cost: 0, parenthesization: A1",
    });
    return { minCost: 0, parenthesization: "A1", events };
  }

  // ── Build DP table (n × n), only upper triangle filled ──
  const dp = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0),
  );
  const split = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => -1),
  );

  const cellStates = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => "empty"),
  );

  // Base cases: diagonal (single matrix = 0 cost)
  for (let i = 0; i < n; i++) {
    cellStates[i][i] = "computed";
  }

  // Matrix labels for row/col headers
  const matrixLabels = [];
  for (let i = 0; i < n; i++) {
    matrixLabels.push(`A${i + 1} (${dims[i]}×${dims[i + 1]})`);
  }

  const initTable = buildInitTable(dp, cellStates, n);

  emit("init", {
    table: deepCopy(initTable),
    rowLabels: matrixLabels,
    colLabels: matrixLabels.map((l) => l.split(" ")[0]), // just A1, A2, ...
    inputVars: {
      n: String(n),
      dims: `[${dims.join(", ")}]`,
    },
    log: `Matrix Chain — ${n} matrices, dims [${dims.join(", ")}]`,
  });

  // Emit skip-cell events for diagonal base cases
  for (let i = 0; i < n; i++) {
    emit("skip-cell", {
      cell: [i, i],
      value: 0,
      vars: {
        i: String(i),
        matrix: `A${i + 1}`,
        dims: `${dims[i]}×${dims[i + 1]}`,
        reason: "Single matrix — no multiplication needed",
      },
      log: `dp[${i}][${i}] = 0 (single matrix A${i + 1}: ${dims[i]}×${dims[i + 1]})`,
    });
  }

  // ── Fill phase: increasing chain length ──
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      const cell = [i, j];

      dp[i][j] = Infinity;

      // Emit the start of evaluating this interval
      emit("compare-cell", {
        cell,
        dependencies: [],
        vars: {
          interval: `[${i + 1}, ${j + 1}]`,
          matrices: `A${i + 1}..A${j + 1}`,
          length: String(len),
          splits: String(len - 1),
        },
        log: `Evaluate dp[${i + 1}][${j + 1}] — chain A${i + 1}..A${j + 1} (length ${len}), try ${len - 1} split(s)`,
      });

      // Try every possible split
      for (let k = i; k < j; k++) {
        const leftCost = dp[i][k];
        const rightCost = dp[k + 1][j];
        const multCost = dims[i] * dims[k + 1] * dims[j + 1];
        const totalCost = leftCost + rightCost + multCost;

        const isBest = totalCost < dp[i][j];

        // Emit a compare event for this split candidate
        emit("compare-cell", {
          cell,
          dependencies: [
            [i, k],
            [k + 1, j],
          ],
          vars: {
            interval: `[${i + 1}, ${j + 1}]`,
            split: `k=${k + 1}`,
            left: `dp[${i + 1}][${k + 1}]=${leftCost}`,
            right: `dp[${k + 2}][${j + 1}]=${rightCost}`,
            mult: `${dims[i]}×${dims[k + 1]}×${dims[j + 1]}=${multCost}`,
            total: String(totalCost),
            best: isBest ? "✓ NEW BEST" : "✗",
            "current best": dp[i][j] === Infinity ? "∞" : String(dp[i][j]),
          },
          log: `Split at k=${k + 1}: dp[${i + 1}][${k + 1}]=${leftCost} + dp[${k + 2}][${j + 1}]=${rightCost} + ${dims[i]}×${dims[k + 1]}×${dims[j + 1]}=${multCost} = ${totalCost}${isBest ? " ← NEW BEST" : ""}`,
        });

        if (isBest) {
          dp[i][j] = totalCost;
          split[i][j] = k;
        }
      }

      // Compute the final value
      cellStates[i][j] = "computed";

      emit("compute-cell", {
        cell,
        value: dp[i][j],
        dependencies:
          split[i][j] >= 0
            ? [
                [i, split[i][j]],
                [split[i][j] + 1, j],
              ]
            : [],
        vars: {
          interval: `[${i + 1}, ${j + 1}]`,
          matrices: `A${i + 1}..A${j + 1}`,
          "best split": `k=${split[i][j] + 1}`,
          "min cost": String(dp[i][j]),
        },
        log: `dp[${i + 1}][${j + 1}] = ${dp[i][j]} (best split at k=${split[i][j] + 1})`,
      });
    }
  }

  // ── Reconstruct parenthesization ──
  const parenthesization = buildParenthesization(split, 0, n - 1);

  emit("backtrack-start", {
    cell: [0, n - 1],
    answer: String(dp[0][n - 1]),
    vars: {
      "min cost": String(dp[0][n - 1]),
      phase: "backtrack",
    },
    log: `Fill complete — min cost = ${dp[0][n - 1]}. Reconstructing optimal parenthesization`,
  });

  // Emit backtrack steps by walking the split tree
  const backtrackPath = [];
  emitBacktrackSteps(emit, split, dp, dims, 0, n - 1, backtrackPath);

  emit("complete", {
    answer: parenthesization,
    vars: {
      "min cost": String(dp[0][n - 1]),
      "optimal parenthesization": parenthesization,
      dims: `[${dims.join(", ")}]`,
    },
    log: `Done — min cost: ${dp[0][n - 1]}, parenthesization: ${parenthesization}`,
  });

  return { minCost: dp[0][n - 1], parenthesization, events };
}

// ── Helpers ──────────────────────────────────────────────────

function buildParenthesization(split, i, j) {
  if (i === j) return `A${i + 1}`;
  const k = split[i][j];
  const left = buildParenthesization(split, i, k);
  const right = buildParenthesization(split, k + 1, j);
  return `(${left} × ${right})`;
}

function emitBacktrackSteps(emit, split, dp, dims, i, j, path) {
  const cell = [i, j];
  path.push(cell);

  if (i === j) {
    emit("backtrack-step", {
      cell,
      dependencies: [],
      answer: String(dp[0][split.length - 1] ?? dp[0][0]),
      vars: {
        interval: `[${i + 1}, ${j + 1}]`,
        matrix: `A${i + 1}`,
        decision: "BASE CASE",
        parenthesization: `A${i + 1}`,
      },
      log: `A${i + 1} is a single matrix → parenthesization: A${i + 1}`,
      path: path.map((c) => [...c]),
    });
    return;
  }

  const k = split[i][j];
  const leftParens = buildParenthesization(split, i, k);
  const rightParens = buildParenthesization(split, k + 1, j);

  emit("backtrack-step", {
    cell,
    dependencies: [
      [i, k],
      [k + 1, j],
    ],
    answer: String(dp[0][split.length - 1] ?? dp[0][0]),
    vars: {
      interval: `[${i + 1}, ${j + 1}]`,
      split: `k=${k + 1}`,
      left: leftParens,
      right: rightParens,
      parenthesization: `(${leftParens} × ${rightParens})`,
      cost: String(dp[i][j]),
    },
    log: `dp[${i + 1}][${j + 1}] split at k=${k + 1}: (${leftParens} × ${rightParens})`,
    path: path.map((c) => [...c]),
  });

  emitBacktrackSteps(emit, split, dp, dims, i, k, path);
  emitBacktrackSteps(emit, split, dp, dims, k + 1, j, path);
}

function buildInitTable(dp, cellStates, n) {
  const table = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push({ value: dp[i][j], state: cellStates[i][j] });
      } else if (i < j) {
        row.push({ value: null, state: "empty" });
      } else {
        row.push({ value: null, state: "empty" });
      }
    }
    table.push(row);
  }
  return table;
}

function deepCopy(table) {
  return table.map((row) => row.map((cell) => ({ ...cell })));
}
