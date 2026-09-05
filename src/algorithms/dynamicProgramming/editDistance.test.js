import { describe, expect, it } from "vitest";
import { editDistance } from "./editDistance";
import { editDistanceDebug } from "./editDistanceDebug";

// ──────────────────────────────────────────────────────────────
// Correctness
// ──────────────────────────────────────────────────────────────
describe("EditDistance — correctness", () => {
  it("textbook: kitten → sitting → 3", () => {
    const { distance, operations } = editDistance("kitten", "sitting");
    expect(distance).toBe(3);
    const nonMatchOps = operations.filter((o) => o.op !== "MATCH");
    expect(nonMatchOps.length).toBe(3);
  });

  it("identical strings: ABC → ABC → 0", () => {
    const { distance, operations } = editDistance("ABC", "ABC");
    expect(distance).toBe(0);
    expect(operations.every((o) => o.op === "MATCH")).toBe(true);
  });

  it("completely different: ABC → XYZ → 3", () => {
    const { distance } = editDistance("ABC", "XYZ");
    expect(distance).toBe(3);
  });

  it("single character replacement: A → B → 1", () => {
    const { distance } = editDistance("A", "B");
    expect(distance).toBe(1);
  });

  it("insertion: AB → ABC → 1", () => {
    const { distance, operations } = editDistance("AB", "ABC");
    expect(distance).toBe(1);
    expect(operations.some((o) => o.op === "INSERT")).toBe(true);
  });

  it("deletion: ABC → AB → 1", () => {
    const { distance, operations } = editDistance("ABC", "AB");
    expect(distance).toBe(1);
    expect(operations.some((o) => o.op === "DELETE")).toBe(true);
  });

  it("replacement: ABC → AXC → 1", () => {
    const { distance, operations } = editDistance("ABC", "AXC");
    expect(distance).toBe(1);
    expect(operations.some((o) => o.op === "REPLACE")).toBe(true);
  });

  it("classical: sunday → saturday → 3", () => {
    const { distance } = editDistance("sunday", "saturday");
    expect(distance).toBe(3);
  });

  it("classical: horse → ros → 3", () => {
    const { distance } = editDistance("horse", "ros");
    expect(distance).toBe(3);
  });

  it("classical: INTENTION → EXECUTION → 5", () => {
    const { distance } = editDistance("INTENTION", "EXECUTION");
    expect(distance).toBe(5);
  });

  it("empty → ABC → 3 (three inserts)", () => {
    const { distance, operations } = editDistance("", "ABC");
    expect(distance).toBe(3);
    expect(operations).toHaveLength(3);
    expect(operations.every((o) => o.op === "INSERT")).toBe(true);
  });

  it("ABC → empty → 3 (three deletes)", () => {
    const { distance, operations } = editDistance("ABC", "");
    expect(distance).toBe(3);
    expect(operations).toHaveLength(3);
    expect(operations.every((o) => o.op === "DELETE")).toBe(true);
  });

  it("both empty → 0", () => {
    const { distance, operations } = editDistance("", "");
    expect(distance).toBe(0);
    expect(operations).toHaveLength(0);
  });

  it("symmetry: distance(A,B) == distance(B,A)", () => {
    const pairs = [
      ["kitten", "sitting"],
      ["ABC", "XYZ"],
      ["sunday", "saturday"],
      ["horse", "ros"],
      ["", "abc"],
      ["abc", ""],
    ];
    for (const [a, b] of pairs) {
      expect(editDistance(a, b).distance).toBe(editDistance(b, a).distance);
    }
  });

  it("triangle inequality: d(A,C) <= d(A,B) + d(B,C)", () => {
    const a = "kitten",
      b = "sitting",
      c = "sitting";
    const dAB = editDistance(a, b).distance;
    const dBC = editDistance(b, c).distance;
    const dAC = editDistance(a, c).distance;
    expect(dAC).toBeLessThanOrEqual(dAB + dBC);
  });

  it("single character to empty", () => {
    expect(editDistance("A", "").distance).toBe(1);
    expect(editDistance("", "A").distance).toBe(1);
  });

  it("longer strings", () => {
    const { distance } = editDistance("algorithm", "altruistic");
    expect(distance).toBe(6);
  });

  it("prefix relationship", () => {
    expect(editDistance("ABC", "ABCDE").distance).toBe(2);
    expect(editDistance("ABCDE", "ABC").distance).toBe(2);
  });
});

