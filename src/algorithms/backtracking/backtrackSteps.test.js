import { describe, expect, it } from "vitest";
import { projectBacktrackEvents } from "./backtrackSteps";

const LINE_MAP = {
  init: 0,
  enter: 1,
  choose: 2,
  "constraint-check": 3,
  solution: 4,
  prune: 5,
  backtrack: 6,
  complete: 7,
};

const DEFAULT_OPTS = {
  lineMap: LINE_MAP,
  label: "test",
};

// ── Helper: build a simple 2-level exploration event stream ──

function simpleEvents() {
  return [
    { type: "init", state: { arr: [1, 2, 3] }, log: "Start" },
    {
      type: "enter",
      depth: 1,
      candidates: ["A", "B"],
      state: { arr: [1, 2, 3] },
      log: "Enter depth 1",
    },
    {
      type: "choose",
      depth: 1,
      candidate: "A",
      state: { arr: [1, 2, 3] },
      log: "Choose A",
    },
    {
      type: "constraint-check",
      depth: 1,
      valid: true,
      candidate: "A",
      log: "Check A: valid",
    },
    {
      type: "enter",
      depth: 2,
      candidates: ["X"],
      state: { arr: [1, 2, 3] },
      log: "Enter depth 2",
    },
    {
      type: "choose",
      depth: 2,
      candidate: "X",
      state: { arr: [1, 2, 3] },
      log: "Choose X",
    },
    {
      type: "constraint-check",
      depth: 2,
      valid: true,
      candidate: "X",
      log: "Check X: valid",
    },
    {
      type: "solution",
      depth: 2,
      solution: ["A", "X"],
      state: { arr: [1, 2, 3] },
      log: "Solution!",
    },
    {
      type: "backtrack",
      depth: 1,
      removed: "X",
      candidates: ["A", "B"],
      state: { arr: [1, 2, 3] },
      log: "Undo X",
    },
    {
      type: "choose",
      depth: 1,
      candidate: "B",
      state: { arr: [1, 2, 3] },
      log: "Choose B",
    },
    {
      type: "constraint-check",
      depth: 1,
      valid: false,
      candidate: "B",
      reason: "invalid",
      log: "Check B: invalid",
    },
    {
      type: "prune",
      depth: 1,
      reason: "invalid",
      candidate: "B",
      state: { arr: [1, 2, 3] },
      log: "Pruned",
    },
    {
      type: "backtrack",
      depth: 0,
      removed: "B",
      candidates: ["A", "B"],
      state: { arr: [1, 2, 3] },
      log: "Undo B",
    },
    { type: "complete", log: "Done" },
  ];
}

