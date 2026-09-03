export function kmpSearch(text, pattern) {
  let comps = 0,
    matches = [];
  const n = text.length,
    m = pattern.length;
  if (m === 0) return { matches, comparisons: comps };
  const lps = Array(m).fill(0);
  let len = 0,
    i = 1;
  while (i < m) {
    if (pattern[i] === pattern[len]) {
      lps[i++] = ++len;
    } else if (len) len = lps[len - 1];
    else lps[i++] = 0;
  }
  i = 0;
  let j = 0;
  while (i < n) {
    comps++;
    if (text[i] === pattern[j]) {
      i++;
      j++;
    }
    if (j === m) {
      matches.push(i - j);
      j = lps[j - 1];
    } else if (i < n && text[i] !== pattern[j]) {
      if (j) j = lps[j - 1];
      else i++;
    }
  }
  return { matches, comparisons: comps };
}
