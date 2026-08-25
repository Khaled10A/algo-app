import { describe, expect, it } from "vitest";
import { DisjointSet } from "./disjointSet";

describe("DisjointSet", () => {
  it("makeSet creates independent singleton sets", () => {
    const dsu = new DisjointSet(["A", "B"]);
    expect(dsu.connected("A", "B")).toBe(false);
    expect(dsu.components).toBe(2);
  });

  it("find returns the representative and compresses paths", () => {
    const dsu = new DisjointSet();
    dsu.makeSet(1);
    dsu.makeSet(2);
    dsu.makeSet(3);
    dsu.union(1, 2);
    dsu.union(2, 3);
    const root = dsu.find(3);
    expect(dsu.find(1)).toBe(root);
    expect(dsu.find(2)).toBe(root);
    expect(dsu.parent.get(3)).toBe(root);
  });

  it("union returns false for already-connected sets", () => {
    const dsu = new DisjointSet(["A", "B"]);
    expect(dsu.union("A", "B")).toBe(true);
    expect(dsu.union("B", "A")).toBe(false);
    expect(dsu.components).toBe(1);
  });

  it("union by rank keeps trees shallow", () => {
    const dsu = new DisjointSet();
    for (const x of ["A", "B", "C", "D"]) dsu.makeSet(x);
    dsu.union("A", "B");
    dsu.union("C", "D");
    dsu.union("A", "C");
    expect(dsu.rank.get(dsu.find("A"))).toBeGreaterThanOrEqual(1);
    expect(dsu.connected("B", "D")).toBe(true);
  });

  it("find auto-creates missing elements", () => {
    const dsu = new DisjointSet();
    expect(dsu.find("X")).toBe("X");
    expect(dsu.components).toBe(1);
  });

  it("tracks setCount through merges", () => {
    const dsu = new DisjointSet(["A", "B", "C", "D"]);
    expect(dsu.components).toBe(4);
    dsu.union("A", "B");
    dsu.union("C", "D");
    expect(dsu.components).toBe(2);
    dsu.union("A", "D");
    expect(dsu.components).toBe(1);
  });
});
