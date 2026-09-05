import { createEventCollector } from "../../core/execution/events";

/**
 * Fibonacci — Memoization (Top-Down with caching).
 *
 * O(n) time, O(n) space. Shows the recursion tree with cache hits.
 *
 * Returns { result, events }.
 */
export function fibonacciMemo(n) {
  if (n < 0) throw new Error("Fibonacci is not defined for negative numbers");
  if (n > 30) throw new Error("Input too large for visualization (max 30)");

  const { emit, events } = createEventCollector();
  const memo = new Array(n + 1).fill(null);
  const callStack = [];

  // Initialize: build the empty table
  emit("init", {
    table: [memo.map((v) => ({ value: v, state: "empty" }))],
    rowLabels: [""],
    colLabels: Array.from({ length: n + 1 }, (_, i) => `F(${i})`),
    inputVars: { n: String(n) },
    log: `Fibonacci(${n}) with memoization — memo[${n + 1}] cells`,
  });

  function fib(k) {
    // Base case
    if (k <= 1) {
      const val = k;
      memo[k] = val;
      emit("skip-cell", {
        cell: [0, k],
        value: val,
        vars: { k: String(k), result: String(val) },
        log: `Base case: F(${k}) = ${val}`,
      });
      return val;
    }

    // Cache hit
    if (memo[k] !== null) {
      emit("compare-cell", {
        cell: [0, k],
        dependencies: [],
        vars: {
          k: String(k),
          cached: "true",
          result: String(memo[k]),
        },
        log: `Cache hit: F(${k}) = ${memo[k]} (already computed)`,
      });
      return memo[k];
    }

    // Recursive computation
    callStack.push(k);
    emit("compute-cell", {
      cell: [0, k],
      value: null,
      dependencies: [],
      vars: {
        k: String(k),
        phase: "compute",
        depth: String(callStack.length),
      },
      log: `Computing F(${k}) = F(${k - 1}) + F(${k - 2})`,
    });

    const left = fib(k - 1);
    const right = fib(k - 2);
    const result = left + right;
    memo[k] = result;
    callStack.pop();

    emit("compute-cell", {
      cell: [0, k],
      value: result,
      dependencies: [[0, k - 1], [0, k - 2]],
      vars: {
        k: String(k),
        F: `F(${k - 1})+F(${k - 2}) = ${left}+${right}`,
        result: String(result),
        depth: String(callStack.length),
      },
      log: `F(${k}) = F(${k - 1}) + F(${k - 2}) = ${left} + ${right} = ${result}`,
    });

    return result;
  }

  const result = fib(n);

  emit("complete", {
    answer: String(result),
    log: `Done — F(${n}) = ${result}`,
  });

  return { result, events };
}
