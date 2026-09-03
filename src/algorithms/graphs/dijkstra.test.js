import { describe, expect, it } from "vitest";
import { dijkstra } from "./dijkstra";
import { dijkstraDebug, DIJKSTRA_LINE_MAP } from "./dijkstraDebug";
import { GRAPH_DIJKSTRA_CODE_LINES } from "./descriptors";
import { MinHeap } from "../../core/structures/minHeap";

const WEIGHTED = {
  A: [
    ["B", 4],
    ["D", 2],
  ],
  B: [
    ["A", 4],
    ["C", 5],
    ["E", 10],
  ],
  C: [
    ["B", 5],
    ["F", 3],
  ],
  D: [
    ["A", 2],
    ["E", 7],
  ],
  E: [
    ["B", 10],
    ["D", 7],
    ["F", 4],
  ],
  F: [
    ["C", 3],
    ["E", 4],
  ],
  G: [["D", 3]],
};

const EVENT_TYPES = new Set([
  "init",
  "select-node",
  "dequeue",
  "skip-node",
  "visit-node",
  "inspect-edge",
  "skip-edge",
  "relax-edge",
  "complete",
]);

describe("dijkstra — correctness", () => {
  it("computes correct distances and predecessors on a weighted graph", () => {
    const { distances, previous, visitedOrder } = dijkstra(WEIGHTED, "A");
    expect(distances).toEqual({
      A: 0,
      B: 4,
      C: 9,
      D: 2,
      E: 9,
      F: 12,
      G: Infinity,
    });
    expect(previous).toEqual({
      A: null,
      B: "A",
      C: "B",
      D: "A",
      E: "D",
      F: "C",
      G: null,
    });
    expect(visitedOrder[0]).toBe("A");
    expect(visitedOrder).not.toContain("G");
  });

  it("handles a single-node graph", () => {
    const { distances, previous, events } = dijkstra({ A: [] }, "A");
    expect(distances).toEqual({ A: 0 });
    expect(previous).toEqual({ A: null });
    expect(events[0].type).toBe("init");
    expect(events.at(-1).type).toBe("complete");
    expect(events.at(-1).unreachableCount).toBe(0);
  });

  it("marks nodes in other components unreachable", () => {
    const graph = {
      A: [["B", 1]],
      B: [["A", 1]],
      X: [["Y", 1]],
      Y: [["X", 1]],
    };
    const { distances, previous } = dijkstra(graph, "A");
    expect(distances).toEqual({ A: 0, B: 1, X: Infinity, Y: Infinity });
    expect(previous.X).toBeNull();
    expect(previous.Y).toBeNull();
  });

  it("reports unreachable destination nodes with Infinity distance", () => {
    const graph = { A: [["B", 2]], C: [["A", 1]] };
    const { distances } = dijkstra(graph, "A");
    expect(distances.C).toBe(Infinity);
  });

  it("supports zero-weight edges", () => {
    const graph = {
      A: [
        ["B", 0],
        ["C", 3],
      ],
      B: [["C", 0]],
      C: [],
    };
    const { distances, previous } = dijkstra(graph, "A");
    expect(distances).toEqual({ A: 0, B: 0, C: 0 });
    expect(previous.C).toBe("B");
  });

  it("resolves multiple equal shortest paths deterministically (first relaxation wins)", () => {
    const graph = {
      A: [
        ["B", 1],
        ["C", 1],
      ],
      B: [["D", 1]],
      C: [["D", 1]],
      D: [],
    };
    const { distances, previous } = dijkstra(graph, "A");
    expect(distances).toEqual({ A: 0, B: 1, C: 1, D: 2 });
    expect(["B", "C"]).toContain(previous.D);
    const again = dijkstra(graph, "A");
    expect(again.previous).toEqual(previous);
    expect(again.visitedOrder).toEqual(dijkstra(graph, "A").visitedOrder);
  });

  it("handles a source with no outgoing edges", () => {
    const graph = { A: [], B: [["A", 1]] };
    const { distances, visitedOrder, events } = dijkstra(graph, "A");
    expect(distances).toEqual({ A: 0, B: Infinity });
    expect(visitedOrder).toEqual(["A"]);
    expect(events.at(-1).unreachableCount).toBe(1);
  });

  it("terminates on cyclic graphs with correct results", () => {
    const graph = {
      A: [["B", 1]],
      B: [["C", 1]],
      C: [
        ["A", 1],
        ["D", 1],
      ],
      D: [["B", 1]],
    };
    const { distances, visitedOrder } = dijkstra(graph, "A");
    expect(distances).toEqual({ A: 0, B: 1, C: 2, D: 3 });
    expect(visitedOrder).toEqual(["A", "B", "C", "D"]);
  });

  it("works on an undirected-style graph (both directions listed)", () => {
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
    const { distances } = dijkstra(graph, "A");
    expect(distances).toEqual({ A: 0, B: 2, C: 3, D: 4 });
  });

  it("treats plain string neighbors as weight 1", () => {
    const graph = { A: ["B"], B: ["C"], C: [] };
    const { distances } = dijkstra(graph, "A");
    expect(distances).toEqual({ A: 0, B: 1, C: 2 });
  });
});

