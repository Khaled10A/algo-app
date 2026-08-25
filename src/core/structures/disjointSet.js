/**
 * Generic Disjoint Set (Union-Find) with path compression and union by
 * rank. Deterministic, UI-independent, reusable across graph algorithms.
 */
export class DisjointSet {
  constructor(items = []) {
    this.parent = new Map();
    this.rank = new Map();
    this.setCount = 0;
    for (const item of items) this.makeSet(item);
  }

  makeSet(x) {
    if (this.parent.has(x)) return;
    this.parent.set(x, x);
    this.rank.set(x, 0);
    this.setCount++;
  }

  /** Finds the representative with full path compression. */
  find(x) {
    if (!this.parent.has(x)) {
      this.makeSet(x);
      return x;
    }
    let root = x;
    while (this.parent.get(root) !== root) root = this.parent.get(root);
    while (this.parent.get(x) !== root) {
      const next = this.parent.get(x);
      this.parent.set(x, root);
      x = next;
    }
    return root;
  }

  /**
   * Unions the sets containing a and b (union by rank).
   * Returns true when two distinct sets were merged, false when a and b
   * were already connected.
   */
  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;
    const rankA = this.rank.get(rootA);
    const rankB = this.rank.get(rootB);
    if (rankA < rankB) this.parent.set(rootA, rootB);
    else if (rankA > rankB) this.parent.set(rootB, rootA);
    else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
    this.setCount--;
    return true;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }

  get components() {
    let count = 0;
    for (const x of this.parent.keys()) {
      if (this.find(x) === x) count++;
    }
    return count;
  }
}
