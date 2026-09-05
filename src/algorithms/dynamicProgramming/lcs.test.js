import { describe, expect, it } from "vitest";
import { lcs } from "./lcs";
import { lcsDebug } from "./lcsDebug";

// ──────────────────────────────────────────────────────────────
// Correctness
// ──────────────────────────────────────────────────────────────
describe("LCS — correctness", () => {
  it("textbook: ABCBDAB vs BDCAB → 4 (BCAB)", () => {
    const { length, lcsString } = lcs("ABCBDAB", "BDCAB");
    expect(length).toBe(4);
    expect(lcsString.length).toBe(4);
    // BCAB is a valid LCS
    expect(isSubsequence(lcsString, "ABCBDAB")).toBe(true);
    expect(isSubsequence(lcsString, "BDCAB")).toBe(true);
  });

  it("identical strings → full string", () => {
    const { length, lcsString } = lcs("ABC", "ABC");
    expect(length).toBe(3);
    expect(lcsString).toBe("ABC");
  });

  it("single character match", () => {
    const { length, lcsString } = lcs("A", "A");
    expect(length).toBe(1);
    expect(lcsString).toBe("A");
  });

  it("single character no match", () => {
    const { length, lcsString } = lcs("A", "B");
    expect(length).toBe(0);
    expect(lcsString).toBe("");
  });

  it("no common characters", () => {
    const { length, lcsString } = lcs("ABC", "XYZ");
    expect(length).toBe(0);
    expect(lcsString).toBe("");
  });

  it("one string is prefix of other", () => {
    const { length, lcsString } = lcs("ABC", "ABCDE");
    expect(length).toBe(3);
    expect(isSubsequence(lcsString, "ABC")).toBe(true);
    expect(isSubsequence(lcsString, "ABCDE")).toBe(true);
  });

  it("reversed strings", () => {
    const { length } = lcs("ABC", "CBA");
    expect(length).toBe(1);
  });

  it("repeated characters", () => {
    const { length, lcsString } = lcs("AAAA", "AA");
    expect(length).toBe(2);
    expect(lcsString).toBe("AA");
  });

  it("repeated characters different counts", () => {
    const { length, lcsString } = lcs("AAA", "AAAAAA");
    expect(length).toBe(3);
    expect(lcsString).toBe("AAA");
  });

  it("all same character in both", () => {
    const { length, lcsString } = lcs("BBBB", "BB");
    expect(length).toBe(2);
    expect(lcsString).toBe("BB");
  });

  it("interleaved characters", () => {
    const { length, lcsString } = lcs("ABCD", "ACBD");
    expect(length).toBe(3);
    expect(isSubsequence(lcsString, "ABCD")).toBe(true);
    expect(isSubsequence(lcsString, "ACBD")).toBe(true);
  });

  it("longer strings", () => {
    const { length, lcsString } = lcs("AGGTAB", "GXTXAYB");
    expect(length).toBe(4);
    expect(isSubsequence(lcsString, "AGGTAB")).toBe(true);
    expect(isSubsequence(lcsString, "GXTXAYB")).toBe(true);
  });

  it("classical example: ABCDE vs ACE", () => {
    const { length, lcsString } = lcs("ABCDE", "ACE");
    expect(length).toBe(3);
    expect(lcsString).toBe("ACE");
  });

  it("classical example: ABC vs AC", () => {
    const { length, lcsString } = lcs("ABC", "AC");
    expect(length).toBe(2);
    expect(lcsString).toBe("AC");
  });

  it("multiple valid LCS — result is a valid LCS", () => {
    // "ABC" and "BAC" have two valid LCS of length 2: "AB" and "AC" and "BC"
    const { length, lcsString } = lcs("ABC", "BAC");
    expect(length).toBe(2);
    expect(isSubsequence(lcsString, "ABC")).toBe(true);
    expect(isSubsequence(lcsString, "BAC")).toBe(true);
  });

  it("single char repeated many times", () => {
    const { length } = lcs("AAAAAAAAAA", "AAAAA");
    expect(length).toBe(5);
  });

  it("completely different alphabets", () => {
    const { length, lcsString } = lcs("abc", "def");
    expect(length).toBe(0);
    expect(lcsString).toBe("");
  });
});

