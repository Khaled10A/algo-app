import { createEventCollector } from "../../core/execution/events";

/**
 * Fibonacci — Tabulation (Bottom-Up).
 *
 * O(n) time, O(n) space. Shows the DP table being filled left-to-right.
 *
 * Returns { result, events }.
 */
export function fibonacciTab(n) {
  if (n < 0) throw new Error("Fibonacci is not defined for negative numbers");
  if (n > 30) throw new Error("Input too large for visualization (max 30)");

  const { emit, events } = createEventCollector();

  // Build initial table: all null except we'll fill base cases
  const table = Array.from({ length: n + 1 }, () => ({ value: null, state: "empty" }));

  emit("init", {
    table: [table.map((c) => ({ ...c }))],
    rowLabels: [""],
    colLabels: Array.from({ length: n + 1 }, (_, i) => `F(${i})`),
    inputVars: { n: String(n) },
    log: `Fibonacci(${n}) with tabulation — dp[${n + 1}] cells`,
  });

  // Base case: F(0) = 0
  table[0] = { value: 0, state: "computed" };
  emit("skip-cell", {
    cell: [0, 0],
    value: 0,
    vars: { i: "0", "dp[0]": "0" },
    log: "Base case: dp[0] = F(0) = 0",
  });

  // Base case: F(1) = 1 (only if n >= 1)
  if (n >= 1) {
    table[1] = { value: 1, state: "computed" };
    emit("skip-cell", {
      cell: [0, 1],
      value: 1,
      vars: { i: "1", "dp[1]": "1" },
      log: "Base case: dp[1] = F(1) = 1",
    });
  }

  // Fill left-to-right from 2 to n
  for (let i = 2; i <= n; i++) {
    const prev1 = table[i - 1].value;
    const prev2 = table[i - 2].value;
    const val = prev1 + prev2;

    emit("compare-cell", {
      cell: [0, i],
      dependencies: [[0, i - 1], [0, i - 2]],
      vars: {
        i: String(i),
        "dp[i-1]": String(prev1),
        "dp[i-2]": String(prev2),
      },
      log: `Reading dp[${i - 1}] = ${prev1} and dp[${i - 2}] = ${prev2}`,
    });

    table[i] = { value: val, state: "computed" };
    emit("compute-cell", {
      cell: [0, i],
      value: val,
      dependencies: [[0, i - 1], [0, i - 2]],
      vars: {
        i: String(i),
        "dp[i-1]": String(prev1),
        "dp[i-2]": String(prev2),
        result: String(val),
      },
      log: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${prev1} + ${prev2} = ${val}`,
    });
  }

  emit("complete", {
    answer: String(table[n].value),
    log: `Done — F(${n}) = ${table[n].value}`,
  });

  return { result: table[n].value, events };
}
