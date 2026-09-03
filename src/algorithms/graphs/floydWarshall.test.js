import { describe, expect, it } from "vitest";
import { floydWarshall, reconstructPath } from "./floydWarshall";
import {
  floydWarshallDebug,
  FLOYD_WARSHALL_LINE_MAP,
} from "./floydWarshallDebug";
import { GRAPH_FLOYD_WARSHALL_CODE_LINES } from "./descriptors";

const CLASSIC = {
  A: [
    ["B", 4],
    ["C", 2],
  ],
  B: [
    ["C", 1],
    ["D", 5],
  ],
  C: [["D", 8]],
  D: [],
};

describe("floydWarshall - correctness", () => {
  it("computes all-pairs shortest paths on the classic example", () => {
    const { matrix } = floydWarshall(CLASSIC);
    expect(matrix.A).toEqual({ A: 0, B: 4, C: 2, D: 9 });
    expect(matrix.B).toEqual({ A: Infinity, B: 0, C: 1, D: 5 });
    expect(matrix.C).toEqual({ A: Infinity, B: Infinity, C: 0, D: 8 });
    expect(matrix.D.D).toBe(0);
  });

  it("uses multiple intermediate nodes for long paths", () => {
    const graph = {
      A: [["B", 1]],
      B: [["C", 1]],
      C: [["D", 1]],
      D: [["E", 1]],
      E: [],
    };
    const { matrix } = floydWarshall(graph);
    expect(matrix.A.E).toBe(4);
    expect(matrix.B.E).toBe(3);
  });

  it("keeps Infinity for unreachable pairs", () => {
    const graph = { A: [["B", 1]], B: [], X: [["Y", 1]], Y: [] };
    const { matrix } = floydWarshall(graph);
    expect(matrix.A.X).toBe(Infinity);
    expect(matrix.A.Y).toBe(Infinity);
    expect(matrix.X.B).toBe(Infinity);
    expect(matrix.A.B).toBe(1);
  });

  it("supports negative edges without negative cycles", () => {
    const graph = {
      A: [
        ["B", 4],
        ["C", 5],
      ],
      C: [["B", -3]],
      B: [],
    };
    const { matrix, negativeCycle } = floydWarshall(graph);
    expect(matrix.A.B).toBe(2);
    expect(matrix.A.C).toBe(5);
    expect(negativeCycle).toBe(false);
  });

  it("resolves multiple shortest paths to the same distance", () => {
    const graph = {
      A: [
        ["B", 1],
        ["C", 1],
      ],
      B: [["D", 1]],
      C: [["D", 1]],
      D: [],
    };
    const { matrix, events } = floydWarshall(graph);
    expect(matrix.A.D).toBe(2);
    const again = floydWarshall(graph);
    expect(again.events).toEqual(events);
  });

  it("handles a single-node graph", () => {
    const { matrix, events, negativeCycle } = floydWarshall({ A: [] }, "A");
    expect(matrix.A).toEqual({ A: 0 });
    expect(negativeCycle).toBe(false);
    expect(events[0].type).toBe("init");
    expect(events.at(-1).type).toBe("complete");
  });

  it("handles an empty graph", () => {
    const { nodes, matrix, events } = floydWarshall({});
    expect(nodes).toEqual([]);
    expect(matrix).toEqual({});
    expect(events[0].type).toBe("init");
    expect(events.at(-1).type).toBe("complete");
  });

  it("keeps the diagonal at zero without negative cycles", () => {
    const { matrix } = floydWarshall(CLASSIC);
    for (const id of ["A", "B", "C", "D"]) {
      expect(matrix[id][id]).toBe(0);
    }
  });

  it("produces a symmetric matrix for undirected-style graphs", () => {
    const graph = {
      A: [
        ["B", 2],
        ["C", 5],
      ],
      B: [
        ["A", 2],
        ["C", 1],
        ["D", 4],
      ],
      C: [
        ["A", 5],
        ["B", 1],
        ["D", 1],
      ],
      D: [
        ["B", 4],
        ["C", 1],
      ],
    };
    const { matrix } = floydWarshall(graph);
    for (const a of ["A", "B", "C", "D"]) {
      for (const b of ["A", "B", "C", "D"]) {
        expect(matrix[a][b]).toBe(matrix[b][a]);
      }
    }
  });
});

describe("floydWarshall - negative cycles", () => {
  it("detects a directed negative cycle via the diagonal", () => {
    const graph = {
      A: [["B", 1]],
      B: [["C", -3]],
      C: [["A", 1]],
    };
    const { matrix, negativeCycle, negativeCycleNodes } = floydWarshall(graph);
    expect(negativeCycle).toBe(true);
    expect(negativeCycleNodes.length).toBeGreaterThan(0);
    for (const n of negativeCycleNodes) {
      expect(matrix[n][n]).toBeLessThan(0);
    }
  });

  it("detects the negative cycle created by an undirected negative edge", () => {
    const graph = {
      A: [["B", -1]],
      B: [["A", -1]],
    };
    const { negativeCycle, negativeCycleNodes } = floydWarshall(graph);
    expect(negativeCycle).toBe(true);
    expect(negativeCycleNodes.sort()).toEqual(["A", "B"]);
    expect(matrixCheck(graph)).toBe(true);
  });

  function matrixCheck(graph) {
    const { matrix } = floydWarshall(graph);
    return matrix.A.A < 0 && matrix.B.B < 0;
  }
});

