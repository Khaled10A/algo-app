/**
 * Generic binary min-heap with a custom comparator.
 * Deterministic when the comparator is a total order (tie-break included).
 */
export class MinHeap {
  constructor(comparator) {
    const compare =
      comparator || ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    this.less = (a, b) => compare(a, b) < 0;
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  toArray() {
    return [...this.items];
  }

  push(item) {
    this.items.push(item);
    this.#siftUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this.#siftDown(0);
    }
    return top;
  }

  #siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.less(this.items[i], this.items[parent])) {
        [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
        i = parent;
      } else break;
    }
  }

  #siftDown(i) {
    const n = this.items.length;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && this.less(this.items[left], this.items[smallest])) smallest = left;
      if (right < n && this.less(this.items[right], this.items[smallest])) smallest = right;
      if (smallest === i) break;
      [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
      i = smallest;
    }
  }
}
