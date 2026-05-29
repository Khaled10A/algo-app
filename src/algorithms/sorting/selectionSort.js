/**
 * Selection Sort — Brute Force
 * Time: O(n²) | Space: O(1)
 */
export function selectionSort(arr) {
  const a = [...arr]; let comparisons = 0;
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) { comparisons++; if (a[j] < a[minIdx]) minIdx = j; }
    [a[i], a[minIdx]] = [a[minIdx], a[i]];
  }
  return { sorted: a, comparisons };
}

export function selectionSortSteps(arr) {
  const a = [...arr], steps = [{ arr: [...a], highlight: [] }];
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) if (a[j] < a[minIdx]) minIdx = j;
    [a[i], a[minIdx]] = [a[minIdx], a[i]]; steps.push({ arr: [...a], highlight: [i, minIdx] });
  }
  return steps;
}

export function selectionSortDebug(arr) {
  const a = [...arr];
  const steps = [];

  const snap = (activeLine, vars, log) => steps.push({
    arr: [...a],
    highlight: vars.minIdx !== undefined ? [vars.i, vars.minIdx] : [],
    activeLine,
    vars: { ...vars },
    memory: {
      "arr":    `[${a.join(", ")}]`,
      "i":      vars.i      !== undefined ? String(vars.i)      : "-",
      "j":      vars.j      !== undefined ? String(vars.j)      : "-",
      "minIdx": vars.minIdx !== undefined ? String(vars.minIdx) : "-",
    },
    callStack: ["selectionSort(arr)", vars.j !== undefined ? "  └ inner for(j=i+1..n)" : "  └ outer for(i=0..n-1)"],
    log,
  });

  snap(0, {}, "Start: arr initialized");

  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    snap(2, { i, minIdx }, `Pass ${i+1}: assume minimum at index ${i} = ${a[i]}`);
    for (let j = i + 1; j < a.length; j++) {
      snap(3, { i, j, minIdx }, `Compare A[${j}]=${a[j]} with min A[${minIdx}]=${a[minIdx]}`);
      if (a[j] < a[minIdx]) {
        minIdx = j;
        snap(4, { i, j, minIdx }, `New minimum found: A[${minIdx}]=${a[minIdx]}`);
      }
    }
    [a[i], a[minIdx]] = [a[minIdx], a[i]];
    snap(5, { i, minIdx }, `Swap A[${i}] ↔ A[${minIdx}]: [${a.join(", ")}]`);
  }

  snap(6, {}, `Done! Sorted: [${a.join(", ")}]`);
  return steps;
}
