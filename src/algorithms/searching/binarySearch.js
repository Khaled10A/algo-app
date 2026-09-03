/**
 * Binary Search — Decrease & Conquer
 * Time: O(log n) | Space: O(1)
 * Requires: sorted array
 */
export function binarySearch(arr, target) {
  let comparisons = 0;
  let lo = 0,
    hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    comparisons++;
    if (arr[mid] === target) return { found: true, index: mid, comparisons };
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { found: false, index: -1, comparisons };
}

export function binarySearchDebug(arr, targetOverride) {
  const sorted = [...arr].sort((a, b) => a - b);
  const target =
    targetOverride !== undefined && targetOverride !== null
      ? targetOverride
      : sorted[Math.floor(sorted.length / 2)];
  const steps = [];

  const snap = (activeLine, lo, hi, mid, vars, log) =>
    steps.push({
      arr: sorted,
      highlight: mid !== undefined ? [lo, mid, hi] : [],
      activeLine,
      vars: {
        lo: String(lo),
        hi: String(hi),
        mid: mid !== undefined ? String(mid) : "-",
        target: String(target),
        ...vars,
      },
      memory: {
        arr: `[${sorted.join(", ")}]`,
        target: String(target),
        lo: String(lo),
        hi: String(hi),
        mid: mid !== undefined ? String(mid) : "-",
      },
      callStack: [
        "binarySearch(arr, target)",
        mid !== undefined
          ? `  └ checking arr[${mid}]=${sorted[mid]}`
          : "  └ initializing",
      ],
      log,
    });

  let lo = 0,
    hi = sorted.length - 1;
  snap(0, lo, hi, undefined, {}, `Start: target=${target}, array sorted`);

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    snap(2, lo, hi, mid, {}, `mid=${mid}, arr[${mid}]=${sorted[mid]}`);

    if (sorted[mid] === target) {
      snap(
        3,
        lo,
        hi,
        mid,
        {},
        `✓ Found! arr[${mid}]=${sorted[mid]} == target=${target}`,
      );
      break;
    } else if (sorted[mid] < target) {
      snap(
        4,
        lo,
        hi,
        mid,
        {},
        `arr[${mid}]=${sorted[mid]} < ${target} → search RIGHT half`,
      );
      lo = mid + 1;
      snap(5, lo, hi, mid, {}, `New lo=${lo}`);
    } else {
      snap(
        6,
        lo,
        hi,
        mid,
        {},
        `arr[${mid}]=${sorted[mid]} > ${target} → search LEFT half`,
      );
      hi = mid - 1;
      snap(7, lo, hi, mid, {}, `New hi=${hi}`);
    }
  }

  if (lo > hi) snap(8, lo, hi, undefined, {}, `✗ Not found (lo > hi)`);
  return steps;
}
