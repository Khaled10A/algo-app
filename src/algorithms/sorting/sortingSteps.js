/**
 * Projects sorting event sequences (Heap Sort today; Counting/Radix/
 * Shell/Bucket tomorrow where events map onto the vocabulary) into the
 * debugger snapshot schema:
 *
 *   { activeLine, log, vars, memory, callStack,
 *     arr, highlight, boundary, sortedFrom, phase }
 *
 * `arr`/`highlight` keep the snapshots directly consumable by the
 * array-bar visualizer; `boundary`/`sortedFrom` expose heap and sorted
 * regions for algorithms that have them (absent → no markers).
 *
 * Pure and deterministic: one event maps to exactly one snapshot.
 *
 * lineMap: { init, buildStart, compare, swap, buildComplete,
 *            extractMax, complete }
 */
export function projectSortingEvents(events, { lineMap, label = "heapSort" }) {
  let array = [];

  const steps = [];

  const snapshot = (event) => {
    const vars = {};
    const memory = {};
    const callStack = [`${label}(array)`];
    const indices = event.indices || [];
    const values = event.values || [];
    const phase = event.phase || null;
    const boundary = event.boundary ?? null;
    let complete = false;
    let highlight = [];
    let sortedFrom = phase === "extract" ? boundary : null;
    let log = "";

    switch (event.type) {
      case "init": {
        array = [...event.array];
        Object.assign(vars, { size: String(event.size) });
        Object.assign(memory, { array: `[${event.array.join(", ")}]` });
        callStack.push("  └ load array");
        log = `Load array [${event.array.join(", ")}]`;
        break;
      }
      case "build-start": {
        Object.assign(vars, { phase: "build max heap", boundary: String(event.boundary) });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push("  └ build max heap");
        log = "Build max heap — sift down from the last parent";
        break;
      }
      case "compare": {
        const [x, y] = indices;
        highlight = [x, y];
        Object.assign(vars, {
          [`a[${x}]`]: String(values[0]),
          [`a[${y}]`]: String(values[1]),
          phase: phase ?? "",
        });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push(`  └ compare a[${x}] vs a[${y}]`);
        log = `Compare a[${x}]=${values[0]} vs a[${y}]=${values[1]}`;
        break;
      }
      case "swap": {
        const [x, y] = indices;
        [array[x], array[y]] = [array[y], array[x]];
        highlight = [x, y];
        sortedFrom = event.sortedFrom ?? sortedFrom;
        Object.assign(vars, {
          [`a[${x}]`]: String(values[0]),
          [`a[${y}]`]: String(values[1]),
          phase: phase ?? "",
        });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push(`  └ swap a[${x}] ↔ a[${y}]`);
        log = `Swap a[${x}] ↔ a[${y}]`;
        break;
      }
      case "build-complete": {
        Object.assign(vars, { phase: "max heap built", boundary: String(event.boundary) });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push("  └ max heap built");
        log = "Max heap built — every parent ≥ its children";
        break;
      }
      case "extract-max": {
        const [x, y] = indices;
        highlight = [x, y];
        sortedFrom = event.boundary;
        Object.assign(vars, {
          "max value": String(event.value),
          "moved to index": String(y),
          boundary: String(event.boundary),
        });
        Object.assign(memory, {
          array: `[${array.join(", ")}]`,
          "sorted region": `${y}..${array.length - 1}`,
        });
        callStack.push(`  └ extract max ${event.value} → index ${y}`);
        log = `Extract max ${event.value} — swap root ↔ index ${y}, shrink heap`;
        break;
      }
      case "complete": {
        complete = true;
        sortedFrom = event.sortedFrom ?? 0;
        Object.assign(vars, { comparisons: String(event.comparisons) });
        Object.assign(memory, { array: `[${array.join(", ")}]` });
        callStack.push("  └ sorted");
        log = `Done — ${array.length} elements sorted, ${event.comparisons} comparisons`;
        break;
      }
      default:
        log = event.type;
    }

    steps.push({
      activeLine: lineMap[event.type] ?? lineMap.complete,
      log,
      vars,
      memory,
      callStack,
      arr: [...array],
      highlight: [...highlight],
      boundary,
      sortedFrom,
      phase,
      complete,
    });
  };

  for (const event of events) snapshot(event);
  return steps;
}
