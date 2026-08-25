const defaultNow = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function round4(n) {
  return Math.round(n * 10000) / 10000;
}

/**
 * Measures a function without blocking concerns.
 * - setup() prepares fresh arguments OUTSIDE the timed region.
 * - warmup iterations run before any measurement (JIT warm-up).
 * - repeats measurements are aggregated with the median.
 * - operation counters come from the first measured invocation.
 */
export function measure(fn, { setup, warmup = 1, repeats = 3, now = defaultNow } = {}) {
  const prepare = setup || (() => []);
  for (let w = 0; w < warmup; w++) fn(...prepare());

  const times = [];
  let firstOutput = null;
  for (let r = 0; r < repeats; r++) {
    const args = prepare();
    const t0 = now();
    const out = fn(...args);
    const t1 = now();
    times.push(t1 - t0);
    if (r === 0) firstOutput = out;
  }

  return { time: median(times), output: firstOutput };
}

/**
 * Runs a materialized benchmark job.
 *
 * job = {
 *   algos:     [{ id, run }],
 *   scenarios: [{ key, makeInput(size) -> args[] , collect? }],
 *   sizes:     [number],
 *   repeats, warmup
 * }
 *
 * Inputs are created once per (scenario, size) and SHARED across all
 * algorithms so every algorithm is measured on identical data (paired
 * comparison) — a fairer methodology than regenerating random inputs
 * per algorithm.
 */
export function runBenchmarkJob(job, options = {}) {
  const now = options.now || defaultNow;
  const repeats = job.repeats ?? 3;
  const warmup = job.warmup ?? 1;

  const results = {};
  for (const algo of job.algos) results[algo.id] = {};

  for (const scenario of job.scenarios) {
    for (const algo of job.algos) results[algo.id][scenario.key] = [];

    for (const size of job.sizes) {
      const input = scenario.makeInput(size);

      for (const algo of job.algos) {
        const { time, output } = measure(algo.run, {
          setup: () => input,
          warmup,
          repeats,
          now,
        });

        const first = Array.isArray(input) ? input[0] : input;
        const point = {
          n: typeof first === "string" ? first.length : (Array.isArray(first) ? first.length : size),
          time: round4(time),
          comparisons: output?.comparisons ?? 0,
        };
        if (scenario.collect === "matches") {
          point.matches = output?.matches ?? [];
        }
        results[algo.id][scenario.key].push(point);
      }
    }
  }

  return results;
}
