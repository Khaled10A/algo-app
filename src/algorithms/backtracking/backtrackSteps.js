/**
 * Shared Backtracking projector — maps deterministic event sequences into
 * debugger snapshot schema.
 *
 * Every backtracking algorithm emits the same event vocabulary via
 * createEventCollector(); this projector turns the stream into snapshots
 * consumable by BacktrackDebuggerTab and tree/board visualizations.
 *
 * Event vocabulary:
 *   init            — initial state shown
 *   enter           — entering recursive call at given depth
 *   choose          — making a choice from available options
 *   constraint-check — checking if a choice is valid
 *   solution        — found a valid complete solution
 *   prune           — branch pruned (infeasible)
 *   backtrack       — undoing a choice, returning to parent
 *   complete        — all exploration done
 *
 * Snapshot schema:
 *   { activeLine, log, vars, memory, callStack,
 *     depth, phase, state, candidates, chosen, removed,
 *     valid, pruneReason, solutions, currentSolution, solutionIndex,
 *     highlightCells, removedCells, complete, nodeId, parentId,
 *     nodeStatus, explored }
 *
 * Pure and deterministic: one event → one snapshot.
 */

/**
 * @param {Array} events  – from createEventCollector
 * @param {Object} opts
 * @param {Object} opts.lineMap      – event-type → code-line number
 * @param {string} opts.label        – algorithm label for callStack root
 * @param {Function} [opts.stateSerializer] – (state) → string for memory panel
 */
