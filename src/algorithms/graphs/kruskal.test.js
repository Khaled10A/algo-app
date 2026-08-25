import { describe, expect, it } from "vitest";
import { kruskal } from "./kruskal";
import { kruskalDebug, KRUSKAL_LINE_MAP } from "./kruskalDebug";
import { GRAPH_KRUSKAL_CODE_LINES } from "./descriptors";
import { prim } from "./prim";
import { createDefaultGraph, addEdge, removeNode } from "./graph";

const CONNECTED = {
  A: [["B", 4], ["C", 2]],
  B: [["A", 4], ["C", 1], ["D", 5]],
  C: [["A", 2], ["B", 1], ["D", 8]],
  D: [["B", 5], ["C", 8]],
};

function edgeSet(edges) {
  return new Set(edges.map((e) => [e.from, e.to].sort().join("~")));
}

describe("kruskal - correctness", () => {
  it("computes the MST of a connected weighted graph", () => {
    const { edges, totalWeight } = kruskal(CONNECTED, "A");
    expect(edgeSet(edges)).toEqual(new Set(["A~C", "B~C", "B~D"]));
    expect(totalWeight).toBe(8);
  });

  it("produces V-1 edges for a connected graph", () => {
    const { edges } = kruskal(CONNECTED);
    expect(edges).toHaveLength(3);
  });

  it("contains no cycles in the final MST", () => {
    const { edges } = kruskal(CONNECTED);
    const touched = new Set();
    for (const e of edges) {
      touched.add(e.from);
      touched.add(e.to);
    }
    expect(touched.size).toBe(edges.length + 1);
  });

  it("rejects exactly the cycle-forming edges", () => {
    const { events } = kruskal(CONNECTED);
    const rejected = events.filter((e) => e.type === "reject-edge");
    expect(rejected).toHaveLength(2);
    expect(rejected[0]).toMatchObject({ from: "A", to: "B" });
    expect(rejected[0].reason).toMatch(/cycle/);
    expect(rejected[1]).toMatchObject({ from: "C", to: "D" });
    expect(rejected[1].reason).toMatch(/cycle/);
  });

  it("matches Prim total weight on the same graph", () => {
    expect(kruskal(CONNECTED).totalWeight).toBe(prim(CONNECTED, "A").totalWeight);
  });

  it("handles graphs with cycles", () => {
    const graph = {
      A: [["B", 1]],
      B: [["A", 1], ["C", 2]],
      C: [["B", 2], ["A", 3]],
    };
    const { edges, totalWeight } = kruskal(graph);
    expect(edges).toHaveLength(2);
    expect(totalWeight).toBe(3);
  });

  it("grows a minimum spanning forest for disconnected graphs", () => {
    const graph = {
      A: [["B", 1]],
      B: [["A", 1]],
      X: [["Y", 2]],
      Y: [["X", 2]],
    };
    const { edges, totalWeight, connected, treeCount } = kruskal(graph);
    expect(edges).toHaveLength(2);
    expect(totalWeight).toBe(3);
    expect(connected).toBe(false);
    expect(treeCount).toBe(2);
  });

  it("handles a single-node graph", () => {
    const { edges, totalWeight, connected, treeCount } = kruskal({ A: [] }, "A");
    expect(edges).toEqual([]);
    expect(totalWeight).toBe(0);
    expect(connected).toBe(true);
    expect(treeCount).toBe(1);
  });

  it("handles an empty graph", () => {
    const { edges, totalWeight, connected, treeCount } = kruskal({});
    expect(edges).toEqual([]);
    expect(totalWeight).toBe(0);
    expect(treeCount).toBe(0);
    expect(connected).toBe(false);
  });

  it("resolves multiple equal-weight edges deterministically", () => {
    const graph = {
      A: [["B", 1], ["C", 1]],
      B: [["A", 1], ["C", 1]],
      C: [["A", 1], ["B", 1]],
    };
    const a = kruskal(graph);
    expect(a.totalWeight).toBe(2);
    expect(a.edges).toHaveLength(2);
    expect(kruskal(graph).edges).toEqual(a.edges);
  });

  it("supports negative weights", () => {
    const graph = {
      A: [["B", -2]],
      B: [["C", 3]],
      C: [],
    };
    const { totalWeight, negativeCycleFree } = kruskal(graph);
    expect(totalWeight).toBe(1);
  });
});

