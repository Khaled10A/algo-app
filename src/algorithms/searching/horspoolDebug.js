/**
 * Horspool Search — Debug Version
 * Shows the bad-character shift table construction and the rightward jumps.
 */
export function horspoolDebug(text, pattern) {
  const steps = [];
  const n = text.length, m = pattern.length;

  const snap = (activeLine, vars, log, highlightText = [], highlightPat = [], matches = [], shiftTable = {}) =>
    steps.push({
      activeLine,
      vars,
      log,
      text,
      pattern,
      highlightText,
      highlightPat,
      matchPositions: [...matches],
      shiftTable: { ...shiftTable },
      memory: {
        text: `"${text.length > 20 ? text.slice(0, 20) + "…" : text}"`,
        pattern: `"${pattern}"`,
        n: String(n),
        m: String(m),
        i: vars.i !== undefined ? String(vars.i) : "-",
        k: vars.k !== undefined ? String(vars.k) : "-",
        shift: vars.shift !== undefined ? String(vars.shift) : "-",
        matches: `[${matches.join(", ")}]`,
      },
      callStack: [
        "horspoolSearch(text, pattern)",
        vars.phase === "build"
          ? `  └ build shift table`
          : vars.k !== undefined
          ? `  └ compare right-to-left  k=${vars.k}`
          : vars.i !== undefined
          ? `  └ aligned at i=${vars.i}`
          : "  └ init",
      ],
    });

  if (m === 0 || m > n) {
    snap(0, {}, "Pattern empty or longer than text — no search needed.", [], [], [], {});
    return steps;
  }

  // ── Build shift table ────────────────────────────────────
  const shift = {};
  snap(0, { phase: "build" }, "Phase 1: Build bad-character shift table", [], [], [], {});

  for (let i = 0; i < m - 1; i++) {
    shift[pattern[i]] = m - 1 - i;
    snap(
      1,
      { phase: "build", i },
      `shift['${pattern[i]}'] = ${m - 1 - i}  (distance from right end)`,
      [],
      [i],
      [],
      { ...shift },
    );
  }
  snap(2, { phase: "build" }, `Table ready. Unknown chars shift by m=${m}`, [], [], [], { ...shift });

  // ── Search ───────────────────────────────────────────────
  const found = [];
  let i = m - 1;  // i points to the rightmost char of the current window

  while (i < n) {
    snap(3, { i }, `Align window: text[${i - m + 1}..${i}] vs pattern`, 
      Array.from({ length: m }, (_, k) => i - m + 1 + k), [], found, { ...shift });

    let k = 0;
    // compare right-to-left
    while (k < m) {
      const ti = i - k, pi = m - 1 - k;
      snap(
        4,
        { i, k },
        `Compare text[${ti}]='${text[ti]}' with pattern[${pi}]='${pattern[pi]}' (right→left)`,
        [ti],
        [pi],
        found,
        { ...shift },
      );

      if (text[ti] !== pattern[pi]) {
        snap(5, { i, k }, `Mismatch '${text[ti]}' ≠ '${pattern[pi]}'`, [ti], [pi], found, { ...shift });
        break;
      }
      k++;
    }

    if (k === m) {
      found.push(i - m + 1);
      snap(6, { i, k }, `✓ Match at index ${i - m + 1}!`,
        Array.from({ length: m }, (_, x) => i - m + 1 + x),
        Array.from({ length: m }, (_, x) => x),
        found, { ...shift });
    }

    const badChar = text[i];
    const s = shift[badChar] !== undefined ? shift[badChar] : m;
    snap(7, { i, shift: s },
      `Bad char text[${i}]='${badChar}' → shift by ${s}`,
      [i], [], found, { ...shift });
    i += s;
  }

  snap(8, {}, `Done! ${found.length} match(es): [${found.join(", ")}]`, [], [], found, { ...shift });
  return steps;
}
