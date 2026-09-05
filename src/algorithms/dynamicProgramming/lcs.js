import { createEventCollector } from "../../core/execution/events";

/**
 * Longest Common Subsequence — Bottom-Up Tabulation with Solution Reconstruction.
 *
 * O(m·n) time, O(m·n) space.
 *
 * Emits events for every DP table cell computation and backtracking step.
 *
 * Returns { length, lcsString, events }.
 */
export function lcs(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    throw new Error("Both inputs must be strings");
  }

  const m = a.length;
  const n = b.length;

  const { emit, events } = createEventCollector();

  // ── Edge case: either string empty ──
  if (m === 0 || n === 0) {
    emit("init", {
      table: [[{ value: 0, state: "computed" }]],
      rowLabels: buildRowLabels(a),
      colLabels: buildColLabels(b),
      inputVars: {
        m: String(m),
        n: String(n),
        A: a || "(empty)",
        B: b || "(empty)",
      },
      log: `LCS — "${a || ""}" vs "${b || ""}" — one string is empty`,
    });
    emit("complete", {
      answer: "(none)",
      vars: { length: "0", lcs: "(none)" },
      log: "Done — LCS length: 0, no common subsequence",
    });
    return { length: 0, lcsString: "", events };
  }

  // ── Build DP table (m+1 rows × n+1 cols) ──
  const dp = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );

  // Track cell states for visualization
  const cellStates = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => "empty"),
  );
  // Row 0 and column 0 are base cases (all zeros)
  for (let j = 0; j <= n; j++) cellStates[0][j] = "computed";
  for (let i = 0; i <= m; i++) cellStates[i][0] = "computed";

  const initTable = buildInitTable(dp, cellStates, m, n);

  emit("init", {
    table: deepCopy(initTable),
    rowLabels: buildRowLabels(a),
    colLabels: buildColLabels(b),
    inputVars: {
      m: String(m),
      n: String(n),
      A: a,
      B: b,
    },
    log: `LCS — "${a}" vs "${b}" — table ${m + 1}×${n + 1}`,
  });

  // ── Fill phase ──
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cell = [i, j];

      if (a[i - 1] === b[j - 1]) {
        // Characters match — extend diagonal
        const diag = dp[i - 1][j - 1];
        dp[i][j] = diag + 1;
        cellStates[i][j] = "computed";

        emit("compare-cell", {
          cell,
          dependencies: [[i - 1, j - 1]],
          vars: {
            i: String(i),
            j: String(j),
            "A[i-1]": a[i - 1],
            "B[j-1]": b[j - 1],
            match: "✓",
            "dp[i-1][j-1]": String(diag),
            "dp[i][j]": String(dp[i][j]),
          },
          log: `A[${i}]='${a[i - 1]}' == B[${j}]='${b[j - 1]}' → dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${diag} + 1 = ${dp[i][j]}`,
        });

        emit("compute-cell", {
          cell,
          value: dp[i][j],
          dependencies: [[i - 1, j - 1]],
          vars: {
            i: String(i),
            j: String(j),
            "A[i-1]": a[i - 1],
            "B[j-1]": b[j - 1],
            match: "✓",
            "dp[i-1][j-1]": String(diag),
            "dp[i][j]": String(dp[i][j]),
          },
          log: `dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${diag} + 1 = ${dp[i][j]}`,
        });
      } else {
        // Characters don't match — take max of up or left
        const up = dp[i - 1][j];
        const left = dp[i][j - 1];
        const won = up >= left;

        emit("compare-cell", {
          cell,
          dependencies: [
            [i - 1, j],
            [i, j - 1],
          ],
          vars: {
            i: String(i),
            j: String(j),
            "A[i-1]": a[i - 1],
            "B[j-1]": b[j - 1],
            match: "✗",
            "dp[i-1][j]": String(up),
            "dp[i][j-1]": String(left),
            chosen: won ? "up" : "left",
          },
          log: `A[${i}]='${a[i - 1]}' ≠ B[${j}]='${b[j - 1]}' → max(up=${up}, left=${left}) → ${won ? "UP" : "LEFT"}`,
        });

        dp[i][j] = won ? up : left;
        cellStates[i][j] = "computed";

        emit("compute-cell", {
          cell,
          value: dp[i][j],
          dependencies: [
            [i - 1, j],
            [i, j - 1],
          ],
          vars: {
            i: String(i),
            j: String(j),
            "A[i-1]": a[i - 1],
            "B[j-1]": b[j - 1],
            match: "✗",
            "dp[i-1][j]": String(up),
            "dp[i][j-1]": String(left),
            chosen: won ? "up" : "left",
            "dp[i][j]": String(dp[i][j]),
          },
          log: `dp[${i}][${j}] = max(dp[${i - 1}][${j}]=${up}, dp[${i}][${j - 1}]=${left}) = ${dp[i][j]}`,
        });
      }
    }
  }

  // ── Solution reconstruction ──
  const resultChars = [];

  emit("backtrack-start", {
    cell: [m, n],
    answer: String(dp[m][n]),
    vars: {
      "lcs length": String(dp[m][n]),
      phase: "backtrack",
    },
    log: `Fill complete — LCS length = ${dp[m][n]}. Starting reconstruction from dp[${m}][${n}]`,
  });

  let i = m;
  let j = n;
  const backtrackPath = [[i, j]];

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      // Characters match — this character is part of LCS
      resultChars.push(a[i - 1]);
      emit("backtrack-step", {
        cell: [i, j],
        dependencies: [[i - 1, j - 1]],
        answer: String(dp[m][n]),
        vars: {
          i: String(i),
          j: String(j),
          decision: "MATCH",
          "A[i-1]": a[i - 1],
          "B[j-1]": b[j - 1],
          "dp[i][j]": String(dp[i][j]),
          direction: "diagonal ↖",
          "LCS so far": resultChars.slice().reverse().join(""),
        },
        log: `A[${i}]='${a[i - 1]}' == B[${j}]='${b[j - 1]}' → MATCH → LCS: "${resultChars.slice().reverse().join("")}"`,
        path: [...backtrackPath],
      });
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      // Move up
      emit("backtrack-step", {
        cell: [i, j],
        dependencies: [[i - 1, j]],
        answer: String(dp[m][n]),
        vars: {
          i: String(i),
          j: String(j),
          decision: "SKIP A[i]",
          "A[i-1]": a[i - 1],
          "dp[i][j]": String(dp[i][j]),
          "dp[i-1][j]": String(dp[i - 1][j]),
          direction: "up ↑",
          "LCS so far": resultChars.slice().reverse().join(""),
        },
        log: `dp[${i - 1}][${j}]=${dp[i - 1][j]} ≥ dp[${i}][${j - 1}]=${dp[i][j - 1]} → move UP (skip A[${i}]='${a[i - 1]}')`,
        path: [...backtrackPath],
      });
      i -= 1;
    } else {
      // Move left
      emit("backtrack-step", {
        cell: [i, j],
        dependencies: [[i, j - 1]],
        answer: String(dp[m][n]),
        vars: {
          i: String(i),
          j: String(j),
          decision: "SKIP B[j]",
          "B[j-1]": b[j - 1],
          "dp[i][j]": String(dp[i][j]),
          "dp[i][j-1]": String(dp[i][j - 1]),
          direction: "left ←",
          "LCS so far": resultChars.slice().reverse().join(""),
        },
        log: `dp[${i}][${j - 1}]=${dp[i][j - 1]} > dp[${i - 1}][${j}]=${dp[i - 1][j]} → move LEFT (skip B[${j}]='${b[j - 1]}')`,
        path: [...backtrackPath],
      });
      j -= 1;
    }

    backtrackPath.unshift([i, j]);
  }

  // Reverse to get LCS in correct order
  resultChars.reverse();
  const lcsString = resultChars.join("");

  emit("complete", {
    answer: lcsString || "(none)",
    vars: {
      "lcs length": String(dp[m][n]),
      lcs: lcsString || "(none)",
      A: a,
      B: b,
    },
    log: lcsString
      ? `Done — LCS length: ${dp[m][n]}, LCS: "${lcsString}"`
      : `Done — LCS length: 0, no common subsequence`,
  });

  return { length: dp[m][n], lcsString, events };
}

// ── Helpers ──────────────────────────────────────────────────

function buildRowLabels(a) {
  const labels = ['" " (base)'];
  for (let i = 0; i < a.length; i++) labels.push(`'${a[i]}'`);
  return labels;
}

function buildColLabels(b) {
  const labels = ['" " (base)'];
  for (let j = 0; j < b.length; j++) labels.push(`'${b[j]}'`);
  return labels;
}

function buildInitTable(dp, cellStates, m, n) {
  const table = [];
  for (let i = 0; i <= m; i++) {
    const row = [];
    for (let j = 0; j <= n; j++) {
      row.push({ value: dp[i][j], state: cellStates[i][j] });
    }
    table.push(row);
  }
  return table;
}

function deepCopy(table) {
  return table.map((row) => row.map((cell) => ({ ...cell })));
}