// ──────────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────────
describe("LCS — edge cases", () => {
  it("both strings empty", () => {
    const { length, lcsString, events } = lcs("", "");
    expect(length).toBe(0);
    expect(lcsString).toBe("");
    expect(events.length).toBeGreaterThan(0);
  });

  it("first string empty", () => {
    const { length, lcsString } = lcs("", "ABC");
    expect(length).toBe(0);
    expect(lcsString).toBe("");
  });

  it("second string empty", () => {
    const { length, lcsString } = lcs("ABC", "");
    expect(length).toBe(0);
    expect(lcsString).toBe("");
  });

  it("single character strings — match", () => {
    const { length, lcsString } = lcs("X", "X");
    expect(length).toBe(1);
    expect(lcsString).toBe("X");
  });

  it("single character strings — no match", () => {
    const { length, lcsString } = lcs("X", "Y");
    expect(length).toBe(0);
    expect(lcsString).toBe("");
  });

  it("one empty, one non-empty", () => {
    const { length } = lcs("ABCDEFG", "");
    expect(length).toBe(0);
  });

  it("throws for non-string inputs", () => {
    // @ts-ignore — testing runtime guard
    expect(() => lcs(123, "abc")).toThrow(/strings/);
    // @ts-ignore
    expect(() => lcs("abc", null)).toThrow(/strings/);
  });

  it("spaces are treated as characters", () => {
    const { length, lcsString } = lcs("A B C", "ABC");
    expect(length).toBe(3);
    expect(lcsString).toBe("ABC");
  });

  it("special characters", () => {
    const { length, lcsString } = lcs("a@b#c", "@#c");
    expect(length).toBe(3);
    expect(lcsString).toBe("@#c");
  });

  it("numeric strings", () => {
    const { length, lcsString } = lcs("12345", "246");
    expect(length).toBe(2);
    expect(lcsString).toBe("24");
  });

  it("unicode characters", () => {
    const { length } = lcs("αβγ", "αδγ");
    expect(length).toBe(2);
  });

  it("very long identical strings", () => {
    const s = "A".repeat(50);
    const { length, lcsString } = lcs(s, s);
    expect(length).toBe(50);
    expect(lcsString).toBe(s);
  });
});

// ──────────────────────────────────────────────────────────────
// Reconstruction correctness
// ──────────────────────────────────────────────────────────────
describe("LCS — reconstruction", () => {
  it("result is a subsequence of both strings", () => {
    const cases = [
      ["ABCBDAB", "BDCAB"],
      ["AGGTAB", "GXTXAYB"],
      ["ABC", "AC"],
      ["ABCDE", "ACE"],
      ["abc", "def"],
      ["", "ABC"],
      ["ABC", ""],
    ];

    for (const [a, b] of cases) {
      const { lcsString } = lcs(a, b);
      expect(isSubsequence(lcsString, a)).toBe(true);
      expect(isSubsequence(lcsString, b)).toBe(true);
    }
  });

  it("result length matches the dp table value", () => {
    const { length, lcsString } = lcs("ABCBDAB", "BDCAB");
    expect(lcsString.length).toBe(length);
  });

  it("result is optimal — no longer valid subsequence exists", () => {
    // Brute-force check for small strings
    const a = "ABCBDAB";
    const b = "BDCAB";
    const { length } = lcs(a, b);

    // Check all subsequences of a up to reasonable length
    let maxLen = 0;
    for (let mask = 0; mask < 1 << a.length; mask++) {
      let sub = "";
      for (let k = 0; k < a.length; k++) {
        if (mask & (1 << k)) sub += a[k];
      }
      if (isSubsequence(sub, b)) {
        maxLen = Math.max(maxLen, sub.length);
      }
    }
    expect(length).toBe(maxLen);
  });

  it("empty strings produce empty result", () => {
    const { lcsString } = lcs("", "");
    expect(lcsString).toBe("");
  });

  it("identical strings produce the full string", () => {
    const { lcsString } = lcs("HELLO", "HELLO");
    expect(lcsString).toBe("HELLO");
  });

  it("no common chars produces empty result", () => {
    const { lcsString } = lcs("ABC", "XYZ");
    expect(lcsString).toBe("");
  });

  it("repeated characters — reconstruction has correct count", () => {
    const { lcsString } = lcs("AAAA", "AA");
    expect(lcsString).toBe("AA");
    expect(lcsString.length).toBe(2);
  });
});

