/**
 * KMP Search — Debug Version
 * Phase 1: Build the LPS (Longest Proper Prefix-Suffix) table.
 * Phase 2: Search using the table to avoid back-tracking.
 */
export function kmpDebug(text, pattern) {
  const steps = [];
  const n = text.length,
    m = pattern.length;

  const snap = (
    activeLine,
    vars,
    log,
    highlightText = [],
    highlightPat = [],
    matches = [],
    lps = [],
  ) =>
    steps.push({
      activeLine,
      vars,
      log,
      text,
      pattern,
      highlightText,
      highlightPat,
      matchPositions: [...matches],
      lpsTable: [...lps],
      memory: {
        text: `"${text.length > 20 ? text.slice(0, 20) + "…" : text}"`,
        pattern: `"${pattern}"`,
        n: String(n),
        m: String(m),
        i: vars.i !== undefined ? String(vars.i) : "-",
        j: vars.j !== undefined ? String(vars.j) : "-",
        len: vars.len !== undefined ? String(vars.len) : "-",
        matches: `[${matches.join(", ")}]`,
      },
      callStack: [
        "kmpSearch(text, pattern)",
        vars.phase === "lps"
          ? `  └ buildLPS()  i=${vars.i ?? "-"} len=${vars.len ?? "-"}`
          : vars.j !== undefined
            ? `  └ search loop  i=${vars.i} j=${vars.j}`
            : "  └ init",
      ],
    });

  if (m === 0) {
    snap(0, {}, "Pattern is empty — nothing to search.", [], [], [], []);
    return steps;
  }

  // ── Phase 1: Build LPS ───────────────────────────────────
  const lps = Array(m).fill(0);
  snap(
    0,
    { phase: "lps" },
    "Phase 1: Build LPS (Longest Proper Prefix-Suffix) table",
    [],
    [],
    [],
    [...lps],
  );

  let len = 0,
    pi = 1;
  while (pi < m) {
    snap(
      1,
      { phase: "lps", i: pi, len },
      `Compare pattern[${pi}]='${pattern[pi]}' with pattern[${len}]='${pattern[len]}'`,
      [],
      [pi, len],
      [],
      [...lps],
    );

    if (pattern[pi] === pattern[len]) {
      lps[pi] = ++len;
      snap(
        2,
        { phase: "lps", i: pi, len },
        `Match → lps[${pi}] = ${lps[pi]}`,
        [],
        [pi],
        [],
        [...lps],
      );
      pi++;
    } else if (len !== 0) {
      snap(
        3,
        { phase: "lps", i: pi, len },
        `Mismatch, len>0 → fall back: len = lps[${len - 1}] = ${lps[len - 1]}`,
        [],
        [pi],
        [],
        [...lps],
      );
      len = lps[len - 1];
    } else {
      lps[pi] = 0;
      snap(
        4,
        { phase: "lps", i: pi, len },
        `Mismatch, len=0 → lps[${pi}] = 0`,
        [],
        [pi],
        [],
        [...lps],
      );
      pi++;
    }
  }
  snap(
    5,
    { phase: "lps" },
    `LPS table ready: [${lps.join(", ")}]`,
    [],
    [],
    [],
    [...lps],
  );

  // ── Phase 2: Search ──────────────────────────────────────
  const found = [];
  let i = 0,
    j = 0;

  snap(
    6,
    { i, j },
    "Phase 2: Search — i=text pointer, j=pattern pointer",
    [],
    [],
    found,
    [...lps],
  );

  while (i < n) {
    snap(
      7,
      { i, j },
      `Compare text[${i}]='${text[i]}' with pattern[${j}]='${pattern[j]}'`,
      [i],
      [j],
      found,
      [...lps],
    );

    if (text[i] === pattern[j]) {
      snap(
        8,
        { i, j },
        `Match '${text[i]}' = '${pattern[j]}' → advance both`,
        [i],
        [j],
        found,
        [...lps],
      );
      i++;
      j++;
    }

    if (j === m) {
      const matchIdx = i - j;
      found.push(matchIdx);
      snap(
        9,
        { i, j },
        `✓ Full match at index ${matchIdx}! Use lps[${j - 1}]=${lps[j - 1]} to continue`,
        Array.from({ length: m }, (_, x) => matchIdx + x),
        Array.from({ length: m }, (_, x) => x),
        found,
        [...lps],
      );
      j = lps[j - 1];
    } else if (i < n && text[i] !== pattern[j]) {
      if (j !== 0) {
        snap(
          10,
          { i, j },
          `Mismatch & j>0 → skip back: j = lps[${j - 1}] = ${lps[j - 1]}`,
          [i],
          [j],
          found,
          [...lps],
        );
        j = lps[j - 1];
      } else {
        snap(11, { i, j }, `Mismatch & j=0 → just advance i`, [i], [j], found, [
          ...lps,
        ]);
        i++;
      }
    }
  }

  snap(
    12,
    {},
    `Done! ${found.length} match(es): [${found.join(", ")}]`,
    [],
    [],
    found,
    [...lps],
  );
  return steps;
}
