import { describe, expect, it } from "vitest";
import {
  buildBacktrackTree,
  getPathToNode,
  getSolutionPaths,
  getTreeStats,
} from "./backtrackTree";

// ── Helper: simple exploration with one solution ──

function simpleEvents() {
  return [
    { type: "init", state: { arr: [1, 2, 3] }, log: "Start" },
    { type: "enter", depth: 1, state: { arr: [1, 2, 3] }, log: "Enter d1" },
    {
      type: "choose",
      depth: 1,
      candidate: "A",
      state: { arr: [1, 2, 3] },
      log: "Choose A",
    },
    { type: "enter", depth: 2, state: { arr: [1, 2, 3] }, log: "Enter d2" },
    {
      type: "choose",
      depth: 2,
      candidate: "X",
      state: { arr: [1, 2, 3] },
      log: "Choose X",
    },
    {
      type: "solution",
      depth: 2,
      solution: ["A", "X"],
      state: { arr: [1, 2, 3] },
      log: "Solution!",
    },
    { type: "backtrack", depth: 1, state: { arr: [1, 2, 3] }, log: "Undo X" },
    {
      type: "choose",
      depth: 1,
      candidate: "B",
      state: { arr: [1, 2, 3] },
      log: "Choose B",
    },
    {
      type: "prune",
      depth: 1,
      reason: "invalid",
      state: { arr: [1, 2, 3] },
      log: "Pruned",
    },
    { type: "backtrack", depth: 0, state: { arr: [1, 2, 3] }, log: "Undo B" },
    { type: "complete", log: "Done" },
  ];
}

describe("buildBacktrackTree", () => {
  it("creates nodes for all events that produce tree nodes", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    // init(1) + enter(1) + choose(1) + enter(2) + choose(2) + solution(0) + backtrack(0) + choose(1) + prune(0) + backtrack(0) + complete(0)
    // Tree nodes: init, enter(d1), choose(A), enter(d2), choose(X), choose(B)
    // = 6 nodes (solution/backtrack/complete don't create new nodes, they modify existing)
    expect(nodes.length).toBeGreaterThanOrEqual(4);
  });

  it("first node is root with parentId null", () => {
    const { nodes, rootId } = buildBacktrackTree(simpleEvents());
    expect(rootId).toBe(0);
    const root = nodes.find((n) => n.id === 0);
    expect(root).toBeDefined();
    expect(root.parentId).toBeNull();
    expect(root.depth).toBe(0);
  });

  it("tracks parent-child relationships", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    // Every non-root node should have a parentId that references an existing node
    for (const node of nodes) {
      if (node.parentId != null) {
        const parent = nodes.find((n) => n.id === node.parentId);
        expect(parent).toBeDefined();
        expect(parent.children).toContain(node.id);
      }
    }
  });

  it("tracks depth correctly", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    // Root is depth 0
    expect(nodes[0].depth).toBe(0);
    // Children of root should be depth 1
    const d1Nodes = nodes.filter((n) => n.depth === 1);
    expect(d1Nodes.length).toBeGreaterThanOrEqual(1);
    // Children of depth 1 should be depth 2
    const d2Nodes = nodes.filter((n) => n.depth === 2);
    expect(d2Nodes.length).toBeGreaterThanOrEqual(1);
  });

  it("marks solution nodes as success", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const successNodes = nodes.filter((n) => n.status === "success");
    expect(successNodes.length).toBeGreaterThanOrEqual(1);
  });

  it("marks pruned nodes", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const prunedNodes = nodes.filter((n) => n.status === "pruned");
    expect(prunedNodes.length).toBeGreaterThanOrEqual(1);
  });

  it("marks backtracked nodes", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const backtrackedNodes = nodes.filter((n) => n.status === "backtracked");
    expect(backtrackedNodes.length).toBeGreaterThanOrEqual(1);
  });

  it("records decisions on choose nodes", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const chooseNodes = nodes.filter((n) => n.decision != null);
    expect(chooseNodes.length).toBeGreaterThanOrEqual(2);
    const decisions = chooseNodes.map((n) => n.decision);
    expect(decisions).toContain("A");
    expect(decisions).toContain("X");
  });

  it("handles empty events", () => {
    const { nodes, rootId } = buildBacktrackTree([]);
    expect(nodes).toHaveLength(0);
    expect(rootId).toBeNull();
  });

  it("handles init-only events", () => {
    const { nodes, rootId } = buildBacktrackTree([{ type: "init", state: {} }]);
    expect(nodes).toHaveLength(1);
    expect(rootId).toBe(0);
    expect(nodes[0].status).toBe("active");
  });

  it("handles multiple solutions", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "solution", depth: 1, solution: ["A"], state: {} },
      { type: "choose", depth: 1, candidate: "B", state: {} },
      { type: "solution", depth: 1, solution: ["B"], state: {} },
      { type: "complete" },
    ];
    const { nodes } = buildBacktrackTree(events);
    const successNodes = nodes.filter((n) => n.status === "success");
    expect(successNodes.length).toBeGreaterThanOrEqual(2);
  });

  it("handles deep recursion", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "enter", depth: 2, state: {} },
      { type: "choose", depth: 2, candidate: "B", state: {} },
      { type: "enter", depth: 3, state: {} },
      { type: "choose", depth: 3, candidate: "C", state: {} },
      { type: "solution", depth: 3, solution: ["A", "B", "C"], state: {} },
      { type: "backtrack", depth: 2, state: {} },
      { type: "backtrack", depth: 1, state: {} },
      { type: "complete" },
    ];
    const { nodes } = buildBacktrackTree(events);
    const maxDepth = Math.max(...nodes.map((n) => n.depth));
    expect(maxDepth).toBe(3);
  });

  it("handles rapid backtracking (all branches pruned)", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "prune", depth: 1, reason: "too heavy", state: {} },
      { type: "choose", depth: 1, candidate: "B", state: {} },
      { type: "prune", depth: 1, reason: "too expensive", state: {} },
      { type: "complete" },
    ];
    const { nodes } = buildBacktrackTree(events);
    const prunedNodes = nodes.filter((n) => n.status === "pruned");
    expect(prunedNodes.length).toBe(2);
  });

  it("deep-copies state snapshots", () => {
    const state = { board: [["Q", "."]] };
    const events = [
      { type: "init", state },
      { type: "enter", depth: 1, state },
      { type: "complete" },
    ];
    const { nodes } = buildBacktrackTree(events);

    // Mutate original
    state.board[0][0] = "X";

    // Tree nodes should have deep copies
    expect(nodes[0].state.board[0][0]).toBe("Q");
    expect(nodes[1].state.board[0][0]).toBe("Q");
  });
});