describe("projectBacktrackEvents", () => {
  it("produces a step for every event", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    expect(steps).toHaveLength(14);
  });

  it("each step has required fields", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    for (const s of steps) {
      expect(typeof s.activeLine).toBe("number");
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(typeof s.depth).toBe("number");
      expect(typeof s.phase).toBe("string");
      expect(typeof s.complete).toBe("boolean");
      expect(typeof s.explored).toBe("number");
    }
  });

  it("first step is init and last is complete", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    expect(steps[0].log).toContain("Start");
    expect(steps[0].complete).toBe(false);
    expect(steps[steps.length - 1].complete).toBe(true);
    expect(steps[steps.length - 1].log).toContain("Done");
  });

  it("tracks depth correctly through enter/backtrack", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    // Enter depth 1
    expect(steps[1].depth).toBe(1);
    // Choose at depth 1
    expect(steps[2].depth).toBe(1);
    // Enter depth 2
    expect(steps[4].depth).toBe(2);
    // Solution at depth 2
    expect(steps[7].depth).toBe(2);
    // Backtrack to depth 1
    expect(steps[8].depth).toBe(1);
  });

  it("records chosen values", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    // Choose A
    expect(steps[2].chosen).toBe("A");
    // Choose X
    expect(steps[6].chosen).toBe("X");
    // Choose B
    expect(steps[10].chosen).toBe("B");
  });

  it("records valid/invalid constraint checks", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    // Check A: valid
    expect(steps[3].valid).toBe(true);
    // Check X: valid
    expect(steps[7].valid).toBe(true);
    // Check B: invalid
    expect(steps[11].valid).toBe(false);
    expect(steps[11].pruneReason).toBe("invalid");
  });

  it("accumulates solutions", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    // After solution event
    expect(steps[7].solutions).toHaveLength(1);
    expect(steps[7].solutions[0]).toEqual(["A", "X"]);
    // After backtrack
    expect(steps[8].solutions).toHaveLength(1);
    // After complete
    expect(steps[13].solutions).toHaveLength(1);
  });

  it("increments explored count on choose events", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    // First choose (A)
    expect(steps[2].explored).toBe(1);
    // Second choose (X)
    expect(steps[6].explored).toBe(2);
    // Third choose (B)
    expect(steps[10].explored).toBe(3);
  });

  it("sets phase to backtrack during backtrack/prune events", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    // Prune event (step 11)
    expect(steps[11].phase).toBe("backtrack");
    // Backtrack event (step 12)
    expect(steps[12].phase).toBe("backtrack");
  });

  it("sets phase to complete on complete event", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    expect(steps[steps.length - 1].phase).toBe("complete");
  });

  it("maps event types to code lines via lineMap", () => {
    const steps = projectBacktrackEvents(simpleEvents(), DEFAULT_OPTS);
    expect(steps[0].activeLine).toBe(0); // init
    expect(steps[1].activeLine).toBe(1); // enter
    expect(steps[2].activeLine).toBe(2); // choose
    expect(steps[3].activeLine).toBe(3); // constraint-check
    expect(steps[7].activeLine).toBe(4); // solution
    expect(steps[11].activeLine).toBe(5); // prune
    expect(steps[13].activeLine).toBe(7); // complete
  });

  it("uses custom label in call stack", () => {
    const steps = projectBacktrackEvents(simpleEvents(), {
      ...DEFAULT_OPTS,
      label: "nQueens",
    });
    expect(steps[0].callStack[0]).toBe("nQueens(input)");
  });

  it("handles empty events array", () => {
    const steps = projectBacktrackEvents([], DEFAULT_OPTS);
    expect(steps).toHaveLength(0);
  });

  it("handles init-only event", () => {
    const events = [{ type: "init", state: { x: 1 }, log: "Begin" }];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps).toHaveLength(1);
    expect(steps[0].depth).toBe(0);
    expect(steps[0].log).toBe("Begin");
    expect(steps[0].complete).toBe(false);
  });

  it("handles solution-only (immediate solution)", () => {
    const events = [
      { type: "init", state: {}, log: "Start" },
      { type: "solution", depth: 0, solution: [1, 2, 3], log: "Found!" },
      { type: "complete", log: "Done" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps).toHaveLength(3);
    expect(steps[1].solutions).toHaveLength(1);
    expect(steps[1].currentSolution).toEqual([1, 2, 3]);
  });

  it("handles multiple solutions", () => {
    const events = [
      { type: "init", state: {}, log: "Start" },
      { type: "solution", depth: 1, solution: ["A", "B"], log: "Sol 1" },
      { type: "solution", depth: 1, solution: ["A", "C"], log: "Sol 2" },
      { type: "complete", log: "Done" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[1].solutions).toHaveLength(1);
    expect(steps[2].solutions).toHaveLength(2);
    expect(steps[2].solutions[0]).toEqual(["A", "B"]);
    expect(steps[2].solutions[1]).toEqual(["A", "C"]);
  });

  it("handles events with no optional fields", () => {
    const events = [
      { type: "init" },
      { type: "enter" },
      { type: "choose", candidate: "X" },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps).toHaveLength(4);
    expect(steps[0].depth).toBe(0);
    expect(steps[1].depth).toBe(1);
    expect(steps[2].chosen).toBe("X");
    expect(steps[3].complete).toBe(true);
  });
});

