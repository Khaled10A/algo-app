import { describe, expect, it } from "vitest";
import { bellmanFord } from "./bellmanFord";
import { bellmanFordDebug, BELLMAN_FORD_LINE_MAP } from "./bellmanFordDebug";
import { GRAPH_BELLMAN_FORD_CODE_LINES } from "./descriptors";
import { dijkstra } from "./dijkstra";

const TASK_EXAMPLE = {
  A: [
    ["B", 4],
    ["C", 5],
  ],
  C: [["B", -3]],
  B: [],
};

describe("bellmanFord — correctness", () => {
  it("matches Dijkstra on a normal positive-weight graph", () => {
    const graph = {
      A: [
        ["B", 4],
        ["D", 2],
      ],
      B: [["C", 5]],
      D: [["B", 1]],
      C: [],
    };
    const bf = bellmanFord(graph, "A");
    const dj = dijkstra(graph, "A");
    expect(bf.distances).toEqual(dj.distances);
    expect(bf.previous).toEqual(dj.previous);
    expect(bf.negativeCycle).toBe(false);
  });

  it("handles the task example: negative edge improves the path (B = 2)", () => {
    const { distances, previous } = bellmanFord(TASK_EXAMPLE, "A");
    expect(distances).toEqual({ A: 0, B: 2, C: 5 });
    expect(previous.B).toBe("C");
    expect(previous.C).toBe("A");
  });

  it("requires multiple relaxation passes for cascading improvements", () => {
    const graph = {
      A: [
        ["B", 5],
        ["C", 2],
      ],
      C: [["B", -2]],
      B: [],
    };
    const { distances, events } = bellmanFord(graph, "A");
    expect(distances.B).toBe(0);
    const passes = events.filter((e) => e.type === "pass-start");
    expect(passes.length).toBeGreaterThanOrEqual(2);
    const bRelaxes = events.filter(
      (e) => e.type === "relax-edge" && e.to === "B",
    );
    expect(bRelaxes.length).toBeGreaterThanOrEqual(2);
  });

  it("stops early when a pass produces no changes", () => {
    const graph = {
      A: [
        ["B", 1],
        ["C", 1],
      ],
      B: [
        ["C", 1],
        ["D", 1],
      ],
      C: [["D", 1]],
      D: [],
    };
    const { events, earlyStopped, passes } = bellmanFord(graph, "A");
    expect(earlyStopped).toBe(true);
    expect(passes).toBe(2);
    const completions = events.filter((e) => e.type === "pass-complete");
    expect(completions.at(-1)).toMatchObject({ pass: 2, changes: 0 });
    const passStarts = events.filter((e) => e.type === "pass-start");
    expect(passStarts.map((e) => e.pass)).toEqual([1, 2]);
  });

  it("handles a single-node graph", () => {
    const { distances, previous, events } = bellmanFord({ A: [] }, "A");
    expect(distances).toEqual({ A: 0 });
    expect(previous).toEqual({ A: null });
    expect(events.at(-1).negativeCycle).toBe(false);
    expect(events.at(-1).unreachableCount).toBe(0);
  });

  it("handles disconnected graphs and unreachable nodes", () => {
    const graph = {
      A: [["B", 1]],
      B: [],
      X: [["Y", -5]],
      Y: [],
    };
    const { distances, previous } = bellmanFord(graph, "A");
    expect(distances).toEqual({ A: 0, B: 1, X: Infinity, Y: Infinity });
    expect(previous.X).toBeNull();
    expect(previous.Y).toBeNull();
  });

  it("treats an unreachable negative cycle as harmless", () => {
    const graph = {
      A: [["B", 2]],
      B: [],
      X: [["Y", -1]],
      Y: [["X", -1]],
    };
    const { distances, negativeCycle } = bellmanFord(graph, "A");
    expect(negativeCycle).toBe(false);
    expect(distances).toEqual({ A: 0, B: 2, X: Infinity, Y: Infinity });
  });

  it("works with plain string neighbors (weight 1)", () => {
    const graph = { A: ["B"], B: ["C"], C: [] };
    const { distances } = bellmanFord(graph, "A");
    expect(distances).toEqual({ A: 0, B: 1, C: 2 });
  });

  it("performs exactly V-1 passes without early stop on cascading graphs", () => {
    const graph = {
      A: [
        ["B", 5],
        ["C", 2],
      ],
      C: [["B", -2]],
      B: [],
    };
    const { events } = bellmanFord(graph, "A");
    const passStarts = events.filter((e) => e.type === "pass-start");
    expect(passStarts.map((e) => e.pass)).toEqual([1, 2]);
  });
});

describe("bellmanFord — validation", () => {
  it("throws for an unknown start node", () => {
    expect(() => bellmanFord({ A: [] }, "Z")).toThrow(/Unknown start node: Z/);
  });

  it("throws for a missing graph", () => {
    expect(() => bellmanFord(null, "A")).toThrow(/graph object/);
  });
});

