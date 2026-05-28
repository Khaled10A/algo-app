export function bubbleSort(arr) {
  const a = [...arr]; let comps = 0;
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++) { comps++; if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]]; }
  return { sorted: a, comparisons: comps };
}

export function bubbleSortSteps(arr) {
  const a = [...arr], steps = [{ arr: [...a], highlight: [] }];
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; steps.push({ arr: [...a], highlight: [j, j + 1] }); }
    }
  return steps;
}
