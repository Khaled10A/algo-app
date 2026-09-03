import { describe, expect, it } from "vitest";
import { prim } from "./prim";
import { primDebug, PRIM_LINE_MAP } from "./primDebug";
import { GRAPH_PRIM_CODE_LINES } from "./descriptors";
import { createDefaultGraph, createEmptyGraph } from "./graph";
import { MinHeap } from "../../core/structures/minHeap";

const CONNECTED = {
  A: [
    ["B", 4],
    ["C", 2],
  ],
  B: [
    ["A", 4],
    ["C", 1],
    ["D", 5],
  ],
  C: [
    ["A", 2],
    ["B", 1],
    ["D", 8],
  ],
  D: [
    ["B", 5],
    ["C", 8],
  ],
};

function edgeSet(edges) {
  return new Set(edges.map((e) => [e.from, e.to].sort().join("~")));
}

describe("prim — correctness", () => {
  it("computes the MST of a connected weighted graph", () => {
    const { edges, totalWeight, visitedOrder } = prim(CONNECTED, "A");
    expect(edgeSet(edges)).toEqual(new Set(["A~C", "B~C", "B~D"]));
    expect(totalWeight).toBe(1 + 2 + 5);
    expect(visitedOrder[0]).toBe("A");
    expect(visitedOrder).toHaveLength(4);
  });

  it("produces V-1 edges for a connected graph", () => {
    const { edges } = prim(CONNECTED, "A");
    expect(edges).toHaveLength(3);
  });

  it("contains no cycles in the final MST", () => {
    const { edges } = prim(CONNECTED, "A");
    const parent = {};
    for (const e of edges) parent[e.to] = e.from;
    expect(Object.keys(parent).length).toBe(edges.length);
  });

  it("produces the same total weight from any start node", () => {
    const totals = ["A", "B", "C", "D"].map(
      (n) => prim(CONNECTED, n).totalWeight,
    );
    expect(new Set(totals)).toHaveProperty("size", 1);
    expect(totals[0]).toBe(8);
  });

  it("breaks equal-weight ties deterministically", () => {
    const graph = {
      A: [
        ["B", 1],
        ["C", 1],
      ],
      B: [
        ["A", 1],
        ["C", 1],
      ],
      C: [
        ["A", 1],
        ["B", 1],
      ],
    };
    const a = prim(graph, "A");
    const b = prim(graph, "A");
    expect(a.edges).toEqual(b.edges);
    expect(a.totalWeight).toBe(2);
    expect(a.edges).toHaveLength(2);
  });

  it("handles graphs with cycles", () => {
    const graph = {
      A: [["B", 1]],
      B: [
        ["A", 1],
        ["C", 2],
      ],
      C: [
        ["B", 2],
        ["A", 3],
      ],
    };
    const { edges, totalWeight } = prim(graph, "A");
    expect(edges).toHaveLength(2);
    expect(totalWeight).toBe(3);
  });

  it("handles a single-node graph", () => {
    const { edges, totalWeight, visitedOrder, connected, treeCount } = prim(
      { A: [] },
      "A",
    );
    expect(edges).toEqual([]);
    expect(totalWeight).toBe(0);
    expect(visitedOrder).toEqual(["A"]);
    expect(connected).toBe(true);
    expect(treeCount).toBe(1);
  });

  it("grows a minimum spanning forest for disconnected graphs", () => {
    const graph = {
      A: [["B", 1]],
      B: [["A", 1]],
      X: [["Y", 2]],
      Y: [["X", 2]],
    };
    const { edges, totalWeight, connected, treeCount, events } = prim(
      graph,
      "A",
    );
    expect(edges).toHaveLength(2);
    expect(totalWeight).toBe(3);
    expect(connected).toBe(false);
    expect(treeCount).toBe(2);
    expect(events.filter((e) => e.type === "disconnected")).toHaveLength(1);
  });

  it("documents the default example graph: disconnected, forest with 2 trees", () => {
    // The weighted DEFAULT_GRAPH intentionally leaves G reachable only via
    // G -> D (directed), so Prim from A yields a minimum spanning FOREST.
    const { edges, totalWeight, connected, treeCount } = prim(
      createDefaultGraph(),
      "A",
    );
    expect(edges).toHaveLength(5);
    expect(totalWeight).toBe(18);
    expect(connected).toBe(false);
    expect(treeCount).toBe(2);
  });

  it("handles isolated nodes inside an otherwise connected graph", () => {
    const graph = {
      A: [["B", 1]],
      B: [["A", 1]],
      Z: [],
    };
    const { edges, connected, treeCount, visitedOrder } = prim(graph, "A");
    expect(edges).toHaveLength(1);
    expect(connected).toBe(false);
    expect(treeCount).toBe(2);
    expect(visitedOrder).toEqual(["A", "B", "Z"]);
  });
});

describe("prim — validation", () => {
  it("throws for an unknown start node", () => {
    expect(() => prim(CONNECTED, "Z")).toThrow(/Unknown start node: Z/);
  });

  it("throws for an empty graph", () => {
    expect(() => prim(createEmptyGraph(), "A")).toThrow(/non-empty graph/);
  });

  it("throws for a missing graph", () => {
    expect(() => prim(null, "A")).toThrow(/graph object/);
  });
});