describe("kruskal - validation", () => {
  it("throws for a missing graph", () => {
    expect(() => kruskal(null)).toThrow(/graph object/);
  });
});

describe("kruskal - event model", () => {
  it("emits only the shared MST event vocabulary", () => {
    const allowed = new Set([
      "init", "start-node", "visit-node", "enqueue-edge", "inspect-edge",
      "reject-edge", "select-edge", "disconnected", "complete",
    ]);
    const { events } = kruskal(CONNECTED);
    for (const e of events) expect(allowed.has(e.type)).toBe(true);
  });

  it("emits inspect before every select/reject decision", () => {
    const { events } = kruskal(CONNECTED);
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.type === "select-edge" || e.type === "reject-edge") {
        expect(events[i - 1].type).toBe("inspect-edge");
      }
    }
  });

  it("emits visit-node only for isolated singleton nodes", () => {
    const graph = { A: [["B", 1]], B: [], Z: [] };
    const { events } = kruskal(graph);
    const visits = events.filter((e) => e.type === "visit-node");
    expect(visits).toHaveLength(1);
    expect(visits[0].node).toBe("Z");
  });

  it("is fully deterministic across repeated executions", () => {
    const a = kruskal(CONNECTED);
    const b = kruskal(CONNECTED);
    expect(a.events).toEqual(b.events);
    expect(a.edges).toEqual(b.edges);
    expect(a.visitedOrder).toEqual(b.visitedOrder);
  });

  it("never mutates the input graph", () => {
    const graph = JSON.parse(JSON.stringify(CONNECTED));
    const snapshot = JSON.stringify(graph);
    kruskal(graph);
    expect(JSON.stringify(graph)).toBe(snapshot);
  });
});

describe("kruskalDebug - projector compatibility", () => {
  it("maps one event to exactly one step via the shared MST projector", () => {
    const { events } = kruskal(CONNECTED);
    const steps = kruskalDebug(CONNECTED);
    expect(steps).toHaveLength(events.length);
    expect(steps[0].log).toMatch(/Initialize/i);
    expect(steps.at(-1).log).toMatch(/Done/i);
  });

  it("keeps every activeLine within codeLines bounds", () => {
    const steps = kruskalDebug(CONNECTED);
    const max = GRAPH_KRUSKAL_CODE_LINES.length;
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(max);
    }
  });

  it("carries MST state compatible with the Prim snapshots", () => {
    const steps = kruskalDebug(CONNECTED);
    const last = steps.at(-1);
    expect(last.mstEdges).toHaveLength(3);
    expect(last.totalWeight).toBe(8);
    expect(last.complete).toBe(true);
    expect(last.connected).toBe(true);
    expect(last.visited.has("A")).toBe(true);
    expect(last.visited.has("D")).toBe(true);
  });

  it("uses the kruskal call stack label", () => {
    const steps = kruskalDebug(CONNECTED);
    expect(steps[0].callStack[0]).toBe("kruskal(graph, start)");
  });

  it("is deterministic for repeated debug runs", () => {
    expect(kruskalDebug(CONNECTED)).toEqual(kruskalDebug(CONNECTED));
  });
});

describe("kruskal - line map integrity", () => {
  it("maps every event type the algorithm emits", () => {
    const { events } = kruskal(CONNECTED);
    for (const e of events) {
      expect(KRUSKAL_LINE_MAP[e.type]).toBeDefined();
    }
  });
});
