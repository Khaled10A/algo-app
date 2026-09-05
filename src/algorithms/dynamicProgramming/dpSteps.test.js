import { describe, expect, it } from "vitest";
import { createEventCollector } from "../../core/execution/events";
import { projectDPEvents } from "./dpSteps";

// ── Line map used by all tests ──
const TEST_LINE_MAP = {
  init: 0,
  "compare-cell": 1,
  "compute-cell": 2,
  "skip-cell": 2,
  "backtrack-start": 3,
  "backtrack-step": 4,
  complete: 5,
};

// ── Helper: build a simple 2×2 init event ──
function initEvent(table) {
  const rows = table.length;
  const cols = table[0]?.length ?? 0;
  return {
    type: "init",
    table,
    rowLabels: Array.from({ length: rows }, (_, i) => String(i)),
    colLabels: Array.from({ length: cols }, (_, j) => String(j)),
    inputVars: { n: String(rows) },
    log: `Initialize ${rows}×${cols} table`,
  };
}

// ── Helper: empty DP cell ──
function cell(value) {
  return { value, state: "empty" };
}

// ──────────────────────────────────────────────────────────────
// Contract: snapshot schema
// ──────────────────────────────────────────────────────────────
describe("DP snapshot schema", () => {
  const events = [
    initEvent([
      [cell(0), cell(null)],
      [cell(null), cell(null)],
    ]),
    {
      type: "compute-cell",
      cell: [1, 1],
      value: 5,
      dependencies: [[0, 0]],
      vars: { i: "1", j: "1" },
      log: "dp[1][1] = 5",
    },
    {
      type: "complete",
      answer: "5",
      log: "Done — answer: 5",
    },
  ];

  const steps = projectDPEvents(events, {
    lineMap: TEST_LINE_MAP,
    label: "testAlgo",
  });

  it("produces one step per event", () => {
    expect(steps).toHaveLength(3);
  });

  it("every step has required debug fields", () => {
    for (const s of steps) {
      expect(typeof s.activeLine).toBe("number");
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(typeof s.log).toBe("string");
      expect(s.log.length).toBeGreaterThan(0);
      expect(s.vars).toBeDefined();
      expect(typeof s.vars).toBe("object");
      expect(s.memory).toBeDefined();
      expect(typeof s.memory).toBe("object");
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack.length).toBeGreaterThan(0);
    }
  });

  it("every step has DP-specific fields", () => {
    for (const s of steps) {
      expect(Array.isArray(s.table)).toBe(true);
      expect(Array.isArray(s.rowLabels)).toBe(true);
      expect(Array.isArray(s.colLabels)).toBe(true);
      expect(typeof s.phase).toBe("string");
      expect(Array.isArray(s.backtrackPath)).toBe(true);
      expect(typeof s.complete).toBe("boolean");
    }
  });

  it("every table cell has { value, state } shape", () => {
    for (const s of steps) {
      for (const row of s.table) {
        for (const cell of row) {
          expect(cell).toHaveProperty("value");
          expect(cell).toHaveProperty("state");
          expect(
            ["empty", "computed", "comparing", "current", "backtrack", "backtrack-path"],
          ).toContain(cell.state);
        }
      }
    }
  });

  it("steps are immutable (deep copies)", () => {
    const s0 = steps[0];
    const s1 = steps[1];
    // Mutating step 0's table should not affect step 1
    s0.table[0][0].value = 999;
    expect(s1.table[0][0].value).not.toBe(999);
  });

  it("init step creates the table with correct dimensions", () => {
    const s0 = steps[0];
    expect(s0.table).toHaveLength(2);
    expect(s0.table[0]).toHaveLength(2);
    expect(s0.rowLabels).toEqual(["0", "1"]);
    expect(s0.colLabels).toEqual(["0", "1"]);
  });

  it("compute-cell marks the current cell", () => {
    const s1 = steps[1];
    expect(s1.current).toEqual([1, 1]);
    expect(s1.table[1][1].value).toBe(5);
    expect(s1.table[1][1].state).toBe("current");
  });

  it("compute-cell highlights dependency cells", () => {
    const s1 = steps[1];
    expect(s1.compares).toEqual([[0, 0]]);
    expect(s1.table[0][0].state).toBe("comparing");
  });

  it("complete step sets answer and complete flag", () => {
    const s2 = steps[2];
    expect(s2.complete).toBe(true);
    expect(s2.answer).toBe("5");
    expect(s2.current).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────
// Contract: phase transitions
// ──────────────────────────────────────────────────────────────
describe("DP phase transitions", () => {
  it("starts in fill phase, transitions to backtrack", () => {
    const events = [
      initEvent([[cell(0)]]),
      { type: "compute-cell", cell: [0, 0], value: 1, log: "fill" },
      { type: "backtrack-start", log: "start backtrack" },
      { type: "backtrack-step", cell: [0, 0], path: [[0, 0]], answer: "a", log: "backtrack" },
      { type: "complete", answer: "a", log: "done" },
    ];
    const steps = projectDPEvents(events, {
      lineMap: TEST_LINE_MAP,
      label: "test",
    });

    expect(steps[0].phase).toBe("fill");
    expect(steps[1].phase).toBe("fill");
    expect(steps[2].phase).toBe("backtrack");
    expect(steps[3].phase).toBe("backtrack");
    expect(steps[4].phase).toBe("backtrack");
  });

  it("backtrack path accumulates across steps", () => {
    const events = [
      initEvent([[cell(0), cell(0)], [cell(0), cell(0)]]),
      { type: "backtrack-start", log: "start" },
      { type: "backtrack-step", cell: [1, 1], path: [[1, 1]], log: "b1" },
      { type: "backtrack-step", cell: [0, 0], path: [[1, 1], [0, 0]], log: "b2" },
    ];
    const steps = projectDPEvents(events, {
      lineMap: TEST_LINE_MAP,
      label: "test",
    });

    expect(steps[2].backtrackPath).toEqual([[1, 1]]);
    expect(steps[3].backtrackPath).toEqual([[1, 1], [0, 0]]);
  });
});

// ──────────────────────────────────────────────────────────────
// Contract: event determinism
// ──────────────────────────────────────────────────────────────
describe("DP event determinism", () => {
  it("same events produce identical steps", () => {
    const events = [
      initEvent([[cell(0), cell(null)], [cell(null), cell(0)]]),
      {
        type: "compute-cell",
        cell: [0, 1],
        value: 3,
        dependencies: [],
        vars: {},
        log: "compute",
      },
      {
        type: "compute-cell",
        cell: [1, 0],
        value: 4,
        dependencies: [],
        vars: {},
        log: "compute",
      },
      { type: "complete", answer: "7", log: "done" },
    ];

    const run1 = projectDPEvents(events, { lineMap: TEST_LINE_MAP, label: "x" });
    const run2 = projectDPEvents(events, { lineMap: TEST_LINE_MAP, label: "x" });

    expect(run1).toEqual(run2);
  });
});

// ──────────────────────────────────────────────────────────────
// Contract: activeLine stays within codeLines bounds
// ──────────────────────────────────────────────────────────────
describe("DP activeLine bounds", () => {
  it("all activeLine values are within 0..5 (TEST_LINE_MAP range)", () => {
    const events = [
      initEvent([[cell(0), cell(null)]]),
      { type: "compare-cell", cell: [0, 1], dependencies: [[0, 0]], log: "read" },
      { type: "compute-cell", cell: [0, 1], value: 1, dependencies: [], log: "write" },
      { type: "skip-cell", cell: [0, 0], value: 0, log: "base" },
      { type: "backtrack-start", log: "bt" },
      { type: "backtrack-step", cell: [0, 1], path: [[0, 1]], log: "bt" },
      { type: "complete", answer: "1", log: "done" },
    ];

    const steps = projectDPEvents(events, { lineMap: TEST_LINE_MAP, label: "test" });
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThanOrEqual(5);
    }
  });

  it("unknown event types fall back to lineMap.complete", () => {
    const events = [
      initEvent([[cell(0)]]),
      { type: "some-unknown-event", log: "weird" },
    ];
    const steps = projectDPEvents(events, { lineMap: TEST_LINE_MAP, label: "test" });
    expect(steps[1].activeLine).toBe(TEST_LINE_MAP.complete);
  });
});

// ──────────────────────────────────────────────────────────────
// Contract: terminal step
// ──────────────────────────────────────────────────────────────
describe("DP terminal step", () => {
  it("last step has complete=true and log matches terminal pattern", () => {
    const events = [
      initEvent([[cell(0)]]),
      { type: "compute-cell", cell: [0, 0], value: 1, log: "fill" },
      { type: "complete", answer: "42", log: "Done — answer: 42" },
    ];
    const steps = projectDPEvents(events, { lineMap: TEST_LINE_MAP, label: "test" });

    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.log).toMatch(/Done|complete|answer/i);
  });
});

// ──────────────────────────────────────────────────────────────
// Contract: tableLabels callback
// ──────────────────────────────────────────────────────────────
describe("DP tableLabels callback", () => {
  it("uses custom labels when provided", () => {
    const events = [
      {
        type: "init",
        table: [[cell(0), cell(null)]],
        inputVars: {},
        log: "init",
      },
      { type: "complete", answer: "", log: "done" },
    ];

    const steps = projectDPEvents(events, {
      lineMap: TEST_LINE_MAP,
      label: "test",
      tableLabels: () => ({
        rowLabels: ["Row0"],
        colLabels: ["Col0", "Col1"],
      }),
    });

    expect(steps[0].rowLabels).toEqual(["Row0"]);
    expect(steps[0].colLabels).toEqual(["Col0", "Col1"]);
  });
});

// ──────────────────────────────────────────────────────────────
// Contract: 1D DP (single-row table)
// ──────────────────────────────────────────────────────────────
describe("DP 1D table support", () => {
  it("handles a single-row table (e.g. Fibonacci)", () => {
    const events = [
      initEvent([[cell(0), cell(1), cell(null), cell(null), cell(null)]]),
      {
        type: "compute-cell",
        cell: [0, 2],
        value: 1,
        dependencies: [[0, 1], [0, 0]],
        vars: { i: "2" },
        log: "dp[2] = dp[1] + dp[0] = 1",
      },
      {
        type: "complete",
        answer: "1",
        log: "Done",
      },
    ];

    const steps = projectDPEvents(events, { lineMap: TEST_LINE_MAP, label: "fib" });

    expect(steps[0].table).toHaveLength(1);
    expect(steps[0].table[0]).toHaveLength(5);
    expect(steps[1].table[0][2].value).toBe(1);
    expect(steps[1].current).toEqual([0, 2]);
  });
});

// ──────────────────────────────────────────────────────────────
// Contract: createEventCollector integration
// ──────────────────────────────────────────────────────────────
describe("DP events from collector", () => {
  it("works with real createEventCollector output", () => {
    const { emit, events } = createEventCollector();

    emit("init", {
      table: [[cell(0), cell(null)], [cell(null), cell(null)]],
      rowLabels: ["0", "1"],
      colLabels: ["0", "1"],
      inputVars: { n: "2" },
      log: "Init 2×2",
    });

    emit("compute-cell", {
      cell: [0, 1],
      value: 1,
      dependencies: [],
      vars: { i: "0", j: "1" },
      log: "dp[0][1] = 1",
    });

    emit("complete", { answer: "1", log: "Done — answer: 1" });

    const steps = projectDPEvents(events, { lineMap: TEST_LINE_MAP, label: "test" });

    expect(steps).toHaveLength(3);
    expect(steps[0].phase).toBe("fill");
    expect(steps[1].table[0][1].value).toBe(1);
    expect(steps[2].complete).toBe(true);
  });
});