describe("prim — event model", () => {
  it("emits only the documented event vocabulary", () => {
    const allowed = new Set([
      "init",
      "start-node",
      "visit-node",
      "enqueue-edge",
      "inspect-edge",
      "reject-edge",
      "select-edge",
      "disconnected",
      "complete",
    ]);
    const { events } = prim(CONNECTED, "A");
    for (const e of events) expect(allowed.has(e.type)).toBe(true);
  });

  it("starts with init, start-node, visit-node in order", () => {
    const { events } = prim(CONNECTED, "A");
    expect(events[0].type).toBe("init");
    expect(events[1]).toMatchObject({ type: "start-node", node: "A" });
    expect(events[2]).toMatchObject({ type: "visit-node", node: "A" });
  });

  it("emits enqueue-edge for every candidate pushed", () => {
    const { events } = prim(CONNECTED, "A");
    const enqueued = events.filter((e) => e.type === "enqueue-edge");
    expect(enqueued).toHaveLength(5);
    expect(enqueued[0]).toMatchObject({ from: "A", to: "B", weight: 4 });
    expect(enqueued[1]).toMatchObject({ from: "A", to: "C", weight: 2 });
  });

  it("emits select-edge with the running total weight", () => {
    const { events } = prim(CONNECTED, "A");
    const selections = events.filter((e) => e.type === "select-edge");
    expect(selections).toHaveLength(3);
    expect(selections.at(-1).totalWeight).toBe(8);
  });

  it("emits reject-edge for stale frontier entries", () => {
    const { events } = prim(CONNECTED, "A");
    const rejections = events.filter((e) => e.type === "reject-edge");
    expect(rejections.length).toBeGreaterThan(0);
    for (const r of rejections) expect(r.reason).toMatch(/tree/);
  });

  it("is fully deterministic across repeated executions", () => {
    const a = prim(CONNECTED, "A");
    const b = prim(CONNECTED, "A");
    expect(a.events).toEqual(b.events);
    expect(a.edges).toEqual(b.edges);
    expect(a.totalWeight).toEqual(b.totalWeight);
    expect(a.visitedOrder).toEqual(b.visitedOrder);
  });

  it("never mutates the input graph", () => {
    const graph = createDefaultGraph();
    const snapshot = JSON.stringify(graph);
    prim(graph, "A");
    expect(JSON.stringify(graph)).toBe(snapshot);
  });
});

describe("primDebug — projector", () => {
  it("maps one event to exactly one step", () => {
    const { events } = prim(CONNECTED, "A");
    const steps = primDebug(CONNECTED, "A");
    expect(steps).toHaveLength(events.length);
    expect(steps[0].log).toMatch(/Initialize/i);
    expect(steps.at(-1).log).toMatch(/Done/i);
  });

  it("keeps every activeLine within codeLines bounds", () => {
    const steps = primDebug(CONNECTED, "A");
    const max = GRAPH_PRIM_CODE_LINES.length;
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(max);
    }
  });

  it("carries the base schema and MST state on every step", () => {
    const steps = primDebug(CONNECTED, "A");
    for (const s of steps) {
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack[0]).toContain("prim");
      expect(Array.isArray(s.frontier)).toBe(true);
      expect(Array.isArray(s.mstEdges)).toBe(true);
      expect(typeof s.totalWeight).toBe("number");
      expect(s.visited).toBeInstanceOf(Set);
    }
  });

  it("mirrors the frontier: enqueue then inspect empties the matching entry", () => {
    const steps = primDebug(CONNECTED, "A");
    const inspect = steps.find((s) => s.log.includes("Inspect minimum edge"));
    expect(inspect.frontier).toHaveLength(1);
  });

  it("tracks MST edges and total weight across steps", () => {
    const steps = primDebug(CONNECTED, "A");
    const last = steps.at(-1);
    expect(last.mstEdges).toHaveLength(3);
    expect(last.totalWeight).toBe(8);
    expect(last.complete).toBe(true);
    expect(last.connected).toBe(true);
    const firstSelect = steps.find((s) => s.log.includes("Select"));
    expect(firstSelect.mstEdges).toHaveLength(1);
    expect(firstSelect.totalWeight).toBe(2);
  });

  it("marks disconnected state in snapshots for forests", () => {
    const graph = {
      A: [["B", 1]],
      B: [["A", 1]],
      X: [["Y", 2]],
      Y: [["X", 2]],
    };
    const steps = primDebug(graph, "A");
    const last = steps.at(-1);
    expect(last.connected).toBe(false);
    expect(last.treeCount).toBe(2);
    expect(last.log).toMatch(/FOREST/i);
  });

  it("is deterministic for repeated debug runs", () => {
    expect(primDebug(CONNECTED, "A")).toEqual(primDebug(CONNECTED, "A"));
  });
});

describe("prim — line map integrity", () => {
  it("maps every event type the algorithm emits", () => {
    const { events } = prim(CONNECTED, "A");
    for (const e of events) {
      expect(PRIM_LINE_MAP[e.type]).toBeDefined();
    }
  });
});

describe("prim — MinHeap interaction", () => {
  it("relies on the shared MinHeap for edge ordering", () => {
    const heap = new MinHeap(
      (a, b) =>
        a.weight - b.weight ||
        (a.from < b.from ? -1 : a.from > b.from ? 1 : 0) ||
        (a.to < b.to ? -1 : 1),
    );
    heap.push({ from: "A", to: "C", weight: 2 });
    heap.push({ from: "A", to: "B", weight: 2 });
    heap.push({ from: "B", to: "D", weight: 1 });
    expect(heap.pop()).toEqual({ from: "B", to: "D", weight: 1 });
    expect(heap.pop()).toEqual({ from: "A", to: "B", weight: 2 });
    expect(heap.pop()).toEqual({ from: "A", to: "C", weight: 2 });
  });
});
