export function quickSort(arr) {
  let comps = 0;
  function qs(a, lo, hi) {
    if (lo < hi) {
      let pivot = a[hi], i = lo - 1;
      for (let j = lo; j < hi; j++) { comps++; if (a[j] <= pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; } }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]]; const p = i + 1; qs(a, lo, p - 1); qs(a, p + 1, hi);
    }
  }
  const a = [...arr]; qs(a, 0, a.length - 1); return { sorted: a, comparisons: comps };
}
