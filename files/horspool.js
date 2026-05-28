export function horspoolSearch(text, pattern) {
  let comps = 0, matches = [];
  const n = text.length, m = pattern.length;
  if (m === 0 || m > n) return { matches, comparisons: comps };
  const shift = {};
  for (let i = 0; i < m - 1; i++) shift[pattern[i]] = m - 1 - i;
  let i = m - 1;
  while (i < n) {
    let k = 0;
    while (k < m) { comps++; if (text[i - k] !== pattern[m - 1 - k]) break; k++; }
    if (k === m) matches.push(i - m + 1);
    i += shift[text[i]] !== undefined ? shift[text[i]] : m;
  }
  return { matches, comparisons: comps };
}