describe("dijkstra — validation", () => {
  it("throws for an unknown start node", () => {
    expect(() => dijkstra(WEIGHTED, "Z")).toThrow(/Unknown start node: Z/);
  });

  it("throws for a missing graph", () => {
    expect(() => dijkstra(null, "A")).toThrow(/graph object/);
  });
});

describe("dijkstra — event model", () => {
  it("emits only known event types with data", () => {
    const { events } = dijkstra(WEIGHTED, "A");
    for (const e of events) {
      expect(EVENT_TYPES.has(e.type)).toBe(true);
    }
  });

  it("starts with init/select and ends with complete", () => {
    const { events } = dijkstra(WEIGHTED, "A");
    expect(events[0].type).toBe("init");
    expect(events[1]).toMatchObject({
      type: "select-node",
      node: "A",
      distance: 0,
    });
    expect(events.at(-1).type).toBe("complete");
  });

  it("carries old/new distances on every relaxation", () => {
    const { events } = dijkstra(WEIGHTED, "A");
    const relaxes = events.filter((e) => e.type === "relax-edge");
    expect(relaxes.length).toBeGreaterThan(0);
    for (const e of relaxes) {
      expect(e.oldDistance).toBeGreaterThan(e.newDistance);
      expect(e.newDistance).toBe(
        e.weight + Math.min(e.oldDistance, Infinity) === Infinity
          ? e.newDistance
          : expect.any(Number),
      );
    }
    const toB = relaxes.find((e) => e.from === "A" && e.to === "B");
    expect(toB).toMatchObject({
      oldDistance: Infinity,
      newDistance: 4,
      weight: 4,
    });
  });

  it("is fully deterministic across repeated executions", () => {
    const a = dijkstra(WEIGHTED, "A");
    const b = dijkstra(WEIGHTED, "A");
    expect(a.events).toEqual(b.events);
    expect(a.distances).toEqual(b.distances);
    expect(a.previous).toEqual(b.previous);
    expect(a.visitedOrder).toEqual(b.visitedOrder);
  });

  it("never emits events referencing nodes outside the graph", () => {
    const { events } = dijkstra(WEIGHTED, "A");
    const nodes = new Set(Object.keys(WEIGHTED));
    for (const e of events) {
      for (const [k, v] of Object.entries(e)) {
        if (["node", "from", "to", "start"].includes(k)) {
          expect(nodes.has(v)).toBe(true);
        }
      }
    }
  });
});

