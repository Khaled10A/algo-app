/**
 * Shared DP projector — maps deterministic event sequences into the
 * debugger snapshot schema.
 *
 * Every DP algorithm emits the same event vocabulary via
 * createEventCollector(); this projector turns the stream into
 * snapshots consumable by DPDebuggerTab and DPTableView.
 *
 * Event vocabulary:
 *   init              — table created, input set
 *   compute-cell      — writing dp[row][col]
 *   compare-cell      — reading a dependency cell
 *   skip-cell         — base-case or pruning
 *   backtrack-start   — fill complete, begin reconstruction
 *   backtrack-step    — one cell on the backtracking path
 *   complete          — done
 *
 * Snapshot schema:
 *   { activeLine, log, vars, memory, callStack,
 *     table, rowLabels, colLabels,
 *     current, compares,
 *     phase, backtrackPath, answer, complete }
 *
 * Pure and deterministic: one event → one snapshot.
 */

/**
 * @param {Array} events  – from createEventCollector
 * @param {Object} opts
 * @param {Object} opts.lineMap      – event-type → code-line number
 * @param {string} opts.label        – algorithm label for callStack root
 * @param {Function} [opts.tableLabels] – (meta) → { rowLabels, colLabels }
 */
export function projectDPEvents(events, { lineMap, label = "dp", tableLabels }) {
  let table = [];
  let rowLabels = [];
  let colLabels = [];
  let current = null;
  let compares = [];
  let phase = "fill";
  let backtrackPath = [];
  let answer = null;
  let complete = false;

  const steps = [];

  const snap = (event) => {
    const vars = {};
    const memory = {};
    const callStack = [`${label}(input)`];
    let log = "";

    switch (event.type) {
      case "init": {
        table = deepCopyTable(event.table);
        if (tableLabels) {
          const labels = tableLabels(event);
          rowLabels = labels.rowLabels || [];
          colLabels = labels.colLabels || [];
        } else {
          rowLabels = event.rowLabels || [];
          colLabels = event.colLabels || [];
        }
        current = null;
        compares = [];
        phase = "fill";
        backtrackPath = [];
        answer = null;
        complete = false;
        Object.assign(vars, event.inputVars || {});
        Object.assign(memory, {
          table: formatTable(table),
          dimensions: `${table.length}×${table[0]?.length ?? 0}`,
        });
        callStack.push("  └ initialize table");
        log = event.log || `Initialize ${table.length}×${table[0]?.length ?? 0} DP table`;
        break;
      }

      case "compare-cell": {
        const [r, c] = event.cell || [0, 0];
        current = [r, c];
        compares = event.dependencies || [];
        // Highlight the dependency cells being read
        markCells(table, compares, "comparing");
        Object.assign(vars, {
          row: String(r),
          col: String(c),
          ...(event.vars || {}),
        });
        Object.assign(memory, { table: formatTable(table) });
        callStack.push(`  └ read dp[${r}][${c}]`);
        log = event.log || `Reading dependency dp[${r}][${c}]`;
        break;
      }

      case "compute-cell": {
        const [r, c] = event.cell || [0, 0];
        current = [r, c];
        compares = event.dependencies || [];
        // Clear previous highlights, set current cell
        clearTransient(table);
        if (table[r] && table[r][c]) {
          table[r][c].value = event.value;
          table[r][c].state = "current";
        }
        // Highlight dependencies
        markCells(table, compares, "comparing");
        Object.assign(vars, {
          row: String(r),
          col: String(c),
          value: String(event.value ?? ""),
          ...(event.vars || {}),
        });
        Object.assign(memory, { table: formatTable(table) });
        callStack.push(`  └ dp[${r}][${c}] = ${event.value}`);
        log = event.log || `dp[${r}][${c}] = ${event.value}`;
        break;
      }

      case "skip-cell": {
        const [r, c] = event.cell || [0, 0];
        current = [r, c];
        compares = [];
        clearTransient(table);
        if (table[r] && table[r][c]) {
          table[r][c].value = event.value;
          table[r][c].state = "computed";
        }
        Object.assign(vars, {
          row: String(r),
          col: String(c),
          ...(event.vars || {}),
        });
        Object.assign(memory, { table: formatTable(table) });
        callStack.push(`  └ dp[${r}][${c}] = ${event.value} (base case)`);
        log = event.log || `Base case: dp[${r}][${c}] = ${event.value}`;
        break;
      }

      case "backtrack-start": {
        phase = "backtrack";
        clearTransient(table);
        Object.assign(vars, {
          phase: "backtrack",
          answer: event.answer || "",
        });
        Object.assign(memory, { table: formatTable(table) });
        callStack.push("  └ backtracking");
        log = event.log || "Fill complete — starting backtracking";
        break;
      }

      case "backtrack-step": {
        const [r, c] = event.cell || [0, 0];
        current = [r, c];
        backtrackPath = event.path
          ? event.path.map((c) => [...c])
          : [...backtrackPath, [r, c]];
        // Mark the backtracking path on the table
        markCells(table, backtrackPath, "backtrack-path");
        if (table[r] && table[r][c]) {
          table[r][c].state = "backtrack";
        }
        answer = event.answer || answer;
        Object.assign(vars, {
          row: String(r),
          col: String(c),
          answer: String(answer ?? ""),
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          table: formatTable(table),
          answer: String(answer ?? ""),
        });
        callStack.push(`  └ backtrack dp[${r}][${c}]`);
        log = event.log || `Backtrack to dp[${r}][${c}]`;
        break;
      }

      case "complete": {
        complete = true;
        current = null;
        compares = [];
        clearTransient(table);
        // Mark final backtracking path
        if (backtrackPath.length > 0) {
          markCells(table, backtrackPath, "backtrack-path");
        }
        answer = event.answer || answer;
        Object.assign(vars, {
          phase: "done",
          answer: String(answer ?? ""),
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          table: formatTable(table),
          answer: String(answer ?? ""),
        });
        callStack.push("  └ done");
        log = event.log || `Done — answer: ${answer}`;
        break;
      }

      default:
        log = event.type;
    }

    // Mark all computed cells (cells with values that aren't transient)
    markComputed(table);

    steps.push({
      activeLine: lineMap[event.type] ?? lineMap.complete,
      log,
      vars,
      memory,
      callStack,
      table: deepCopyTable(table),
      rowLabels: [...rowLabels],
      colLabels: [...colLabels],
      current: current ? [...current] : null,
      compares: compares.map((c) => [...c]),
      phase,
      backtrackPath: backtrackPath.map((c) => [...c]),
      answer,
      complete,
    });
  };

  for (const event of events) snap(event);
  return steps;
}

// ── Helpers ──────────────────────────────────────────────────

function deepCopyTable(table) {
  return table.map((row) => row.map((cell) => ({ ...cell })));
}

function clearTransient(table) {
  for (const row of table) {
    for (const cell of row) {
      if (cell.state === "current" || cell.state === "comparing") {
        cell.state = cell.value != null ? "computed" : "empty";
      }
    }
  }
}

function markCells(table, cells, state) {
  for (const [r, c] of cells) {
    if (table[r] && table[r][c]) {
      table[r][c].state = state;
    }
  }
}

function markComputed(table) {
  for (const row of table) {
    for (const cell of row) {
      if (cell.value != null && cell.state === "empty") {
        cell.state = "computed";
      }
    }
  }
}

function formatTable(table) {
  return table
    .map((row) =>
      row
        .map((cell) => (cell.value == null ? "·" : String(cell.value)))
        .join(" | "),
    )
    .join("\n");
}
