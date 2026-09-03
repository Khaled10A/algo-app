import { describe, expect, it } from "vitest";
import {
  DEFAULT_GRAPH,
  createDefaultGraph,
  createEmptyGraph,
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  setEdgeWeight,
  hasEdge,
  nextNodeId,
  normalizeGraph,
  isWeightedGraph,
} from "./graph";
import { dijkstra } from "./dijkstra";

describe("graph editing — nodes", () => {
  it("adds a node with an empty adjacency list", () => {
    const g = addNode(createDefaultGraph(), "H");
    expect(g.H).toEqual([]);
    expect(Object.keys(g)).toContain("H");
    expect(DEFAULT_GRAPH.H).toBeUndefined();
  });

  it("rejects duplicate node ids", () => {
    expect(() => addNode(createDefaultGraph(), "A")).toThrow(/already exists/);
  });

  it("rejects empty node ids", () => {
    expect(() => addNode(createDefaultGraph(), "")).toThrow(/empty/);
    expect(() => addNode(createDefaultGraph(), "  ")).toThrow(/empty/);
  });

  it("removes a node and every incident edge (both directions)", () => {
    const g = removeNode(createDefaultGraph(), "B");
    expect(g.B).toBeUndefined();
    expect(hasEdge(g, "A", "B")).toBe(false);
    expect(hasEdge(g, "C", "B")).toBe(false);
    expect(hasEdge(g, "E", "B")).toBe(false);
    expect(hasEdge(g, "A", "D")).toBe(true);
  });

  it("throws when removing a missing node", () => {
    expect(() => removeNode(createDefaultGraph(), "Z")).toThrow(
      /does not exist/,
    );
  });
});

describe("graph editing — edges", () => {
  it("adds an edge in both directions", () => {
    const g = addEdge(createDefaultGraph(), "A", "F", 6);
    expect(hasEdge(g, "A", "F")).toBe(true);
    expect(hasEdge(g, "F", "A")).toBe(true);
    expect(normalizeGraph(g).adjacency.A.find((e) => e.to === "F").weight).toBe(
      6,
    );
    expect(normalizeGraph(g).adjacency.F.find((e) => e.to === "A").weight).toBe(
      6,
    );
  });

  it("rejects duplicate edges in either direction", () => {
    const g = createDefaultGraph();
    expect(() => addEdge(g, "A", "B", 9)).toThrow(/already exists/);
    expect(() => addEdge(g, "B", "A", 9)).toThrow(/already exists/);
  });

  it("rejects edges with missing endpoints", () => {
    const g = createDefaultGraph();
    expect(() => addEdge(g, "A", "Z", 1)).toThrow(/"Z" does not exist/);
    expect(() => addEdge(g, "Z", "A", 1)).toThrow(/"Z" does not exist/);
  });

  it("rejects self-loops", () => {
    expect(() => addEdge(createDefaultGraph(), "A", "A", 1)).toThrow(
      /Self-loop/,
    );
  });

  it("rejects non-numeric and non-finite weights", () => {
    const g = createDefaultGraph();
    expect(() => addEdge(g, "D", "F", "abc")).toThrow(/Invalid weight/);
    expect(() => addEdge(g, "D", "F", NaN)).toThrow(/Invalid weight/);
    expect(() => addEdge(g, "D", "F", Infinity)).toThrow(/Invalid weight/);
  });

  it("permits structurally valid zero and negative weights in the model", () => {
    const g = addEdge(createDefaultGraph(), "D", "F", 0);
    expect(normalizeGraph(g).adjacency.D.find((e) => e.to === "F").weight).toBe(
      0,
    );
    const g2 = addEdge(createDefaultGraph(), "D", "F", -2);
    expect(
      normalizeGraph(g2).adjacency.F.find((e) => e.to === "D").weight,
    ).toBe(-2);
  });

  it("removes an edge in both directions", () => {
    const g = removeEdge(createDefaultGraph(), "A", "B");
    expect(hasEdge(g, "A", "B")).toBe(false);
    expect(hasEdge(g, "B", "A")).toBe(false);
    expect(hasEdge(g, "A", "D")).toBe(true);
  });

  it("throws when removing a missing edge", () => {
    const g = createDefaultGraph();
    expect(() => removeEdge(g, "A", "F")).toThrow(/does not exist/);
  });

  it("updates the weight in both directions", () => {
    const g = setEdgeWeight(createDefaultGraph(), "A", "B", 42);
    const norm = normalizeGraph(g);
    expect(norm.adjacency.A.find((e) => e.to === "B").weight).toBe(42);
    expect(norm.adjacency.B.find((e) => e.to === "A").weight).toBe(42);
  });

  it("throws when updating a missing edge or passing an invalid weight", () => {
    const g = createDefaultGraph();
    expect(() => setEdgeWeight(g, "A", "F", 3)).toThrow(/does not exist/);
    expect(() => setEdgeWeight(g, "A", "B", "x")).toThrow(/Invalid weight/);
  });
});