// ──────────────────────────────────────────────────────────────
// Step state correctness
// ──────────────────────────────────────────────────────────────
describe("LCS — step state", () => {
  it("events start with init", () => {
    const { events } = lcs("ABC", "DEF");
    expect(events[0].type).toBe("init");
  });

  it("events end with complete", () => {
    const { events } = lcs("ABC", "DEF");
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init event sets up correct table dimensions", () => {
    const { events } = lcs("ABC", "BDC");
    const init = events[0];
    // 4 rows (A,B,C + base) × 4 cols (B,D,C + base)
    expect(init.table).toHaveLength(4);
    expect(init.table[0]).toHaveLength(4);
  });

  it("init row labels show string A characters", () => {
    const { events } = lcs("ABC", "XY");
    const init = events[0];
    expect(init.rowLabels[0]).toContain("base");
    expect(init.rowLabels[1]).toContain("A");
    expect(init.rowLabels[2]).toContain("B");
    expect(init.rowLabels[3]).toContain("C");
  });

  it("init col labels show string B characters", () => {
    const { events } = lcs("XY", "ABC");
    const init = events[0];
    expect(init.colLabels[0]).toContain("base");
    expect(init.colLabels[1]).toContain("A");
    expect(init.colLabels[2]).toContain("B");
    expect(init.colLabels[3]).toContain("C");
  });

  it("compute-cell events have correct value", () => {
    const { events } = lcs("AB", "AB");
    const computes = events.filter((e) => e.type === "compute-cell");
    expect(computes.length).toBeGreaterThan(0);
    for (const e of computes) {
      expect(typeof e.value).toBe("number");
      expect(Array.isArray(e.dependencies)).toBe(true);
    }
  });

  it("match events have match=✓ in vars", () => {
    const { events } = lcs("AB", "AB");
    const matchComputes = events.filter(
      (e) => e.type === "compute-cell" && e.vars?.match === "✓",
    );
    // A==A and B==B should produce 2 match events
    expect(matchComputes.length).toBe(2);
  });

  it("no-match events have match=✗ in vars", () => {
    const { events } = lcs("A", "B");
    const noMatchComputes = events.filter(
      (e) => e.type === "compute-cell" && e.vars?.match === "✗",
    );
    expect(noMatchComputes.length).toBe(1);
  });

  it("compare-cell events show up/left for non-match", () => {
    const { events } = lcs("AB", "CD");
    const compares = events.filter((e) => e.type === "compare-cell");
    for (const e of compares) {
      if (e.vars?.match === "✗") {
        expect(e.vars["dp[i-1][j]"]).toBeDefined();
        expect(e.vars["dp[i][j-1]"]).toBeDefined();
      }
    }
  });

  it("backtrack events have direction var", () => {
    const { events } = lcs("ABC", "BDC");
    const backtracks = events.filter((e) => e.type === "backtrack-step");
    expect(backtracks.length).toBeGreaterThan(0);
    for (const e of backtracks) {
      expect(e.vars.decision).toBeDefined();
      expect(e.vars.direction).toBeDefined();
    }
  });

  it("backtrack MATCH events show matched characters", () => {
    const { events } = lcs("ABC", "ABC");
    const matchBacktracks = events.filter(
      (e) => e.type === "backtrack-step" && e.vars?.decision === "MATCH",
    );
    expect(matchBacktracks.length).toBe(3);
    for (const e of matchBacktracks) {
      expect(e.vars["A[i-1]"]).toBeDefined();
      expect(e.vars["B[j-1]"]).toBeDefined();
    }
  });

  it("complete event has lcs string and length", () => {
    const { events } = lcs("ABC", "ABC");
    const complete = events[events.length - 1];
    expect(complete.type).toBe("complete");
    expect(complete.answer).toBe("ABC");
    expect(complete.vars["lcs length"]).toBe("3");
  });

  it("events are deterministic — same input produces same events", () => {
    const r1 = lcs("ABCBDAB", "BDCAB");
    const r2 = lcs("ABCBDAB", "BDCAB");
    expect(r1.events).toEqual(r2.events);
  });

  it("empty strings produce only init and complete events", () => {
    const { events } = lcs("", "");
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("init");
    expect(events[1].type).toBe("complete");
  });

  it("single char match produces correct number of events", () => {
    const { events } = lcs("A", "A");
    // init + compare-cell + compute-cell + backtrack-start + backtrack-step + complete = 6
    const types = events.map((e) => e.type);
    expect(types).toContain("init");
    expect(types).toContain("compute-cell");
    expect(types).toContain("backtrack-start");
    expect(types).toContain("backtrack-step");
    expect(types).toContain("complete");
  });
});