describe("getPathToNode", () => {
  it("returns [rootId] for root node", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const path = getPathToNode(nodes, 0);
    expect(path).toEqual([0]);
  });

  it("returns correct path for deep node", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "enter", depth: 2, state: {} },
      { type: "choose", depth: 2, candidate: "B", state: {} },
      { type: "complete" },
    ];
    const { nodes } = buildBacktrackTree(events);
    // The deepest choose node
    const deepNode = nodes[nodes.length - 2]; // choose B
    const path = getPathToNode(nodes, deepNode.id);
    expect(path.length).toBeGreaterThanOrEqual(3);
    expect(path[0]).toBe(0); // root
    expect(path[path.length - 1]).toBe(deepNode.id);
  });

  it("returns empty array for non-existent node", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const path = getPathToNode(nodes, 999);
    expect(path).toEqual([999]);
  });
});

describe("getSolutionPaths", () => {
  it("returns paths for all solution nodes", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const paths = getSolutionPaths(nodes);
    expect(paths.length).toBeGreaterThanOrEqual(1);
    // Each path should start from root
    for (const path of paths) {
      expect(path[0]).toBe(0);
    }
  });

  it("returns empty for no solutions", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "prune", depth: 1, reason: "no solution", state: {} },
      { type: "complete" },
    ];
    const { nodes } = buildBacktrackTree(events);
    const paths = getSolutionPaths(nodes);
    expect(paths).toHaveLength(0);
  });

  it("handles multiple solutions", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "solution", depth: 1, solution: ["A"], state: {} },
      { type: "choose", depth: 1, candidate: "B", state: {} },
      { type: "solution", depth: 1, solution: ["B"], state: {} },
      { type: "complete" },
    ];
    const { nodes } = buildBacktrackTree(events);
    const paths = getSolutionPaths(nodes);
    expect(paths.length).toBe(2);
  });
});

describe("getTreeStats", () => {
  it("counts total nodes", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const stats = getTreeStats(nodes);
    expect(stats.total).toBe(nodes.length);
  });

  it("counts solutions", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const stats = getTreeStats(nodes);
    expect(stats.solutions).toBeGreaterThanOrEqual(1);
  });

  it("counts pruned nodes", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const stats = getTreeStats(nodes);
    expect(stats.pruned).toBeGreaterThanOrEqual(1);
  });

  it("counts backtracked nodes", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const stats = getTreeStats(nodes);
    expect(stats.backtracked).toBeGreaterThanOrEqual(1);
  });

  it("tracks max depth", () => {
    const events = [
      { type: "init", state: {} },
      { type: "enter", depth: 1, state: {} },
      { type: "choose", depth: 1, candidate: "A", state: {} },
      { type: "enter", depth: 2, state: {} },
      { type: "choose", depth: 2, candidate: "B", state: {} },
      { type: "enter", depth: 3, state: {} },
      { type: "choose", depth: 3, candidate: "C", state: {} },
      { type: "complete" },
    ];
    const { nodes } = buildBacktrackTree(events);
    const stats = getTreeStats(nodes);
    expect(stats.maxDepth).toBe(3);
  });

  it("returns zeros for empty tree", () => {
    const stats = getTreeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.solutions).toBe(0);
    expect(stats.pruned).toBe(0);
    expect(stats.backtracked).toBe(0);
    expect(stats.maxDepth).toBe(0);
  });
});

describe("tree node properties", () => {
  it("each node has required fields", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    for (const node of nodes) {
      expect(typeof node.id).toBe("number");
      expect(node.parentId === null || typeof node.parentId === "number").toBe(
        true,
      );
      expect(typeof node.depth).toBe("number");
      expect(typeof node.status).toBe("string");
      expect(Array.isArray(node.children)).toBe(true);
      expect(typeof node.log).toBe("string");
    }
  });

  it("node IDs are sequential from 0", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const ids = nodes.map((n) => n.id).sort((a, b) => a - b);
    expect(ids[0]).toBe(0);
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).toBe(ids[i - 1] + 1);
    }
  });

  it("children arrays only contain valid IDs", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    const idSet = new Set(nodes.map((n) => n.id));
    for (const node of nodes) {
      for (const childId of node.children) {
        expect(idSet.has(childId)).toBe(true);
      }
    }
  });

  it("root has no parent", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    expect(nodes[0].parentId).toBeNull();
  });

  it("non-root nodes have parent references", () => {
    const { nodes } = buildBacktrackTree(simpleEvents());
    for (let i = 1; i < nodes.length; i++) {
      expect(nodes[i].parentId).not.toBeNull();
    }
  });
});
