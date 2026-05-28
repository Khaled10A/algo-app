export function mergeSort(arr) {
  let comps = 0;
  function merge(l, r) {
    const res = []; let i = 0, j = 0;
    while (i < l.length && j < r.length) { comps++; if (l[i] <= r[j]) res.push(l[i++]); else res.push(r[j++]); }
    return [...res, ...l.slice(i), ...r.slice(j)];
  }
  function ms(a) { if (a.length <= 1) return a; const m = Math.floor(a.length / 2); return merge(ms(a.slice(0, m)), ms(a.slice(m))); }
  return { sorted: ms([...arr]), comparisons: comps };
}
