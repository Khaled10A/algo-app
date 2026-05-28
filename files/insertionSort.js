export function insertionSort(arr) {
  const a = [...arr]; let comps = 0;
  for (let i = 1; i < a.length; i++) {
    let key = a[i], j = i - 1;
    while (j >= 0 && (comps++, a[j] > key)) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
  return { sorted: a, comparisons: comps };
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
