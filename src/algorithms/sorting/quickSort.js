export function quickSort(arr) {
  let comps = 0;
  function qs(a, lo, hi) {
    if (lo < hi) {
      let pivot = a[hi],
        i = lo - 1;
      for (let j = lo; j < hi; j++) {
        comps++;
        if (a[j] <= pivot) {
          i++;
          [a[i], a[j]] = [a[j], a[i]];
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      const p = i + 1;
      qs(a, lo, p - 1);
      qs(a, p + 1, hi);
    }
  }
  const a = [...arr];
  qs(a, 0, a.length - 1);
  return { sorted: a, comparisons: comps };
}

export const QUICK_SORT_CODE_LINES = [
  { n: 0, code: "function quickSort(arr) {" },
  { n: 1, code: "  qs(lo = 0, hi = n-1): if (lo < hi)" },
  { n: 2, code: "    pivot = A[hi];  i = lo - 1" },
  { n: 3, code: "    for (j = lo; j < hi; j++)" },
  { n: 4, code: "      if A[j] <= pivot: i++, swap(A[i], A[j])" },
  { n: 5, code: "    swap(A[i+1], A[hi])  ← pivot final spot" },
  { n: 6, code: "    quickSort(lo, p-1); quickSort(p+1, hi)" },
  { n: 7, code: "}" },
];

export function quickSortDebug(arr) {
  const a = [...arr];
  const steps = [];
  const frames = [];

  const snap = (activeLine, vars, highlight, log) =>
    steps.push({
      arr: [...a],
      highlight: highlight || [],
      activeLine,
      vars,
      memory: {
        arr: `[${a.join(", ")}]`,
        lo: vars.lo !== undefined ? String(vars.lo) : "-",
        hi: vars.hi !== undefined ? String(vars.hi) : "-",
        pivot: vars.pivot !== undefined ? String(vars.pivot) : "-",
        i: vars.i !== undefined ? String(vars.i) : "-",
        j: vars.j !== undefined ? String(vars.j) : "-",
      },
      callStack: ["quickSort(arr)", ...frames],
      log,
    });

  snap(0, {}, [], "Start: arr initialized");

  function qs(lo, hi) {
    if (lo > hi) return;
    frames.push(`  └ quickSort(lo=${lo}, hi=${hi})`);
    if (lo === hi) {
      snap(
        1,
        { lo, hi },
        [lo],
        `Single element A[${lo}]=${a[lo]} — already sorted`,
      );
      frames.pop();
      return;
    }
    snap(1, { lo, hi }, range(lo, hi), `quickSort(lo=${lo}, hi=${hi})`);
    let pivot = a[hi],
      i = lo - 1;
    snap(2, { lo, hi, pivot }, [hi], `Pivot = A[${hi}] = ${pivot}`);
    for (let j = lo; j < hi; j++) {
      snap(
        3,
        { lo, hi, pivot, i, j },
        [j, hi],
        `Compare A[${j}]=${a[j]} with pivot ${pivot}`,
      );
      if (a[j] <= pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        snap(
          4,
          { lo, hi, pivot, i, j },
          [i, j],
          i !== j
            ? `A[${j}] ≤ pivot → swap into left part: A[${i}] ↔ A[${j}]`
            : `A[${j}] ≤ pivot → already in left part, i=${i}`,
        );
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    snap(
      5,
      { lo, hi, pivot, i: i + 1 },
      [i + 1],
      `Place pivot ${pivot} at its final position ${i + 1}`,
    );
    qs(lo, i);
    qs(i + 2, hi);
    frames.pop();
  }

  function range(lo, hi) {
    const out = [];
    for (let k = lo; k <= hi; k++) out.push(k);
    return out;
  }

  qs(0, a.length - 1);
  snap(7, {}, [], `Done! Sorted: [${a.join(", ")}]`);
  return steps;
}