// ──────────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────────
describe("EditDistance — edge cases", () => {
  it("both empty", () => {
    const { distance, events } = editDistance("", "");
    expect(distance).toBe(0);
    expect(events.length).toBeGreaterThan(0);
  });

  it("source empty", () => {
    const { distance, operations } = editDistance("", "hello");
    expect(distance).toBe(5);
    expect(operations.every((o) => o.op === "INSERT")).toBe(true);
  });

  it("target empty", () => {
    const { distance, operations } = editDistance("hello", "");
    expect(distance).toBe(5);
    expect(operations.every((o) => o.op === "DELETE")).toBe(true);
  });

  it("single character match", () => {
    const { distance, operations } = editDistance("A", "A");
    expect(distance).toBe(0);
    expect(operations).toHaveLength(1);
    expect(operations[0].op).toBe("MATCH");
  });

  it("single character replace", () => {
    const { distance } = editDistance("A", "B");
    expect(distance).toBe(1);
  });

  it("throws for non-string inputs", () => {
    // @ts-ignore
    expect(() => editDistance(123, "abc")).toThrow(/strings/);
    // @ts-ignore
    expect(() => editDistance("abc", null)).toThrow(/strings/);
  });

  it("unicode characters", () => {
    const { distance } = editDistance("αβγ", "αδγ");
    expect(distance).toBe(1);
  });

  it("spaces are characters", () => {
    const { distance } = editDistance("A B", "AB");
    expect(distance).toBe(1);
  });

  it("special characters", () => {
    const { distance } = editDistance("a@b", "a#b");
    expect(distance).toBe(1);
  });

  it("numeric strings", () => {
    const { distance } = editDistance("12345", "1245");
    expect(distance).toBe(1);
  });

  it("repeated characters", () => {
    expect(editDistance("AAA", "AAAA").distance).toBe(1);
    expect(editDistance("AAAA", "AAA").distance).toBe(1);
    expect(editDistance("AAA", "BBB").distance).toBe(3);
  });

  it("very long identical strings", () => {
    const s = "A".repeat(50);
    expect(editDistance(s, s).distance).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────
// Reconstruction correctness
// ──────────────────────────────────────────────────────────────
describe("EditDistance — reconstruction", () => {
  it("operations transform source into target", () => {
    const cases = [
      ["kitten", "sitting"],
      ["ABC", "AXC"],
      ["AB", "ABC"],
      ["ABC", "AB"],
      ["horse", "ros"],
      ["", "abc"],
      ["abc", ""],
      ["A", "A"],
    ];

    for (const [source, target] of cases) {
      const { operations } = editDistance(source, target);
      const result = applyOps(source, operations);
      expect(result).toBe(target);
    }
  });

  it("operation count equals distance", () => {
    const cases = [
      ["kitten", "sitting"],
      ["ABC", "XYZ"],
      ["horse", "ros"],
      ["sunday", "saturday"],
    ];
    for (const [a, b] of cases) {
      const { distance, operations } = editDistance(a, b);
      const nonMatchOps = operations.filter((o) => o.op !== "MATCH");
      expect(nonMatchOps.length).toBe(distance);
    }
  });

  it("MATCH operations have matching characters", () => {
    const { operations } = editDistance("ABC", "ABC");
    for (const op of operations) {
      expect(op.op).toBe("MATCH");
      expect(op.sourceChar).toBe(op.targetChar);
    }
  });

  it("REPLACE operations have different characters", () => {
    const { operations } = editDistance("ABC", "AXC");
    const replaces = operations.filter((o) => o.op === "REPLACE");
    expect(replaces.length).toBe(1);
    expect(replaces[0].sourceChar).toBe("B");
    expect(replaces[0].targetChar).toBe("X");
  });

  it("DELETE operations remove source characters", () => {
    const { operations } = editDistance("ABC", "AB");
    const deletes = operations.filter((o) => o.op === "DELETE");
    expect(deletes.length).toBe(1);
    expect(deletes[0].sourceChar).toBe("C");
  });

  it("INSERT operations add target characters", () => {
    const { operations } = editDistance("AB", "ABC");
    const inserts = operations.filter((o) => o.op === "INSERT");
    expect(inserts.length).toBe(1);
    expect(inserts[0].targetChar).toBe("C");
  });

  it("empty to empty produces no operations", () => {
    const { operations } = editDistance("", "");
    expect(operations).toHaveLength(0);
  });

  it("identical strings produce all MATCH operations", () => {
    const { operations } = editDistance("HELLO", "HELLO");
    expect(operations).toHaveLength(5);
    expect(operations.every((o) => o.op === "MATCH")).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// Step state correctness
// ──────────────────────────────────────────────────────────────
describe("EditDistance — step state", () => {
  it("events start with init", () => {
    const { events } = editDistance("AB", "CD");
    expect(events[0].type).toBe("init");
  });

  it("events end with complete", () => {
    const { events } = editDistance("AB", "CD");
    expect(events[events.length - 1].type).toBe("complete");
  });

  it("init event sets up correct table dimensions", () => {
    const { events } = editDistance("ABC", "BDC");
    const init = events[0];
    expect(init.table).toHaveLength(4);
    expect(init.table[0]).toHaveLength(4);
  });

  it("init row labels show source characters", () => {
    const { events } = editDistance("ABC", "XY");
    const init = events[0];
    expect(init.rowLabels[0]).toContain("base");
    expect(init.rowLabels[1]).toContain("A");
    expect(init.rowLabels[2]).toContain("B");
    expect(init.rowLabels[3]).toContain("C");
  });

  it("init col labels show target characters", () => {
    const { events } = editDistance("XY", "ABC");
    const init = events[0];
    expect(init.colLabels[0]).toContain("base");
    expect(init.colLabels[1]).toContain("A");
  });

  it("compute-cell events have operation var", () => {
    const { events } = editDistance("AB", "CD");
    const computes = events.filter((e) => e.type === "compute-cell");
    expect(computes.length).toBeGreaterThan(0);
    for (const e of computes) {
      expect(typeof e.value).toBe("number");
    }
  });

  it("match events have MATCH operation", () => {
    const { events } = editDistance("AB", "AB");
    const matchComputes = events.filter(
      (e) => e.type === "compute-cell" && e.vars?.operation === "MATCH",
    );
    expect(matchComputes.length).toBe(2);
  });

  it("non-match events show DELETE/INSERT/REPLACE", () => {
    const { events } = editDistance("A", "B");
    const compares = events.filter((e) => e.type === "compare-cell");
    expect(compares.length).toBe(1);
    expect(compares[0].vars.DELETE).toBeDefined();
    expect(compares[0].vars.INSERT).toBeDefined();
    expect(compares[0].vars.REPLACE).toBeDefined();
    expect(compares[0].vars.chosen).toBeDefined();
  });

  it("backtrack events have decision var", () => {
    const { events } = editDistance("ABC", "BDC");
    const backtracks = events.filter((e) => e.type === "backtrack-step");
    expect(backtracks.length).toBeGreaterThan(0);
    for (const e of backtracks) {
      expect(e.vars.decision).toBeDefined();
      expect(["MATCH", "REPLACE", "DELETE", "INSERT"]).toContain(
        e.vars.decision,
      );
    }
  });

  it("complete event has distance and operations", () => {
    const { events } = editDistance("kitten", "sitting");
    const complete = events[events.length - 1];
    expect(complete.type).toBe("complete");
    expect(complete.vars.distance).toBe("3");
    expect(complete.vars.operations).toBeDefined();
  });

  it("events are deterministic", () => {
    const r1 = editDistance("kitten", "sitting");
    const r2 = editDistance("kitten", "sitting");
    expect(r1.events).toEqual(r2.events);
  });

  it("empty strings produce only init and complete events", () => {
    const { events } = editDistance("", "");
    expect(events).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────────────────────
// Debug snapshot contracts
// ──────────────────────────────────────────────────────────────
describe("EditDistance — debug snapshot contracts", () => {
  it("produces valid snapshots", () => {
    const steps = editDistanceDebug("kitten", "sitting");
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
    const steps = editDistanceDebug("kitten", "sitting");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
  });

  it("last snapshot has correct answer", () => {
    const steps = editDistanceDebug("kitten", "sitting");
    const last = steps[steps.length - 1];
    expect(last.answer).toBe("3");
  });

  it("table has correct dimensions", () => {
    const steps = editDistanceDebug("ABC", "BDC");
    const first = steps[0];
    expect(first.table).toHaveLength(4);
    expect(first.table[0]).toHaveLength(4);
  });

  it("handles both empty", () => {
    const steps = editDistanceDebug("", "");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("0");
  });

  it("handles source empty", () => {
    const steps = editDistanceDebug("", "abc");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("3");
  });

  it("handles target empty", () => {
    const steps = editDistanceDebug("abc", "");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("3");
  });

  it("handles identical strings", () => {
    const steps = editDistanceDebug("ABC", "ABC");
    const last = steps[steps.length - 1];
    expect(last.complete).toBe(true);
    expect(last.answer).toBe("0");
  });

  it("steps are immutable", () => {
    const steps = editDistanceDebug("AB", "CD");
    const s0 = steps[0];
    const s1 = steps[1];
    s0.table[0][0].value = 999;
    expect(s1.table[0][0].value).not.toBe(999);
  });

  it("phase transitions from fill to backtrack", () => {
    const steps = editDistanceDebug("AB", "CD");
    const phases = steps.map((s) => s.phase);
    expect(phases[0]).toBe("fill");
    expect(phases).toContain("backtrack");
  });

  it("backtrack path accumulates", () => {
    const steps = editDistanceDebug("AB", "CD");
    const backtrackSteps = steps.filter(
      (s) => s.phase === "backtrack" && s.backtrackPath.length > 0,
    );
    expect(backtrackSteps.length).toBeGreaterThan(0);
  });

  it("vars contain edit-distance-specific keys during fill", () => {
    const steps = editDistanceDebug("AB", "CD");
    const fillSteps = steps.filter(
      (s) =>
        s.phase === "fill" &&
        (s.vars.DELETE !== undefined || s.vars.operation !== undefined),
    );
    expect(fillSteps.length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Apply edit operations to source string and return the result.
 */
function applyOps(source, operations) {
  let result = "";
  let _srcIdx = 0;
  for (const op of operations) {
    switch (op.op) {
      case "MATCH":
      case "REPLACE":
        result += op.targetChar;
        _srcIdx++;
        break;
      case "DELETE":
        _srcIdx++;
        break;
      case "INSERT":
        result += op.targetChar;
        break;
    }
  }
  return result;
}
