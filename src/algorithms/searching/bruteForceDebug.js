/**
 * Brute Force Search — Debug Version
 * Generates step-by-step snapshots for the debugger panel.
 */
export function bruteForceDebug(text, pattern) {
  const steps = [];
  const n = text.length, m = pattern.length;

  const snap = (activeLine, vars, log, highlightText = [], highlightPat = [], matches = []) =>
    steps.push({
      activeLine,
      vars,
      log,
      // string-search specific fields
      text,
      pattern,
      highlightText,   // indices in text currently being compared
      highlightPat,    // indices in pattern currently being compared
      matchPositions: [...matches],
      memory: {
        text: `"${text.length > 20 ? text.slice(0, 20) + "…" : text}"`,
        pattern: `"${pattern}"`,
        n: String(n),
        m: String(m),
        i: vars.i !== undefined ? String(vars.i) : "-",
        j: vars.j !== undefined ? String(vars.j) : "-",
        matches: `[${matches.join(", ")}]`,
      },
      callStack: [
        "bruteForceSearch(text, pattern)",
        vars.j !== undefined
          ? `  └ inner while(j < m)  j=${vars.j}`
          : vars.i !== undefined
          ? `  └ outer for(i=0..n-m)  i=${vars.i}`
          : "  └ init",
      ],
    });

  const found = [];

  snap(0, {}, "Start: scan text with sliding window");

  for (let i = 0; i <= n - m; i++) {
    snap(2, { i }, `Window at i=${i}: checking text[${i}..${i + m - 1}] vs pattern`);

    let j = 0;
    while (j < m) {
      snap(
        3,
        { i, j },
        `Compare text[${i + j}]='${text[i + j]}' with pattern[${j}]='${pattern[j]}'`,
        [i + j],
        [j],
        found,
      );

      if (text[i + j] !== pattern[j]) {
        snap(4, { i, j }, `Mismatch! '${text[i + j]}' ≠ '${pattern[j]}' → shift window`, [i + j], [j], found);
        break;
      }
      j++;
    }

    if (j === m) {
      found.push(i);
      snap(5, { i, j }, `✓ Match found at index ${i}!`, 
        Array.from({ length: m }, (_, k) => i + k), 
        Array.from({ length: m }, (_, k) => k),
        found,
      );
    }
  }

  snap(6, {}, `Done! ${found.length} match(es) found: [${found.join(", ")}]`, [], [], found);
  return steps;
}