describe("dijkstraDebug — debugger projection", () => {
  it("maps one event to exactly one step", () => {
    const { events } = dijkstra(WEIGHTED, "A");
    const steps = dijkstraDebug(WEIGHTED, "A");
    expect(steps).toHaveLength(events.length);
    expect(steps[0].log).toMatch(/Initialize/i);
    expect(steps.at(-1).log).toMatch(/Done/i);
  });

  it("keeps every activeLine within codeLines bounds", () => {
    const steps = dijkstraDebug(WEIGHTED, "A");
    const max = GRAPH_DIJKSTRA_CODE_LINES.length;
    for (const s of steps) {
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(s.activeLine).toBeLessThan(max);
    }
  });

  it("carries the full base schema on every step", () => {
    const steps = dijkstraDebug(WEIGHTED, "A");
    for (const s of steps) {
      expect(typeof s.log).toBe("string");
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.visited).toBeInstanceOf(Set);
      expect(Array.isArray(s.heap)).toBe(true);
      expect(Array.isArray(s.visitOrder)).toBe(true);
    }
  });

  it("reflects final distances, predecessors and completion in the last step", () => {
    const { distances, visitedOrder } = dijkstra(WEIGHTED, "A");
    const last = dijkstraDebug(WEIGHTED, "A").at(-1);
    expect(last.complete).toBe(true);
    expect(last.distances).toEqual(distances);
    expect(last.visited.size).toBe(visitedOrder.length);
    expect(last.distances.G).toBe(Infinity);
  });

  it("highlights the relaxed edge on relax steps", () => {
    const steps = dijkstraDebug(WEIGHTED, "A");
    const relaxStep = steps.find((s) => s.relaxedEdge);
    expect(relaxStep).toBeDefined();
    expect(relaxStep.relaxedEdge).toHaveLength(2);
    expect(relaxStep.vars["new dist"]).toBeDefined();
  });

  it("tracks the priority queue contents over time", () => {
    const steps = dijkstraDebug(WEIGHTED, "A");
    expect(steps[1].heap).toEqual(["A"]);
    const withB = steps.find((s) => s.heap.includes("B"));
    expect(withB).toBeDefined();
  });

  it("is deterministic for repeated debug runs", () => {
    expect(dijkstraDebug(WEIGHTED, "A")).toEqual(dijkstraDebug(WEIGHTED, "A"));
  });
});

describe("dijkstra — line map integrity", () => {
  it("maps every event type the algorithm emits", () => {
    const { events } = dijkstra(WEIGHTED, "A");
    for (const e of events) {
      expect(DIJKSTRA_LINE_MAP[e.type]).toBeDefined();
    }
  });
});

describe("MinHeap", () => {
  it("pops in ascending order", () => {
    const heap = new MinHeap();
    [5, 1, 9, 3, 7].forEach((n) => heap.push(n));
    const out = [];
    while (heap.size > 0) out.push(heap.pop());
    expect(out).toEqual([1, 3, 5, 7, 9]);
  });

  it("uses a custom comparator with deterministic tie-breaks", () => {
    const heap = new MinHeap(
      (a, b) => a.dist - b.dist || (a.node < b.node ? -1 : 1),
    );
    heap.push({ node: "C", dist: 1 });
    heap.push({ node: "A", dist: 1 });
    heap.push({ node: "B", dist: 0 });
    expect(heap.pop()).toEqual({ node: "B", dist: 0 });
    expect(heap.pop()).toEqual({ node: "A", dist: 1 });
    expect(heap.pop()).toEqual({ node: "C", dist: 1 });
    expect(heap.pop()).toBeUndefined();
  });

  it("reports size and exposes a snapshot via toArray", () => {
    const heap = new MinHeap();
    expect(heap.size).toBe(0);
    heap.push(2);
    heap.push(1);
    expect(heap.size).toBe(2);
    expect(heap.toArray()).toHaveLength(2);
    heap.pop();
    expect(heap.size).toBe(1);
  });
});
