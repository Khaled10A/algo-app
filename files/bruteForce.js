export function bruteForceSearch(text, pattern) {
  let comps = 0, matches = [];
  const n = text.length, m = pattern.length;
  for (let i = 0; i <= n - m; i++) {
    let j = 0;
    while (j < m) { comps++; if (text[i + j] !== pattern[j]) break; j++; }
    if (j === m) matches.push(i);
  }
  return { matches, comparisons: comps };
}