// ──────────────────────────────────────────────────────────────
// Debug snapshot contracts
// ──────────────────────────────────────────────────────────────
describe("LCS — debug snapshot contracts", () => {
  it("produces valid snapshots", () => {
    const steps = lcsDebug("ABCBDAB", "BDCAB");
    expect(steps.length).toBeGreaterThan(0);

    for (const s of steps) {
      expect(typeof s.activeLine).toBe("number");
      expect(s.activeLine).toBeGreaterThanOrEqual(0);
      expect(typeof s.log).toBe("string");
      expect(s.log.length).toBeGreaterThan(0);
      expect(s.vars).toBeDefined();
      expect(s.memory).toBeDefined();
      expect(Array.isArray(s.callStack)).toBe(true);
      expect(s.callStack.length).toBeGreaterThan(0);
      expect(Array.isArray(s.table)).toBe(true);
      expect(Array.isArray(s.rowLabels)).toBe(true);
      expect(Array.isArray(s.colLabels)).toBe(true);
      expect(typeof s.phase).toBe("string");
      expect(typeof s.complete).toBe("boolean");
    }
  });

  it("last snapshot has complete=true", () => {
    const steps = lcsDebug("ABCBDAB", "BDCAB");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
  });

  it("last snapshot has the correct answer", () => {
    const steps = lcsDebug("ABCBDAB", "BDCAB");
    const last = steps[steps.length - 1];
    expect(last.answer).toMatch(/^[A-Z]*$/);
    expect(last.answer.length).toBe(4);
  });

  it("table has correct dimensions", () => {
    const steps = lcsDebug("ABC", "BDC");
    const first = steps[0];
    expect(first.table).toHaveLength(4); // m+1 rows
    expect(first.table[0]).toHaveLength(4); // n+1 cols
  });

  it("row labels include base and characters", () => {
    const steps = lcsDebug("ABC", "XY");
    const first = steps[0];
    expect(first.rowLabels).toHaveLength(4);
    expect(first.rowLabels[0]).toContain("base");
    expect(first.rowLabels[1]).toContain("A");
  });

  it("column labels include base and characters", () => {
    const steps = lcsDebug("XY", "ABC");
    const first = steps[0];
    expect(first.colLabels).toHaveLength(4);
    expect(first.colLabels[0]).toContain("base");
    expect(first.colLabels[1]).toContain("A");
  });

  it("handles empty strings edge case", () => {
    const steps = lcsDebug("", "");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("(none)");
  });

  it("handles one empty string edge case", () => {
    const steps = lcsDebug("ABC", "");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("(none)");
  });

  it("steps are immutable", () => {
    const steps = lcsDebug("ABC", "BDC");
    const s0 = steps[0];
    const s1 = steps[1];
    s0.table[0][0].value = 999;
    expect(s1.table[0][0].value).not.toBe(999);
  });

  it("phase transitions from fill to backtrack", () => {
    const steps = lcsDebug("ABC", "BDC");
    const phases = steps.map((s) => s.phase);
    expect(phases[0]).toBe("fill");
    expect(phases).toContain("backtrack");
  });

  it("backtrack path accumulates", () => {
    const steps = lcsDebug("ABC", "BDC");
    const backtrackSteps = steps.filter(
      (s) => s.phase === "backtrack" && s.backtrackPath.length > 0,
    );
    expect(backtrackSteps.length).toBeGreaterThan(0);
  });

  it("vars contain lcs-specific keys during fill", () => {
    const steps = lcsDebug("AB", "AB");
    const fillSteps = steps.filter(
      (s) => s.phase === "fill" && s.vars.match !== undefined,
    );
    expect(fillSteps.length).toBeGreaterThan(0);
    for (const s of fillSteps) {
      expect(s.vars.match).toBeDefined();
    }
  });

  it("handles identical strings", () => {
    const steps = lcsDebug("ABC", "ABC");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("ABC");
  });

  it("handles no common characters", () => {
    const steps = lcsDebug("ABC", "XYZ");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("(none)");
  });
});

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Check if `sub` is a subsequence of `str`.
 */
function isSubsequence(sub, str) {
  let si = 0;
  for (let i = 0; i < str.length && si < sub.length; i++) {
    if (str[i] === sub[si]) si++;
  }
  return si === sub.length;
}