describe("snapshot immutability", () => {
  it("deep-copies state in each step", () => {
    const state = {
      board: [
        ["Q", "."],
        [".", "Q"],
      ],
    };
    const events = [
      { type: "init", state },
      { type: "enter", depth: 1, state },
      { type: "choose", depth: 1, candidate: "A", state },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);

    // Mutate original state
    state.board[0][0] = "X";

    // Steps should not be affected (they have deep copies)
    expect(steps[0].state.board[0][0]).toBe("Q");
    expect(steps[1].state.board[0][0]).toBe("Q");
    expect(steps[2].state.board[0][0]).toBe("Q");
  });

  it("deep-copies solutions in each step", () => {
    const sol = [1, 2, 3];
    const events = [
      { type: "init", state: {} },
      { type: "solution", depth: 1, solution: sol, log: "Sol" },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);

    // Mutate original
    sol.push(4);

    // Step should not be affected
    expect(steps[1].solutions[0]).toEqual([1, 2, 3]);
    expect(steps[1].currentSolution).toEqual([1, 2, 3]);
  });

  it("steps are independent — mutating one does not affect others", () => {
    const events = [
      { type: "init", state: { x: 1 } },
      { type: "enter", depth: 1, state: { x: 2 } },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);

    // Steps have their own copies
    expect(steps[0].state.x).toBe(1);
    expect(steps[1].state.x).toBe(2);
  });

  it("candidates array is deep-copied", () => {
    const candidates = ["A", "B"];
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, candidates, state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);

    candidates.push("C");
    expect(steps[1].candidates).toEqual(["A", "B"]);
  });
});

describe("complex event sequences", () => {
  it("handles deep recursion (4 levels)", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "enter", depth: 2, state: {} },
      { type: "choose", depth: 2, candidate: "B", state: {} },
      { type: "enter", depth: 3, state: {} },
      { type: "choose", depth: 3, candidate: "C", state: {} },
      { type: "enter", depth: 4, state: {} },
      { type: "choose", depth: 4, candidate: "D", state: {} },
      { type: "solution", depth: 4, solution: ["A", "B", "C", "D"], state: {} },
      { type: "backtrack", depth: 3, state: {} },
      { type: "backtrack", depth: 2, state: {} },
      { type: "backtrack", depth: 1, state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps).toHaveLength(14);
    expect(steps[8].depth).toBe(4);
    expect(steps[9].solutions).toHaveLength(1);
    expect(steps[13].complete).toBe(true);
  });

  it("handles rapid backtracking (all branches pruned)", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, candidates: ["A", "B", "C"], state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "prune", depth: 1, reason: "too heavy", state: {} },
      { type: "choose", depth: 1, candidate: "B", state: {} },
      { type: "prune", depth: 1, reason: "too expensive", state: {} },
      { type: "choose", depth: 1, candidate: "C", state: {} },
      { type: "prune", depth: 1, reason: "invalid", state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps).toHaveLength(9);
    expect(steps[3].pruneReason).toBe("too heavy");
    expect(steps[5].pruneReason).toBe("too expensive");
    expect(steps[7].pruneReason).toBe("invalid");
    expect(steps[8].solutions).toHaveLength(0);
    expect(steps[8].complete).toBe(true);
  });

  it("handles events with object/array state", () => {
    const board = [
      ["Q", ".", ".", "."],
      [".", ".", "Q", "."],
      [".", ".", ".", "Q"],
      [".", "Q", ".", "."],
    ];
    const events = [
      { type: "init", state: { board }, log: "Start" },
      {
        type: "solution",
        depth: 4,
        solution: board,
        state: { board },
        log: "Found!",
      },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].state.board).toEqual(board);
    expect(steps[1].solutions[0]).toEqual(board);
  });

  it("handles unknown event types gracefully", () => {
    const events = [
      { type: "init", state: {} },
      { type: "custom-event", data: "something" },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps).toHaveLength(3);
    expect(steps[1].log).toBe("custom-event");
  });
});