export function projectBacktrackEvents(
  events,
  { lineMap, label = "solve", stateSerializer },
) {
  let depth = 0;
  let phase = "explore";
  let currentState = null;
  let candidates = [];
  let chosen = null;
  let removed = null;
  let valid = null;
  let pruneReason = null;
  let solutions = [];
  let currentSolution = null;
  let solutionIndex = -1;
  let highlightCells = null;
  let removedCells = null;
  let complete = false;
  let explored = 0;
  let nodeId = 0;
  let parentId = null;

  const steps = [];

  // Track the path from root to current node for call stack
  const depthLabels = [];

  const snap = (event) => {
    const vars = {};
    const memory = {};
    const callStack = [`${label}(input)`];
    let log = "";

    switch (event.type) {
      case "init": {
        depth = 0;
        phase = "explore";
        currentState = event.state != null ? deepCopyState(event.state) : null;
        candidates = [];
        chosen = null;
        removed = null;
        valid = null;
        pruneReason = null;
        solutions = [];
        currentSolution = null;
        solutionIndex = -1;
        highlightCells = null;
        removedCells = null;
        complete = false;
        explored = 0;
        nodeId = 0;
        parentId = null;
        depthLabels.length = 0;

        Object.assign(vars, event.inputVars || {});
        Object.assign(memory, {
          state: serializeState(currentState, stateSerializer),
          solutions: "0 found",
        });
        callStack.push("  └ initialize");
        log = event.log || "Initialize state";
        break;
      }

      case "enter": {
        depth = event.depth ?? depth + 1;
        phase = "explore";
        currentState =
          event.state != null ? deepCopyState(event.state) : currentState;
        candidates = event.candidates || [];
        chosen = null;
        removed = null;
        valid = null;
        pruneReason = null;
        currentSolution = null;
        solutionIndex = -1;
        highlightCells = null;
        removedCells = null;

        // Track depth labels for call stack
        while (depthLabels.length < depth) depthLabels.push("");
        depthLabels[depth - 1] = event.label || `depth ${depth}`;

        Object.assign(vars, {
          depth: String(depth),
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          state: serializeState(currentState, stateSerializer),
          candidates: formatList(candidates),
          solutions: `${solutions.length} found`,
        });
        buildCallStack(callStack, depthLabels);
        log = event.log || `Enter depth ${depth}`;
        break;
      }

      case "choose": {
        depth = event.depth ?? depth;
        currentState =
          event.state != null ? deepCopyState(event.state) : currentState;
        candidates = event.candidates || candidates;
        chosen =
          event.candidate != null ? deepCopyValue(event.candidate) : null;
        removed = null;
        valid = null;
        pruneReason = null;
        currentSolution = null;
        solutionIndex = -1;
        highlightCells = event.highlightCells || null;
        removedCells = null;
        explored++;

        Object.assign(vars, {
          depth: String(depth),
          choice: formatValue(chosen),
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          state: serializeState(currentState, stateSerializer),
          candidates: formatList(candidates),
          explored: String(explored),
          solutions: `${solutions.length} found`,
        });
        buildCallStack(callStack, depthLabels);
        log = event.log || `Choose ${formatValue(chosen)}`;
        break;
      }

      case "constraint-check": {
        depth = event.depth ?? depth;
        valid = !!event.valid;
        pruneReason = event.reason || null;
        chosen =
          event.candidate != null ? deepCopyValue(event.candidate) : chosen;
        currentState =
          event.state != null ? deepCopyState(event.state) : currentState;
        highlightCells = event.highlightCells || null;
        removedCells = event.removedCells || null;

        Object.assign(vars, {
          depth: String(depth),
          choice: formatValue(chosen),
          valid: String(valid),
          ...(event.reason ? { reason: event.reason } : {}),
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          state: serializeState(currentState, stateSerializer),
          solutions: `${solutions.length} found`,
        });
        buildCallStack(callStack, depthLabels);
        log =
          event.log ||
          (valid
            ? `Constraint check: ${formatValue(chosen)} ✓`
            : `Constraint check: ${formatValue(chosen)} ✗ — ${event.reason || "invalid"}`);
        break;
      }

      case "solution": {
        depth = event.depth ?? depth;
        const sol =
          event.solution != null ? deepCopyValue(event.solution) : null;
        solutions = [...solutions, sol];
        currentSolution = sol;
        solutionIndex = solutions.length - 1;
        currentState =
          event.state != null ? deepCopyState(event.state) : currentState;
        highlightCells = event.highlightCells || null;
        removedCells = null;

        Object.assign(vars, {
          depth: String(depth),
          solutionCount: String(solutions.length),
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          state: serializeState(currentState, stateSerializer),
          solutions: formatSolutions(solutions),
        });
        buildCallStack(callStack, depthLabels);
        log = event.log || `Solution #${solutions.length} found`;
        break;
      }

      case "prune": {
        depth = event.depth ?? depth;
        phase = "backtrack";
        pruneReason = event.reason || "pruned";
        chosen =
          event.candidate != null ? deepCopyValue(event.candidate) : chosen;
        currentState =
          event.state != null ? deepCopyState(event.state) : currentState;
        highlightCells = event.highlightCells || null;
        removedCells = event.removedCells || null;

        Object.assign(vars, {
          depth: String(depth),
          choice: formatValue(chosen),
          reason: pruneReason,
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          state: serializeState(currentState, stateSerializer),
          solutions: `${solutions.length} found`,
        });
        buildCallStack(callStack, depthLabels);
        log = event.log || `Prune: ${pruneReason}`;
        break;
      }

      case "backtrack": {
        depth = event.depth ?? depth - 1;
        phase = "backtrack";
        removed = event.removed != null ? deepCopyValue(event.removed) : null;
        chosen = null;
        currentState =
          event.state != null ? deepCopyState(event.state) : currentState;
        candidates = event.candidates || candidates;
        valid = null;
        pruneReason = null;
        currentSolution = null;
        solutionIndex = -1;
        highlightCells = null;
        removedCells = event.removedCells || null;

        // Trim depth labels
        while (depthLabels.length > depth) depthLabels.pop();

        Object.assign(vars, {
          depth: String(depth),
          ...(removed != null ? { removed: formatValue(removed) } : {}),
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          state: serializeState(currentState, stateSerializer),
          candidates: formatList(candidates),
          solutions: `${solutions.length} found`,
        });
        buildCallStack(callStack, depthLabels);
        log = event.log || `Backtrack from depth ${depth + 1}`;
        break;
      }

      case "complete": {
        complete = true;
        phase = "complete";
        currentState =
          event.state != null ? deepCopyState(event.state) : currentState;
        highlightCells = null;
        removedCells = null;

        Object.assign(vars, {
          phase: "done",
          totalSolutions: String(solutions.length),
          explored: String(explored),
          ...(event.vars || {}),
        });
        Object.assign(memory, {
          state: serializeState(currentState, stateSerializer),
          solutions: formatSolutions(solutions),
          explored: String(explored),
        });
        callStack.push("  └ done");
        log = event.log || `Done — ${solutions.length} solution(s) found`;
        break;
      }

      default:
        log = event.type;
    }

    steps.push({
      activeLine: lineMap[event.type] ?? lineMap.complete ?? 0,
      log,
      vars,
      memory,
      callStack,
      depth,
      phase,
      state: currentState != null ? deepCopyState(currentState) : null,
      candidates: [...candidates],
      chosen: chosen != null ? deepCopyValue(chosen) : null,
      removed: removed != null ? deepCopyValue(removed) : null,
      valid,
      pruneReason,
      solutions: solutions.map((s) => deepCopyValue(s)),
      currentSolution:
        currentSolution != null ? deepCopyValue(currentSolution) : null,
      solutionIndex,
      highlightCells: highlightCells ? highlightCells.map((c) => [...c]) : null,
      removedCells: removedCells ? removedCells.map((c) => [...c]) : null,
      complete,
      nodeId,
      parentId,
      explored,
    });

    // Increment node ID for tree construction
    nodeId++;
  };

  for (const event of events) snap(event);
  return steps;
}

