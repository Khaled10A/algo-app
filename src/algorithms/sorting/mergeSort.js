/**
 * Merge Sort — Divide & Conquer
 * Time: O(n log n) | Space: O(n)
 */
export function mergeSort(arr) {
  let comparisons = 0;
  function merge(l, r) {
    const res = [];
    let i = 0,
      j = 0;
    while (i < l.length && j < r.length) {
      comparisons++;
      if (l[i] <= r[j]) res.push(l[i++]);
      else res.push(r[j++]);
    }
    return [...res, ...l.slice(i), ...r.slice(j)];
  }
  function ms(a) {
    if (a.length <= 1) return a;
    const m = Math.floor(a.length / 2);
    return merge(ms(a.slice(0, m)), ms(a.slice(m)));
  }
  return { sorted: ms([...arr]), comparisons };
}

export const MERGE_SORT_CODE_LINES = [
  { n: 0, code: "function mergeSort(arr) {" },
  { n: 1, code: "  sort(lo = 0, hi = n-1): if lo >= hi return" },
  { n: 2, code: "  mid = floor((lo + hi) / 2)" },
  { n: 3, code: "  sort(lo, mid);  sort(mid+1, hi)" },
  { n: 4, code: "  copy A[lo..hi] → aux" },
  { n: 5, code: "  merge: i=lo, j=mid+1" },
  { n: 6, code: "  for k = lo..hi: A[k] = smaller(aux[i], aux[j])" },
  { n: 7, code: "}" },
];

export function mergeSortDebug(arr) {
  const a = [...arr];
  const aux = new Array(a.length);
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
        mid: vars.mid !== undefined ? String(vars.mid) : "-",
        hi: vars.hi !== undefined ? String(vars.hi) : "-",
        i: vars.i !== undefined ? String(vars.i) : "-",
        j: vars.j !== undefined ? String(vars.j) : "-",
        k: vars.k !== undefined ? String(vars.k) : "-",
      },
      callStack: ["mergeSort(arr)", ...frames],
      log,
    });

  snap(0, {}, [], "Start: arr initialized");

  function ms(lo, hi) {
    if (lo >= hi) return;
    frames.push(`  └ sort(lo=${lo}, hi=${hi})`);
    const mid = Math.floor((lo + hi) / 2);
    snap(
      2,
      { lo, mid, hi },
      rangeIdx(lo, hi),
      `Split [${lo}..${hi}] at mid=${mid} → [${lo}..${mid}] + [${mid + 1}..${hi}]`,
    );
    ms(lo, mid);
    ms(mid + 1, hi);

    for (let k = lo; k <= hi; k++) aux[k] = a[k];
    let i = lo,
      j = mid + 1;
    snap(
      5,
      { lo, mid, hi, i, j },
      rangeIdx(lo, hi),
      `Merge halves [${lo}..${mid}] + [${mid + 1}..${hi}]`,
    );
    for (let k = lo; k <= hi; k++) {
      if (i > mid) {
        a[k] = aux[j++];
      } else if (j > hi) {
        a[k] = aux[i++];
      } else if (aux[j] < aux[i]) {
        a[k] = aux[j++];
      } else {
        a[k] = aux[i++];
      }
      snap(6, { lo, mid, hi, i, j, k }, [k], `Placed ${a[k]} at position ${k}`);
    }
    frames.pop();
  }

  function rangeIdx(lo, hi) {
    const out = [];
    for (let k = lo; k <= hi; k++) out.push(k);
    return out;
  }

  ms(0, a.length - 1);
  snap(7, {}, [], `Done! Sorted: [${a.join(", ")}]`);
  return steps;
}
