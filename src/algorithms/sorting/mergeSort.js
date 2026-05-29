/**
 * Merge Sort — Divide & Conquer
 * Time: O(n log n) | Space: O(n)
 */
export function mergeSort(arr) {
  let comparisons = 0;
  function merge(l, r) {
    const res = []; let i = 0, j = 0;
    while (i < l.length && j < r.length) { comparisons++; if (l[i] <= r[j]) res.push(l[i++]); else res.push(r[j++]); }
    return [...res, ...l.slice(i), ...r.slice(j)];
  }
  function ms(a) { if (a.length <= 1) return a; const m = Math.floor(a.length / 2); return merge(ms(a.slice(0, m)), ms(a.slice(m))); }
  return { sorted: ms([...arr]), comparisons };
}

export function mergeSortDebug(arr) {
  const steps = [];
  let callDepth = 0;

  const snap = (activeLine, currentArr, left, right, merged, log) => steps.push({
    arr: merged || currentArr,
    highlight: [],
    activeLine,
    vars: {
      "array":  `[${currentArr.join(", ")}]`,
      "left":   left  ? `[${left.join(", ")}]`   : "-",
      "right":  right ? `[${right.join(", ")}]`  : "-",
      "merged": merged ? `[${merged.join(", ")}]` : "-",
      "depth":  String(callDepth),
    },
    memory: {
      "array":  `[${currentArr.join(", ")}]`,
      "left":   left  ? `[${left.join(", ")}]`  : "-",
      "right":  right ? `[${right.join(", ")}]` : "-",
      "merged": merged ? `[${merged.join(", ")}]`: "-",
    },
    callStack: [`mergeSort(depth=${callDepth})`],
    log,
  });

  function ms(a) {
    callDepth++;
    snap(0, a, null, null, null, `Split: [${a.join(", ")}]`);
    if (a.length <= 1) { callDepth--; return a; }
    const mid = Math.floor(a.length / 2);
    const left  = ms(a.slice(0, mid));
    const right = ms(a.slice(mid));
    snap(3, a, left, right, null, `Merge left=[${left}] right=[${right}]`);
    const res = []; let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) res.push(left[i++]); else res.push(right[j++]);
    }
    const merged = [...res, ...left.slice(i), ...right.slice(j)];
    snap(5, a, left, right, merged, `Merged: [${merged.join(", ")}]`);
    callDepth--;
    return merged;
  }

  ms([...arr]);
  return steps;
}