describe("floydWarshall - validation & determinism", () => {
  it("throws for a missing graph", () => {
    expect(() => floydWarshall(null)).toThrow(/graph object/);
  });

  it("is fully deterministic across repeated executions", () => {
    const a = floydWarshall(CLASSIC);
    const b = floydWarshall(CLASSIC);
    expect(a.events).toEqual(b.events);
    expect(a.matrix).toEqual(b.matrix);
    expect(a.next).toEqual(b.next);
  });

  it("never mutates the input graph", () => {
    const graph = JSON.parse(JSON.stringify(CLASSIC));
    const snapshot = JSON.stringify(graph);
    floydWarshall(graph);
    expect(JSON.stringify(graph)).toBe(snapshot);
  });
});

describe("floydWarshall - event model", () => {
  it("emits only the documented event vocabulary", () => {
    const allowed = new Set([
      "init",
      "k-start",
      "inspect-pair",
      "update-distance",
      "k-complete",
      "negative-cycle-check",
      "negative-cycle-detected",
      "complete",
    ]);
    const { events } = floydWarshall(CLASSIC);
    for (const e of events) expect(allowed.has(e.type)).toBe(true);
  });

  it("emits k-start/k-complete for every node in order", () => {
    const { events } = floydWarshall(CLASSIC);
    const kStarts = events.filter((e) => e.type === "k-start");
    expect(kStarts.map((e) => e.node)).toEqual(["A", "B", "C", "D"]);
    const kDones = events.filter((e) => e.type === "k-complete");
    expect(kDones).toHaveLength(4);
  });

  it("carries current and candidate distances on inspect-pair", () => {
    const { events } = floydWarshall(CLASSIC);
    const inspections = events.filter((e) => e.type === "inspect-pair");
    expect(inspections.length).toBeGreaterThan(0);
    for (const e of inspections) {
      expect(e).toHaveProperty("currentDist");
      expect(e).toHaveProperty("candidate");
    }
  });

  it("emits update-distance only for improving pairs", () => {
    const { events } = floydWarshall(CLASSIC);
    const updates = events.filter((e) => e.type === "update-distance");
    for (const e of updates) {
      expect(e.newDistance).toBeLessThan(e.oldDistance);
    }
  });
});

describe("floydWarshall - path reconstruction", () => {
  it("reconstructs a multi-hop path via the next-hop matrix", () => {
    const { next, nodes } = floydWarshall(CLASSIC);
    const path = reconstructPath(next, nodes, "A", "D");
    expect(path[0]).toBe("A");
    expect(path.at(-1)).toBe("D");
    let cost = 0;
    const { matrix } = floydWarshall(CLASSIC);
    for (let i = 0; i < path.length - 1; i++) {
      cost += matrix[path[i]][path[i + 1]];
    }
    expect(cost).toBe(matrix.A.D);
  });

  it("returns a trivial path for a node to itself", () => {
    const { next, nodes } = floydWarshall(CLASSIC);
    expect(reconstructPath(next, nodes, "A", "A")).toEqual(["A"]);
    expect(reconstructPath(next, nodes, "B", "B")).toEqual(["B"]);
  });

  it("returns null for unreachable pairs", () => {
    const graph = { A: [["B", 1]], B: [], X: [["Y", 1]], Y: [] };
    const { next, nodes } = floydWarshall(graph);
    expect(reconstructPath(next, nodes, "A", "Y")).toBeNull();
  });
});

describe("floydWarshallDebug - matrix projector", () => {
  it("maps one event to exactly one step", () => {
    const { events } = floydWarshall(CLASSIC);
    const steps = floydWarshallDebug(CLASSIC);
    expect(steps).toHaveLength(events.length);
    expect(steps[0].log).toMatch(/Initialize/i);
    expect(steps.at(-1).log).toMatch(/Done/i);
  });

  it("keeps every activeLine within codeLines bounds", () => {
    const steps = floydWarshallDebug(CLASSIC);
    const max = GRAPH_FLOYD_WARSHALL_CODE_LINES.length;
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(max);
    }
  });

  it("carries the base schema and deep-copied matrix per step", () => {
    const steps = floydWarshallDebug(CLASSIC);
    for (const s of steps) {
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack[0]).toContain("floydWarshall");
      expect(s.matrix).toBeDefined();
      if (s !== steps[0]) expect(s.matrix).not.toBe(steps[0].matrix);
    }
    const first = steps.find((s) => s.k === "A");
    const later = steps.at(-1);
    expect(first.matrix).not.toEqual(later.matrix);
  });

  it("tracks k progression and the current pair", () => {
    const steps = floydWarshallDebug(CLASSIC);
    const kStarts = steps.filter(
      (s) => s.kNode && s.log.includes("Intermediate"),
    );
    expect(kStarts.map((s) => s.kNode)).toEqual(["A", "B", "C", "D"]);
    const pairStep = steps.find((s) => s.pair);
    expect(pairStep.pair).toHaveLength(2);
    expect(pairStep.vars.pair).toMatch(/→/);
  });

  it("flags negative cycles in the final snapshot", () => {
    const graph = {
      A: [["B", 1]],
      B: [["C", -3]],
      C: [["A", 1]],
    };
    const last = floydWarshallDebug(graph).at(-1);
    expect(last.complete).toBe(true);
    expect(last.negativeCycle).toBe(true);
    expect(last.negativeCycleNodes.length).toBeGreaterThan(0);
    expect(last.log).toMatch(/negative cycle/i);
  });

  it("requires no source node", () => {
    const steps = floydWarshallDebug(CLASSIC);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("is deterministic for repeated debug runs", () => {
    expect(floydWarshallDebug(CLASSIC)).toEqual(floydWarshallDebug(CLASSIC));
  });
});

describe("floydWarshall - line map integrity", () => {
  it("maps every event type the algorithm emits", () => {
    const { events } = floydWarshall(CLASSIC);
    for (const e of events) {
      expect(FLOYD_WARSHALL_LINE_MAP[e.type]).toBeDefined();
    }
  });
});
