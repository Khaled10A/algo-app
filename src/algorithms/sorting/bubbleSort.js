/**
 * Bubble Sort — Brute Force
 * Time: O(n²) avg/worst | O(n) best
 * Space: O(1)
 */
export function bubbleSort(arr) {
  const a = [...arr];
  let comparisons = 0;
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++) {
      comparisons++;
      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    }
  return { sorted: a, comparisons };
}

export function bubbleSortSteps(arr) {
  const a = [...arr],
    steps = [{ arr: [...a], highlight: [] }];
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ arr: [...a], highlight: [j, j + 1] });
      }
    }
  return steps;
}

export function bubbleSortDebug(arr) {
  const a = [...arr];
  const steps = [];

  const snap = (activeLine, vars, log) =>
    steps.push({
      arr: [...a],
      highlight: vars.j !== undefined ? [vars.j, vars.j + 1] : [],
      activeLine,
      vars: { ...vars },
      memory: {
        arr: `[${a.join(", ")}]`,
        i: vars.i !== undefined ? String(vars.i) : "-",
        j: vars.j !== undefined ? String(vars.j) : "-",
        swapped: vars.swapped !== undefined ? String(vars.swapped) : "-",
      },
      callStack: [
        "bubbleSort(arr)",
        vars.j !== undefined
          ? "  └ inner for(j=0..n-i-1)"
          : "  └ outer for(i=0..n-1)",
      ],
      log,
    });

  snap(0, {}, "Start: arr initialized");

  for (let i = 0; i < a.length - 1; i++) {
    snap(2, { i }, `Pass ${i + 1}: comparing adjacent elements`);
    for (let j = 0; j < a.length - i - 1; j++) {
      snap(
        3,
        { i, j, swapped: false },
        `Compare A[${j}]=${a[j]} with A[${j + 1}]=${a[j + 1]}`,
      );
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        snap(
          4,
          { i, j, swapped: true },
          `Swap! A[${j}]=${a[j]} ↔ A[${j + 1}]=${a[j + 1]}`,
        );
      }
    }
  }

  snap(5, {}, `Done! Sorted: [${a.join(", ")}]`);
  return steps;
}
