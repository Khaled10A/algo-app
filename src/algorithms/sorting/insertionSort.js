/**
 * Insertion Sort — Decrease & Conquer
 * Time: O(n²) avg/worst | O(n) best
 * Space: O(1)
 */
export function insertionSort(arr) {
  const a = [...arr]; let comparisons = 0;
  for (let i = 1; i < a.length; i++) {
    let key = a[i], j = i - 1;
    while (j >= 0 && (comparisons++, a[j] > key)) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
  return { sorted: a, comparisons };
}

export function insertionSortSteps(arr) {
  const a = [...arr], steps = [{ arr: [...a], highlight: [] }];
  for (let i = 1; i < a.length; i++) {
    let key = a[i], j = i - 1;
    while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; steps.push({ arr: [...a], highlight: [j + 1, j + 2] }); }
    a[j + 1] = key; steps.push({ arr: [...a], highlight: [j + 1] });
  }
  return steps;
}

/**
 * Debug steps — each step has: arr, highlight, activeLine, vars, memory, log
 */
export function insertionSortDebug(arr) {
  const a = [...arr];
  const steps = [];

  const snap = (activeLine, vars, log) => steps.push({
    arr: [...a],
    highlight: vars.j !== undefined ? [vars.j, vars.j + 1] : [],
    activeLine,
    vars: { ...vars },
    memory: {
      "arr": `[${a.join(", ")}]`,
      "i":   vars.i   !== undefined ? String(vars.i)   : "-",
      "j":   vars.j   !== undefined ? String(vars.j)   : "-",
      "key": vars.key !== undefined ? String(vars.key) : "-",
    },
    callStack: ["insertionSort(arr)", vars.j !== undefined ? "  └ inner while(j≥0 && arr[j]>key)" : "  └ outer for(i=1..n)"],
    log,
  });

  snap(0, {}, "Start: arr initialized");

  for (let i = 1; i < a.length; i++) {
    let key = a[i], j = i - 1;
    snap(2, { i, j, key }, `Outer loop: i=${i}, key=A[${i}]=${key}`);

    while (j >= 0 && a[j] > key) {
      snap(3, { i, j, key }, `A[${j}]=${a[j]} > key=${key} → shift right`);
      a[j + 1] = a[j];
      j--;
      snap(4, { i, j, key }, `Shifted: A[${j + 2}]=A[${j + 1}], j=${j}`);
    }
    a[j + 1] = key;
    snap(5, { i, j, key }, `Insert key=${key} at position ${j + 1}`);
  }

  snap(6, {}, `Done! Sorted: [${a.join(", ")}]`);
  return steps;
}