// ── Helpers ──────────────────────────────────────────────────

function deepCopyState(state) {
  return deepCopy(state);
}

function deepCopy(val) {
  if (val == null) return val;
  if (Array.isArray(val)) return val.map((item) => deepCopy(item));
  if (typeof val === "object") {
    const copy = {};
    for (const [k, v] of Object.entries(val)) {
      copy[k] = deepCopy(v);
    }
    return copy;
  }
  return val;
}

function deepCopyValue(val) {
  if (val == null) return val;
  if (Array.isArray(val)) return val.map((item) => deepCopyValue(item));
  if (typeof val === "object") {
    const copy = {};
    for (const [k, v] of Object.entries(val)) {
      copy[k] = deepCopyValue(v);
    }
    return copy;
  }
  return val;
}

function serializeState(state, serializer) {
  if (state == null) return "—";
  if (serializer) return serializer(state);
  if (typeof state === "string") return state;
  if (Array.isArray(state)) {
    return state
      .map((row) => {
        if (Array.isArray(row))
          return row
            .map((c) => {
              if (typeof c === "object" && c != null) return c.value ?? "·";
              return c == null ? "·" : String(c);
            })
            .join(" | ");
        return String(row);
      })
      .join("\n");
  }
  if (typeof state === "object") {
    return Object.entries(state)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(", ");
  }
  return String(state);
}

function formatValue(val) {
  if (val == null) return "—";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return `[${val.join(", ")}]`;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function formatList(arr) {
  if (!arr || arr.length === 0) return "—";
  return arr.map(formatValue).join(", ");
}

function formatSolutions(solutions) {
  if (solutions.length === 0) return "0 found";
  const preview = solutions.slice(0, 3).map(formatValue).join("; ");
  if (solutions.length > 3) {
    return `${solutions.length} found (${preview}; ...)`;
  }
  return `${solutions.length} found (${preview})`;
}

function buildCallStack(callStack, depthLabels) {
  for (let i = 0; i < depthLabels.length; i++) {
    const indent = "  ".repeat(i + 1);
    callStack.push(`${indent}└ ${depthLabels[i] || `level ${i + 1}`}`);
  }
}