describe("bellmanFord — negative cycles", () => {
  it("detects a reachable negative cycle", () => {
    const graph = {
      A: [["B", 4]],
      B: [["C", -3]],
      C: [["A", -2]],
    };
    const { negativeCycle, negativeCycleEdge, events } = bellmanFord(
      graph,
      "A",
    );
    expect(negativeCycle).toBe(true);
    expect(negativeCycleEdge).toHaveLength(2);
    const detected = events.filter((e) => e.type === "negative-cycle-detected");
    expect(detected).toHaveLength(1);
    expect(events.at(-1).negativeCycle).toBe(true);
  });

  it("detects a negative self-cycle through two nodes", () => {
    const graph = {
      A: [["B", 1]],
      B: [["A", -2]],
    };
    const { negativeCycle } = bellmanFord(graph, "A");
    expect(negativeCycle).toBe(true);
  });

  it("does not report a negative cycle when all cycles are positive", () => {
    const graph = {
      A: [["B", 1]],
      B: [["A", 2]],
    };
    const { negativeCycle, distances } = bellmanFord(graph, "A");
    expect(negativeCycle).toBe(false);
    expect(distances).toEqual({ A: 0, B: 1 });
  });

  it("emits negative-cycle-check before completion", () => {
    const { events } = bellmanFord({ A: [] }, "A");
    const checkIdx = events.findIndex((e) => e.type === "negative-cycle-check");
    const completeIdx = events.findIndex((e) => e.type === "complete");
    expect(checkIdx).toBeGreaterThan(-1);
    expect(completeIdx).toBeGreaterThan(checkIdx);
  });
});

describe("bellmanFord — event model", () => {
  it("emits only the documented event vocabulary", () => {
    const allowed = new Set([
      "init",
      "pass-start",
      "inspect-edge",
      "skip-unreachable",
      "skip-edge",
      "relax-edge",
      "pass-complete",
      "negative-cycle-check",
      "negative-cycle-detected",
      "complete",
    ]);
    const { events } = bellmanFord(TASK_EXAMPLE, "A");
    for (const e of events) expect(allowed.has(e.type)).toBe(true);
  });

  it("emits pass events in order with correct numbering", () => {
    const { events } = bellmanFord(TASK_EXAMPLE, "A");
    const passEvents = events.filter(
      (e) => e.type === "pass-start" || e.type === "pass-complete",
    );
    expect(passEvents[0]).toMatchObject({
      type: "pass-start",
      pass: 1,
      total: 2,
    });
    expect(passEvents[1]).toMatchObject({ type: "pass-complete", pass: 1 });
  });

  it("is fully deterministic across repeated executions", () => {
    const graph = {
      A: [
        ["B", 4],
        ["C", 5],
      ],
      C: [["B", -3]],
      B: [["A", 1]],
    };
    const a = bellmanFord(graph, "A");
    const b = bellmanFord(graph, "A");
    expect(a.events).toEqual(b.events);
    expect(a.distances).toEqual(b.distances);
    expect(a.previous).toEqual(b.previous);
    expect(a.visitedOrder).toEqual(b.visitedOrder);
  });

  it("never mutates the input graph", () => {
    const graph = TASK_EXAMPLE;
    const snapshot = JSON.stringify(graph);
    bellmanFord(graph, "A");
    expect(JSON.stringify(graph)).toBe(snapshot);
  });
});

describe("bellmanFordDebug — projector", () => {
  it("maps one event to exactly one step", () => {
    const { events } = bellmanFord(TASK_EXAMPLE, "A");
    const steps = bellmanFordDebug(TASK_EXAMPLE, "A");
    expect(steps).toHaveLength(events.length);
    expect(steps[0].log).toMatch(/Initialize/i);
    expect(steps.at(-1).log).toMatch(/Done/i);
  });

  it("keeps every activeLine within codeLines bounds", () => {
    const steps = bellmanFordDebug(TASK_EXAMPLE, "A");
    const max = GRAPH_BELLMAN_FORD_CODE_LINES.length;
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(max);
    }
  });

  it("carries the full base schema on every step", () => {
    const steps = bellmanFordDebug(TASK_EXAMPLE, "A");
    for (const s of steps) {
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack[0]).toContain("bellmanFord");
      expect(s.visited).toBeInstanceOf(Set);
      expect(Array.isArray(s.updatedPass)).toBe(true);
    }
  });

  it("uses the call stack label from the projector options", () => {
    const steps = bellmanFordDebug(TASK_EXAMPLE, "A");
    expect(steps[0].callStack[0]).toBe("bellmanFord(graph, start)");
  });

  it("exposes pass counters and per-pass updates", () => {
    const steps = bellmanFordDebug(
      {
        A: [
          ["B", 5],
          ["C", 2],
        ],
        C: [["B", -2]],
        B: [],
      },
      "A",
    );
    const passStart = steps.find((s) => s.vars.pass);
    expect(passStart.vars.pass).toBe("1 / 2");
    const withUpdates = steps.find((s) => (s.updatedPass || []).length > 0);
    expect(withUpdates).toBeDefined();
  });

  it("flags the negative cycle in the final snapshot", () => {
    const graph = {
      A: [["B", 4]],
      B: [["C", -3]],
      C: [["A", -2]],
    };
    const last = bellmanFordDebug(graph, "A").at(-1);
    expect(last.complete).toBe(true);
    expect(last.negativeCycle).toBe(true);
    expect(last.negativeCycleEdge).toHaveLength(2);
    expect(last.log).toMatch(/negative cycle/i);
  });

  it("reflects known distances in visited state (knownFromDistances)", () => {
    const steps = bellmanFordDebug(TASK_EXAMPLE, "A");
    expect(steps[0].visited.has("A")).toBe(true);
    const last = steps.at(-1);
    expect(last.visited.has("B")).toBe(true);
    expect(last.visited.has("C")).toBe(true);
    expect(last.visitOrder[0]).toBe("A");
  });

  it("is deterministic for repeated debug runs", () => {
    expect(bellmanFordDebug(TASK_EXAMPLE, "A")).toEqual(
      bellmanFordDebug(TASK_EXAMPLE, "A"),
    );
  });
});

describe("bellmanFord — line map integrity", () => {
  it("maps every event type the algorithm emits", () => {
    const { events } = bellmanFord(TASK_EXAMPLE, "A");
    for (const e of events) {
      expect(BELLMAN_FORD_LINE_MAP[e.type]).toBeDefined();
    }
  });
});
