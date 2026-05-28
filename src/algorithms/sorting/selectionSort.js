export function selectionSort(arr) {
  const a = [...arr]; let comps = 0;
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) { comps++; if (a[j] < a[minIdx]) minIdx = j; }
    [a[i], a[minIdx]] = [a[minIdx], a[i]];
  }
  return { sorted: a, comparisons: comps };
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