describe("graph editing — reset & restore", () => {
  it("creates an independent deep copy of the default graph", () => {
    const g = createDefaultGraph();
    g.A[0][1] = 999;
    g.A.push(["Z", 1]);
    expect(DEFAULT_GRAPH.A[0][1]).not.toBe(999);
    expect(DEFAULT_GRAPH.A).toHaveLength(2);
    expect(hasEdge(DEFAULT_GRAPH, "A", "Z")).toBe(false);
  });

  it("createDefaultGraph matches the documented example", () => {
    const g = createDefaultGraph();
    expect(Object.keys(g)).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
    expect(isWeightedGraph(g)).toBe(true);
  });

  it("creates an empty graph", () => {
    expect(createEmptyGraph()).toEqual({});
  });

  it("suggests the next free node id", () => {
    expect(nextNodeId(createDefaultGraph())).toBe("H");
    let g = addNode(createDefaultGraph(), "H");
    expect(nextNodeId(g)).toBe("I");
    for (const id of ["I", "J"]) g = addNode(g, id);
    expect(nextNodeId(g)).toBe("K");
  });
});

describe("dijkstra — negative weight rejection", () => {
  it("rejects negative weights with a message naming the edge", () => {
    const g = addEdge(createDefaultGraph(), "D", "F", -2);
    expect(() => dijkstra(g, "A")).toThrow(
      /Dijkstra does not support negative weights \(edge D → F: -2\)/,
    );
  });

  it("rejects negative weights on any reachable edge", () => {
    const graph = { A: [["B", 1]], B: [["C", -1]], C: [] };
    expect(() => dijkstra(graph, "A")).toThrow(/B → C: -1/);
  });

  it("accepts non-negative graphs after edits", () => {
    const g = addEdge(createDefaultGraph(), "D", "F", 0);
    const { distances } = dijkstra(g, "A");
    expect(distances.F).toBe(2);
    expect(distances.C).toBe(5);
  });
});

describe("bfs/dfs compatibility with edited weighted graphs", () => {
  it("traverses an edited weighted graph ignoring weights", async () => {
    const { bfsDebug } = await import("./bfs");
    const { dfsDebug } = await import("./dfs");
    let g = addNode(createDefaultGraph(), "H");
    g = addEdge(g, "B", "H", 3);
    g = removeEdge(g, "A", "B");
    g = removeNode(g, "C");

    const bfs = bfsDebug(g, "A");
    const bfsOrder = bfs.at(-1).visitOrder;
    expect(bfsOrder[0]).toBe("A");
    expect(bfsOrder).toContain("H");
    expect(bfsOrder).not.toContain("C");

    const dfs = dfsDebug(g, "A");
    expect(dfs.at(-1).visitOrder).not.toContain("C");
    expect(dfs.at(-1).visitOrder).toContain("H");
  });
});
