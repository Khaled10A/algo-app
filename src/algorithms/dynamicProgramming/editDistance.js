import { createEventCollector } from "../../core/execution/events";

/**
 * Edit Distance (Levenshtein Distance) — Bottom-Up Tabulation with Reconstruction.
 *
 * O(m·n) time, O(m·n) space.
 *
 * Operations:
 *   DELETE:  dp[i-1][j] + 1   (delete from source)
 *   INSERT:  dp[i][j-1] + 1   (insert into source)
 *   REPLACE: dp[i-1][j-1] + 1 (replace in source)
 *   MATCH:   dp[i-1][j-1]     (characters already equal)
 *
 * Returns { distance, operations, events }.
 */
export function editDistance(source, target) {
  if (typeof source !== "string" || typeof target !== "string") {
    throw new Error("Both inputs must be strings");
  }

  const m = source.length;
  const n = target.length;

  const { emit, events } = createEventCollector();

  // ── Edge case: both empty ──
  if (m === 0 && n === 0) {
    emit("init", {
      table: [[{ value: 0, state: "computed" }]],
      rowLabels: buildRowLabels(source),
      colLabels: buildColLabels(target),
      inputVars: { m: "0", n: "0", source: "(empty)", target: "(empty)" },
      log: 'Edit Distance — "" vs "" — both strings empty',
    });
    emit("complete", {
      answer: "0",
      vars: { distance: "0", operations: "(none)" },
      log: "Done — distance: 0, no operations needed",
    });
    return { distance: 0, operations: [], events };
  }

  // ── Edge case: source empty ──
  if (m === 0) {
    const table = Array.from({ length: 1 }, () =>
      Array.from({ length: n + 1 }, (_, j) => ({
        value: j,
        state: "computed",
      })),
    );
    emit("init", {
      table: deepCopy(table),
      rowLabels: buildRowLabels(source),
      colLabels: buildColLabels(target),
      inputVars: { m: "0", n: String(n), source: "(empty)", target },
      log: `Edit Distance — "" vs "${target}" — insert all ${n} characters`,
    });
    const ops = target
      .split("")
      .map((ch) => ({ op: "INSERT", sourceChar: "", targetChar: ch }));
    emit("complete", {
      answer: String(n),
      vars: { distance: String(n), operations: `INSERT ×${n}` },
      log: `Done — distance: ${n}, operations: ${ops.map((o) => `${o.op}('${o.targetChar}')`).join(", ")}`,
    });
    return { distance: n, operations: ops, events };
  }

  // ── Edge case: target empty ──
  if (n === 0) {
    const table = Array.from({ length: m + 1 }, (_, i) => [
      { value: i, state: "computed" },
    ]);
    emit("init", {
      table: deepCopy(table),
      rowLabels: buildRowLabels(source),
      colLabels: buildColLabels(target),
      inputVars: { m: String(m), n: "0", source, target: "(empty)" },
      log: `Edit Distance — "${source}" vs "" — delete all ${m} characters`,
    });
    const ops = source
      .split("")
      .map((ch) => ({ op: "DELETE", sourceChar: ch, targetChar: "" }));
    emit("complete", {
      answer: String(m),
      vars: { distance: String(m), operations: `DELETE ×${m}` },
      log: `Done — distance: ${m}, operations: ${ops.map((o) => `${o.op}('${o.sourceChar}')`).join(", ")}`,
    });
    return { distance: m, operations: ops, events };
  }

  // ── Build DP table (m+1 rows × n+1 cols) ──
  const dp = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );

  // Track cell states for visualization
  const cellStates = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => "empty"),
  );

  // Base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
    cellStates[i][0] = "computed";
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
    cellStates[0][j] = "computed";
  }

  const initTable = buildInitTable(dp, cellStates, m, n);

  emit("init", {
    table: deepCopy(initTable),
    rowLabels: buildRowLabels(source),
    colLabels: buildColLabels(target),
    inputVars: {
      m: String(m),
      n: String(n),
      source,
      target,
    },
    log: `Edit Distance — "${source}" vs "${target}" — table ${m + 1}×${n + 1}`,
  });

  // ── Fill phase ──
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cell = [i, j];

      if (source[i - 1] === target[j - 1]) {
        // Characters match — no operation needed
        dp[i][j] = dp[i - 1][j - 1];
        cellStates[i][j] = "computed";

        emit("compare-cell", {
          cell,
          dependencies: [[i - 1, j - 1]],
          vars: {
            i: String(i),
            j: String(j),
            "source[i-1]": source[i - 1],
            "target[j-1]": target[j - 1],
            operation: "MATCH",
            "dp[i-1][j-1]": String(dp[i - 1][j - 1]),
          },
          log: `source[${i}]='${source[i - 1]}' == target[${j}]='${target[j - 1]}' → MATCH → dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}`,
        });

        emit("compute-cell", {
          cell,
          value: dp[i][j],
          dependencies: [[i - 1, j - 1]],
          vars: {
            i: String(i),
            j: String(j),
            "source[i-1]": source[i - 1],
            "target[j-1]": target[j - 1],
            operation: "MATCH",
            "dp[i-1][j-1]": String(dp[i - 1][j - 1]),
            "dp[i][j]": String(dp[i][j]),
          },
          log: `dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]} (MATCH)`,
        });
      } else {
        // Characters differ — find minimum of delete, insert, replace
        const del = dp[i - 1][j] + 1; // DELETE from source
        const ins = dp[i][j - 1] + 1; // INSERT into source
        const rep = dp[i - 1][j - 1] + 1; // REPLACE in source

        const minVal = Math.min(del, ins, rep);
        let op = "REPLACE";
        if (minVal === del) op = "DELETE";
        else if (minVal === ins) op = "INSERT";

        emit("compare-cell", {
          cell,
          dependencies: [
            [i - 1, j],
            [i, j - 1],
            [i - 1, j - 1],
          ],
          vars: {
            i: String(i),
            j: String(j),
            "source[i-1]": source[i - 1],
            "target[j-1]": target[j - 1],
            DELETE: `dp[${i - 1}][${j}]+1=${del}`,
            INSERT: `dp[${i}][${j - 1}]+1=${ins}`,
            REPLACE: `dp[${i - 1}][${j - 1}]+1=${rep}`,
            chosen: op,
          },
          log: `source[${i}]='${source[i - 1]}' ≠ target[${j}]='${target[j - 1]}' → DELETE=${del}, INSERT=${ins}, REPLACE=${rep} → ${op}=${minVal}`,
        });

        dp[i][j] = minVal;
        cellStates[i][j] = "computed";

        emit("compute-cell", {
          cell,
          value: dp[i][j],
          dependencies: [
            [i - 1, j],
            [i, j - 1],
            [i - 1, j - 1],
          ],
          vars: {
            i: String(i),
            j: String(j),
            "source[i-1]": source[i - 1],
            "target[j-1]": target[j - 1],
            DELETE: String(del),
            INSERT: String(ins),
            REPLACE: String(rep),
            chosen: op,
            "dp[i][j]": String(dp[i][j]),
          },
          log: `dp[${i}][${j}] = min(DELETE=${del}, INSERT=${ins}, REPLACE=${rep}) = ${dp[i][j]} (${op})`,
        });
      }
    }
  }

  // ── Solution reconstruction ──
  const operations = [];

  emit("backtrack-start", {
    cell: [m, n],
    answer: String(dp[m][n]),
    vars: {
      distance: String(dp[m][n]),
      phase: "backtrack",
    },
    log: `Fill complete — edit distance = ${dp[m][n]}. Starting reconstruction from dp[${m}][${n}]`,
  });

  let i = m;
  let j = n;
  const backtrackPath = [[i, j]];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && source[i - 1] === target[j - 1]) {
      // Characters match
      operations.unshift({
        op: "MATCH",
        sourceChar: source[i - 1],
        targetChar: target[j - 1],
      });
      emit("backtrack-step", {
        cell: [i, j],
        dependencies: [[i - 1, j - 1]],
        answer: String(dp[m][n]),
        vars: {
          i: String(i),
          j: String(j),
          decision: "MATCH",
          "source[i-1]": source[i - 1],
          "target[j-1]": target[j - 1],
          "dp[i][j]": String(dp[i][j]),
          direction: "diagonal ↖",
          "ops so far": formatOps(operations),
        },
        log: `source[${i}]='${source[i - 1]}' == target[${j}]='${target[j - 1]}' → MATCH (no cost)`,
        path: [...backtrackPath],
      });
      i -= 1;
      j -= 1;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // REPLACE
      operations.unshift({
        op: "REPLACE",
        sourceChar: source[i - 1],
        targetChar: target[j - 1],
      });
      emit("backtrack-step", {
        cell: [i, j],
        dependencies: [[i - 1, j - 1]],
        answer: String(dp[m][n]),
        vars: {
          i: String(i),
          j: String(j),
          decision: "REPLACE",
          "source[i-1]": source[i - 1],
          "target[j-1]": target[j - 1],
          "dp[i][j]": String(dp[i][j]),
          direction: "diagonal ↖",
          "ops so far": formatOps(operations),
        },
        log: `dp[${i}][${j}]=${dp[i][j]} == dp[${i - 1}][${j - 1}]+1=${dp[i - 1][j - 1] + 1} → REPLACE '${source[i - 1]}' → '${target[j - 1]}'`,
        path: [...backtrackPath],
      });
      i -= 1;
      j -= 1;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // DELETE
      operations.unshift({
        op: "DELETE",
        sourceChar: source[i - 1],
        targetChar: "",
      });
      emit("backtrack-step", {
        cell: [i, j],
        dependencies: [[i - 1, j]],
        answer: String(dp[m][n]),
        vars: {
          i: String(i),
          j: String(j),
          decision: "DELETE",
          "source[i-1]": source[i - 1],
          "dp[i][j]": String(dp[i][j]),
          "dp[i-1][j]": String(dp[i - 1][j]),
          direction: "up ↑",
          "ops so far": formatOps(operations),
        },
        log: `dp[${i}][${j}]=${dp[i][j]} == dp[${i - 1}][${j}]+1=${dp[i - 1][j] + 1} → DELETE '${source[i - 1]}'`,
        path: [...backtrackPath],
      });
      i -= 1;
    } else {
      // INSERT
      operations.unshift({
        op: "INSERT",
        sourceChar: "",
        targetChar: target[j - 1],
      });
      emit("backtrack-step", {
        cell: [i, j],
        dependencies: [[i, j - 1]],
        answer: String(dp[m][n]),
        vars: {
          i: String(i),
          j: String(j),
          decision: "INSERT",
          "target[j-1]": target[j - 1],
          "dp[i][j]": String(dp[i][j]),
          "dp[i][j-1]": String(dp[i][j - 1]),
          direction: "left ←",
          "ops so far": formatOps(operations),
        },
        log: `dp[${i}][${j}]=${dp[i][j]} == dp[${i}][${j - 1}]+1=${dp[i][j - 1] + 1} → INSERT '${target[j - 1]}'`,
        path: [...backtrackPath],
      });
      j -= 1;
    }

    backtrackPath.unshift([i, j]);
  }

  emit("complete", {
    answer: String(dp[m][n]),
    vars: {
      distance: String(dp[m][n]),
      operations: formatOps(operations),
      source,
      target,
    },
    log: `Done — distance: ${dp[m][n]}, operations: ${formatOps(operations)}`,
  });

  return { distance: dp[m][n], operations, events };
}

// ── Helpers ──────────────────────────────────────────────────

function buildRowLabels(source) {
  const labels = ['" " (base)'];
  for (let i = 0; i < source.length; i++) labels.push(`'${source[i]}'`);
  return labels;
}

function buildColLabels(target) {
  const labels = ['" " (base)'];
  for (let j = 0; j < target.length; j++) labels.push(`'${target[j]}'`);
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

function formatOps(ops) {
  if (ops.length === 0) return "(none)";
  return ops
    .map((o) => {
      if (o.op === "MATCH") return `${o.op}('${o.sourceChar}')`;
      if (o.op === "DELETE") return `${o.op}('${o.sourceChar}')`;
      if (o.op === "INSERT") return `${o.op}('${o.targetChar}')`;
      return `${o.op}('${o.sourceChar}'→'${o.targetChar}')`;
    })
    .join(", ");
}