describe("vars and memory panels", () => {
  it("init includes inputVars", () => {
    const events = [
      { type: "init", state: {}, inputVars: { n: "4", target: "10" } },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].vars.n).toBe("4");
    expect(steps[0].vars.target).toBe("10");
  });

  it("choose includes choice in vars", () => {
    const events = [
      { type: "init", state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[1].vars.choice).toBe("A");
  });

  it("constraint-check includes valid in vars", () => {
    const events = [
      { type: "init", state: {} },
      { type: "constraint-check", depth: 1, valid: true, candidate: "A" },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[1].vars.valid).toBe("true");
  });

  it("prune includes reason in vars", () => {
    const events = [
      { type: "init", state: {} },
      { type: "prune", depth: 1, reason: "exceeds limit", state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[1].vars.reason).toBe("exceeds limit");
  });

  it("complete includes totalSolutions and explored", () => {
    const events = [
      { type: "init", state: {} },
      { type: "solution", depth: 1, solution: [1], state: {} },
      { type: "solution", depth: 1, solution: [2], state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[3].vars.totalSolutions).toBe("2");
    expect(steps[3].vars.explored).toBe("0");
  });

  it("memory tracks state as formatted string", () => {
    const events = [
      {
        type: "init",
        state: [
          ["Q", "."],
          [".", "Q"],
        ],
      },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].memory.state).toContain("Q");
  });

  it("memory tracks solutions count", () => {
    const events = [
      { type: "init", state: {} },
      { type: "solution", depth: 1, solution: [1], state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[1].memory.solutions).toContain("1 found");
  });
});

describe("call stack", () => {
  it("call stack grows with depth", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "enter", depth: 2, state: {} },
      { type: "enter", depth: 3, state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    // Each step has fresh callStack: root + depth path entries
    expect(steps[0].callStack.length).toBe(2); // root + init label
    expect(steps[1].callStack.length).toBe(2); // root + depth 1
    expect(steps[2].callStack.length).toBe(3); // root + depth1 + depth2
    expect(steps[3].callStack.length).toBe(4); // root + depth1 + depth2 + depth3
  });

  it("call stack shrinks on backtrack", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "enter", depth: 2, state: {} },
      { type: "backtrack", depth: 1, state: {} },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[2].callStack.length).toBe(3); // root + d1 + d2
    expect(steps[3].callStack.length).toBe(2); // root + d1 (shrunk)
  });
});

describe("stateSerializer option", () => {
  it("uses custom serializer when provided", () => {
    const serializer = (state) => `custom: ${JSON.stringify(state)}`;
    const events = [{ type: "init", state: { x: 42 } }, { type: "complete" }];
    const steps = projectBacktrackEvents(events, {
      ...DEFAULT_OPTS,
      stateSerializer: serializer,
    });
    expect(steps[0].memory.state).toBe('custom: {"x":42}');
  });

  it("falls back to default serialization when no serializer", () => {
    const events = [{ type: "init", state: { x: 42 } }, { type: "complete" }];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].memory.state).toContain("x: 42");
  });
});

describe("state formatting", () => {
  it("formats 2D array state as table", () => {
    const events = [
      {
        type: "init",
        state: [
          [1, 2],
          [3, 4],
        ],
      },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].memory.state).toContain("1 | 2");
    expect(steps[0].memory.state).toContain("3 | 4");
  });

  it("formats object state with nested arrays", () => {
    const events = [
      {
        type: "init",
        state: {
          board: [
            ["Q", "."],
            [".", "Q"],
          ],
        },
      },
      { type: "complete" },
    ];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].memory.state).toContain("board:");
    expect(steps[0].memory.state).toContain("Q");
  });

  it("formats string state directly", () => {
    const events = [{ type: "init", state: "hello" }, { type: "complete" }];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].memory.state).toBe("hello");
  });

  it("formats null state as dash", () => {
    const events = [{ type: "init", state: null }, { type: "complete" }];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].memory.state).toBe("—");
  });

  it("formats undefined state as dash", () => {
    const events = [{ type: "init" }, { type: "complete" }];
    const steps = projectBacktrackEvents(events, DEFAULT_OPTS);
    expect(steps[0].memory.state).toBe("—");
  });
});
