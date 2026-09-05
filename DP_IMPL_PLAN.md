# Dynamic Programming — Implementation Plan

> Deep architecture inspection + concrete plan for adding a `dynamicProgramming` domain to algo-app.

---

## 1. Architecture Inspection Summary

### How algorithms are registered

Every algorithm lives in a category directory (`sorting/`, `searching/`, `graphs/`). Each category exports a descriptor array (e.g. `sortingDescriptors`) imported into `src/algorithms/registry.js` and spread into `ALL_DESCRIPTORS`. A `DOMAINS` array in the same file defines which sub-tabs appear for each domain. Adding a new domain requires:

1. A new category directory with a `descriptors.js` file
2. Importing and spreading the new descriptor array into `ALL_DESCRIPTORS`
3. Adding a new entry to `DOMAINS` with the appropriate `subTabs`

No other files need to change for the algorithm to be discovered by `getAlgorithm()`, `getWithDebug()`, `getByCategory()`, etc.

### How the event→projector→snapshot pipeline works

Modern algorithms (Heap Sort, Counting Sort, Radix Sort, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim, Kruskal) use this pattern:

1. **Algorithm module** uses `createEventCollector()` to emit a deterministic, JSON-serializable event stream (e.g. `{ type: "visit-node", node: "A", distance: 5 }`).
2. **Debug file** calls the algorithm, then pipes `result.events` through a **projector** (e.g. `projectPathfindingEvents`, `projectMstEvents`, `projectMatrixEvents`).
3. The projector maps each event to exactly one **debugger snapshot** via a `lineMap` (event type → code line number).
4. Snapshots carry the standard debug schema: `{ activeLine, log, vars, memory, callStack }` plus domain-specific fields.

This is the cleanest architecture to follow for DP.

### How the debugger renders snapshots

- `DebuggerTab.jsx`: For sorting/searching domains. Shows code lines with active-line highlighting, array/string state visualization, variables, memory, call stack, playback controls.
- `GraphDebugger.jsx`: For the graphs domain. Shows algorithm selector, graph editor, SVG visualization, code lines, queue/heap/stack panels, variables, distances, and MatrixView for Floyd-Warshall.

Both use `usePlayback` for RAF-based step-by-step animation.

### MatrixView.jsx

A pure presentational component that renders an HTML `<table>` with:
- Row/column headers (node IDs)
- Cell highlighting: current `(i,j)` pair (accent), updated cells (green), negative-cycle nodes (red diagonal)
- Props: `nodes`, `matrix`, `kNode`, `i`, `j`, `updatedCells`, `negativeCycleNodes`, `isDark`, `compact`

This is **highly reusable** for DP table visualization — with minor generalization (row labels vs column labels can differ).

### usePlayback.js

Hook providing: `{ index, playing, play, pause, toggle, next, prev, reset, goToEnd, speed, setSpeed, setStep }`. Works with any array of steps. Fully reusable.

### createEventCollector()

Returns `{ events, emit(type, data) }`. A flat array of `{ type, ...data }` objects. Fully reusable for DP.

### Styling conventions

- Palette accessed via `getPalette(isDark ? "dark" : "light")`
- CSS classes: `glass-floating`, `surface-card`, `editor-surface`
- Inline styles (no CSS-in-JS library)
- Code lines shown in `editor-surface` divs with line-number gutter and active-line accent border
- All UI colors use palette tokens (`p.accent`, `p.green`, `p.orange`, `p.pink`, etc.)

### Test conventions

- Unit tests: Vitest with `describe/it/expect` in `src/algorithms/` directories
- Test file naming: `algorithmName.test.js`
- Contracts test: `src/algorithms/contracts.test.js` validates all descriptors (unique IDs, metadata, run/steps/debug equivalence, debug snapshot invariants)
- E2E: Cypress in `cypress/e2e/app.cy.js`
- Smoke: `src/App.smoke.test.jsx` with Testing Library

---

## 2. Where DP Algorithms Should Live

**Yes, `src/algorithms/dynamicProgramming/` is the right directory.** This follows the existing convention of one directory per category.

### File structure

```
src/algorithms/dynamicProgramming/
├── descriptors.js              ← descriptor array + code line constants
├── fibonacciMemo.js            ← algorithm + events
├── fibonacciMemoDebug.js       ← debug projection
├── fibonacciTab.js             ← algorithm + events
├── fibonacciTabDebug.js        ← debug projection
├── knapsack.js                 ← algorithm + events
├── knapsackDebug.js            ← debug projection
├── lcs.js                      ← algorithm + events
├── lcsDebug.js                 ← debug projection
├── lis.js                      ← algorithm + events
├── lisDebug.js                 ← debug projection
├── matrixChain.js              ← algorithm + events
├── matrixChainDebug.js         ← debug projection
├── editDistance.js              ← algorithm + events
├── editDistanceDebug.js         ← debug projection
├── dpSteps.js                  ← projector: events → snapshots
└── dynamicProgramming.test.js  ← unit tests
```

---

## 3. Reusable DP Step/State Abstraction

**Yes, a shared projector is needed.** All 7 DP algorithms share the same core visualization pattern: fill a 2D table cell-by-cell, then optionally backtrack. The differences are:

- Table dimensions (1D for Fibonacci, 2D for the rest)
- Fill direction (left→right/top→bottom, or diagonal)
- What "comparing cells" means
- Whether there's a backtracking phase

A single `projectDPEvents()` projector handles all of these, parameterized by a `lineMap` and a `tableLabels` function (row/column header names).

### DP event vocabulary

```
init           — table created, input parameters set
compare-cell   — reading a dependency cell (e.g. dp[i-1][j])
update-cell    — writing a new value into dp[i][j]
skip-cell      — base case or pruning
backtrack-start — fill complete, beginning reconstruction
backtrack-step — moving to the next cell in the backtracking path
complete       — answer ready, backtracking done
```

---

## 4. How DP Tables Are Represented

Each snapshot carries a `table` field: a 2D array of cell objects.

```js
// Cell state during fill phase:
{
  value: 3,        // computed value (null if not yet computed)
  state: "computed" // "empty" | "computed" | "comparing" | "current" | "backtrack" | "backtrack-path"
}

// Table in a snapshot:
{
  table: [
    [{ value: 0, state: "computed" }, { value: null, state: "empty" }, ...],
    [{ value: null, state: "empty" }, { value: null, state: "empty" }, ...],
    ...
  ],
  rowLabels: ["", "a", "b", "c"],  // header labels
  colLabels: ["", "x", "y", "z"],
  current: [1, 2],                   // [row, col] of the cell being computed
  compares: [[0, 2], [1, 1]],        // cells being read as dependencies
  complete: false,
  log: "dp[1][2] = max(dp[0][2], dp[1][1] + 1) = 2",
  activeLine: 5,
  vars: { i: "1", j: "2", ... },
  memory: { ... },
  callStack: ["lcs(text1, text2)"],
  backtrackPath: null,               // set during backtracking phase
  answer: null                       // final answer string
}
```

For **Fibonacci** (1D), the table is `[[cell, cell, ...]]` — a single-row table. This keeps the rendering code uniform.

---

## 5. How Table-Cell Highlighting Works

Extend `MatrixView.jsx` to accept DP-specific props, or create a thin `DPTableView` wrapper around the same `<table>` structure:

| Cell state | Visual treatment |
|---|---|
| `empty` | Muted background, faint text |
| `computed` | Normal text, slight green tint on recent cells |
| `comparing` | Orange background (dependency being read) |
| `current` | Accent border + accent tint (actively computing) |
| `backtrack` | Pink/magenta highlight (current backtracking cell) |
| `backtrack-path` | Light pink background (already visited during backtracking) |

Row/column headers use accent color for the active row/column.

**Decision: Generalize MatrixView.** Add optional props `rowLabels`, `colLabels`, `cellRenderer`, and `compact` mode. The existing Floyd-Warshall usage continues to work with default props. DP tables pass custom `rowLabels`/`colLabels` and cell-state-based highlighting.

---

## 6. How Playback Moves Through DP States

Each "step" is one cell in the fill phase (or one step in backtracking). The total step count equals:

- **Fill phase**: number of cells filled (e.g. `m * n` for a 2D table, or `n` for 1D Fibonacci)
- **Backtracking phase**: length of the backtracking path (e.g. length of LCS, path in knapsack)

This maps directly to the existing `usePlayback({ length: steps.length })` pattern. Each step advances by one cell or one backtrack move.

**Speed**: Same as existing — speed slider from 100ms to 1000ms per step.

---

## 7. How Reconstruction/Backtracking Is Represented

During the fill phase, snapshots only show table filling. When the fill completes:

1. A `backtrack-start` event transitions the projector into backtracking mode.
2. Each `backtrack-step` event highlights the current cell on the reconstruction path and adds it to a growing `backtrackPath` array.
3. The snapshot's `answer` field progressively builds the result string (e.g. LCS characters, knapsack items).

This mirrors the existing two-phase pattern in Heap Sort (build heap → extract max) and KMP (build LPS → search).

---

## 8. How DP Algorithms Integrate with registry.js

### DOMAINS entry

```js
{
  id: "dynamicProgramming",
  label: "Dynamic Programming",
  subTabs: ["debugger", "complexity", "pseudocode"],
}
```

No benchmark, visualizer, history, or report sub-tabs initially — DP algorithms are visualization-focused, not benchmark-focused. (Benchmark can be added later if desired.)

### Descriptor shape

```js
{
  id: "fibonacci-memo",
  name: "Fibonacci (Memoization)",
  category: "dynamicProgramming",
  color: "#bf5af2",
  complexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
    space: "O(n)",
    paradigm: "Dynamic Programming / Top-Down",
  },
  run: null,    // not benchmarkable initially
  steps: null,  // no visualizer bar chart
  debug: (input) => fibonacciMemoDebug(input),
  pseudocode: `...`,
  codeLines: FIBONACCI_MEMO_CODE_LINES,
  group: "dp",  // for debugger grouping
}
```

### Registry changes

```js
// src/algorithms/registry.js
import { dpDescriptors } from "./dynamicProgramming/descriptors";

export const ALL_DESCRIPTORS = [
  ...sortingDescriptors,
  ...searchingDescriptors,
  ...graphDescriptors,
  ...dpDescriptors,
];

// Add to DOMAINS:
{
  id: "dynamicProgramming",
  label: "Dynamic Programming",
  subTabs: ["debugger", "complexity", "pseudocode"],
}
```

### Contracts test update

```js
// In contracts.test.js, add:
expect(getWithDebug(["dynamicProgramming"])).toHaveLength(7);
```

---

## 9. What Existing Components Can Be Reused

| Component | Reuse for DP? | How? |
|---|---|---|
| `usePlayback` | **Yes, directly** | Identical step-based playback |
| `createEventCollector` | **Yes, directly** | Same event-emission pattern |
| `MatrixView` | **Yes, generalized** | Add `rowLabels`, `colLabels`, cell-state props |
| `DebuggerTab` | **Partially** | Pattern reference — DP needs its own tab due to unique table UI |
| `GraphDebugger` | **Pattern only** | Same GENERATE → steps → playback flow |
| `getPalette` | **Yes, directly** | All colors from palette tokens |
| `playVictory` / `playTone` | **Yes, directly** | Audio feedback |
| `ErrorBoundary` | **Yes, directly** | Already wraps the app |
| Code line display pattern | **Yes, copy** | Same `editor-surface` layout from DebuggerTab/GraphDebugger |
| Progress bar pattern | **Yes, copy** | Same step counter + range slider pattern |
| ConfigSidebar panels | **Yes, extend** | Add a `DPPanel` for algorithm-specific input (array, strings, weights) |

---

## 10. DPTableView — The New Component

Create `src/components/visualizer/DPTableView.jsx`. This is the primary visualization for the DP domain — a 2D grid with:

- Row and column headers (input labels)
- Cell coloring based on state (empty/computed/comparing/current/backtrack)
- Cell values rendered inside each `<td>`
- Compact mode for large tables
- Optional backtracking path overlay
- Answer display at the bottom

This is a separate component from `MatrixView` because:
- DP tables have different row/column labels (strings vs node IDs)
- DP needs cell-state highlighting (comparing/current/backtrack) vs Floyd-Warshall's (updated/k-pair)
- The cell rendering is different (null/number vs infinity/number)

However, the underlying `<table>` styling (border-collapse, font, padding) should be shared or at least visually consistent.

---

## 11. DPDebuggerTab — The New Tab Component

Create `src/tabs/DPDebuggerTab.jsx`. This is the main view for the Dynamic Programming domain.

### Layout

```
┌──────────────────────────────────────────────────┐
│ CONTROLS BAR                                      │
│ [Algorithm picker] [Input config] [Speed] [GEN]  │
├──────────────────────────────────────────────────┤
│ STEP INFO                                         │
│ Step 12/45 → Fill dp[2][3] = max(dp[1][3]...)   │
├──────────────────────────┬───────────────────────┤
│ DP TABLE (DPTableView)   │ CODE VIEW             │
│ (fills cell-by-cell)     │ (active line highlight)│
│                          ├───────────────────────┤
│                          │ VARIABLES             │
│                          │ { i: "2", j: "3" }    │
│                          ├───────────────────────┤
│                          │ MEMORY / ANSWER        │
│                          │ "Length: 3"            │
├──────────────────────────┴───────────────────────┤
│ PLAYBACK CONTROLS                                │
│ [⏮] [◀] [▶/⏸] [⏭]  ──●───────────────  Speed  │
└──────────────────────────────────────────────────┘
```

### Algorithm-specific input

Each DP algorithm needs different inputs:
- **Fibonacci (Memo/Tab)**: number `n` (slider, 1–30)
- **Knapsack**: weights array, values array, capacity (all editable)
- **LCS**: string 1, string 2 (text inputs)
- **LIS**: array (text input or auto-generate)
- **Matrix Chain**: dimensions array (e.g. "10,30,5,60")
- **Edit Distance**: string 1, string 2 (text inputs)

These go in the `ConfigSidebar` or inline in the controls bar, following the pattern from DebuggerTab (which has different input modes for sorting vs searching).

---

## 12. Integration with App.jsx

Add the DP tab to App.jsx's main content switch:

```jsx
{subTab === "debugger" && domain.id === "dynamicProgramming" && (
  <DPDebuggerTab isDark={isDark} />
)}
```

And for the ConfigSidebar, add a `dp` controls section (or handle DP input inline in `DPDebuggerTab` since the input is simpler and algorithm-specific).

For `complexity` and `pseudocode` sub-tabs, the existing `ComplexityTab` and `PseudocodeTab` should work if the descriptors are properly registered — they already filter by category. No changes needed.

---

## 13. Tests to Add

### Unit tests (`dynamicProgramming.test.js`)

1. **Correctness**: Each algorithm produces the correct answer for known inputs
2. **Event determinism**: Running the same input twice produces identical event sequences
3. **Snapshot invariants**: Every snapshot has `activeLine >= 0 && < codeLines.length`, `log` (string), `vars`, `memory`, `callStack`
4. **Terminal log**: Last snapshot matches `/Done|complete/i`
5. **Backtracking**: Algorithms with reconstruction (LCS, knapsack, LIS, edit distance) produce valid backtracking paths
6. **Memoization vs Tabulation equivalence**: Fibonacci memo and tab produce identical results

### Contracts test update

Add `dynamicProgramming` to the contracts test's descriptor count assertions:

```js
expect(getWithDebug(["dynamicProgramming"])).toHaveLength(7);
```

### Cypress E2E

Add 1-2 E2E tests:
1. Switch to DP domain → select an algorithm → generate → step through → verify final answer appears
2. Edit input → re-generate → verify the table updates

### Smoke test update

Add a test in `App.smoke.test.jsx`:
```js
it("exposes the DP debugger under the Dynamic Programming domain", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Dynamic Programming" }));
  expect(screen.getByText(/DYNAMIC PROGRAMMING/i)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /GENERATE/i }));
  expect(screen.getByText(/Step 1 \//)).toBeTruthy();
});
```

---

## 14. Complete File List

### Files to CREATE

| File | Purpose |
|---|---|
| `src/algorithms/dynamicProgramming/descriptors.js` | 7 descriptors + code line constants |
| `src/algorithms/dynamicProgramming/fibonacciMemo.js` | Fibonacci memoization algorithm + events |
| `src/algorithms/dynamicProgramming/fibonacciMemoDebug.js` | Debug projection |
| `src/algorithms/dynamicProgramming/fibonacciTab.js` | Fibonacci tabulation algorithm + events |
| `src/algorithms/dynamicProgramming/fibonacciTabDebug.js` | Debug projection |
| `src/algorithms/dynamicProgramming/knapsack.js` | 0/1 Knapsack algorithm + events |
| `src/algorithms/dynamicProgramming/knapsackDebug.js` | Debug projection |
| `src/algorithms/dynamicProgramming/lcs.js` | LCS algorithm + events |
| `src/algorithms/dynamicProgramming/lcsDebug.js` | Debug projection |
| `src/algorithms/dynamicProgramming/lis.js` | LIS algorithm + events |
| `src/algorithms/dynamicProgramming/lisDebug.js` | Debug projection |
| `src/algorithms/dynamicProgramming/matrixChain.js` | Matrix Chain Multiplication algorithm + events |
| `src/algorithms/dynamicProgramming/matrixChainDebug.js` | Debug projection |
| `src/algorithms/dynamicProgramming/editDistance.js` | Edit Distance algorithm + events |
| `src/algorithms/dynamicProgramming/editDistanceDebug.js` | Debug projection |
| `src/algorithms/dynamicProgramming/dpSteps.js` | Shared projector: events → DP snapshots |
| `src/algorithms/dynamicProgramming/dynamicProgramming.test.js` | Unit tests |
| `src/components/visualizer/DPTableView.jsx` | DP table visualization component |
| `src/tabs/DPDebuggerTab.jsx` | DP debugger tab |

### Files to MODIFY

| File | Change |
|---|---|
| `src/algorithms/registry.js` | Import `dpDescriptors`, spread into `ALL_DESCRIPTORS`, add `"dynamicProgramming"` to `DOMAINS` |
| `src/App.jsx` | Import `DPDebuggerTab`, add rendering case for `domain.id === "dynamicProgramming"` |
| `src/algorithms/contracts.test.js` | Add `getWithDebug(["dynamicProgramming"]).toHaveLength(7)` assertion |
| `src/App.smoke.test.jsx` | Add smoke test for DP domain |
| `cypress/e2e/app.cy.js` | Add E2E test for DP debugger |
| `src/components/visualizer/MatrixView.jsx` | Add optional `rowLabels`/`colLabels` props (backward-compatible) |

### Files that need NO changes

- `src/hooks/usePlayback.js` — reused as-is
- `src/core/execution/events.js` — reused as-is
- `src/theme/tokens.js` — palette already has all needed colors
- `src/tabs/ComplexityTab.jsx` — already filters by category
- `src/tabs/PseudocodeTab.jsx` — already filters by category
- All existing algorithm modules — untouched

---

## 15. Implementation Order

1. **Phase 1 — Infrastructure** (no visual changes yet)
   - Create `src/algorithms/dynamicProgramming/` directory
   - Create `dpSteps.js` projector (shared)
   - Create `descriptors.js` with all 7 descriptors (stub `debug` functions initially)
   - Register in `registry.js` (add to `ALL_DESCRIPTORS` + `DOMAINS`)
   - Verify `getAlgorithm("fibonacci-memo")` works

2. **Phase 2 — First algorithm end-to-end** (Fibonacci Memoization)
   - Implement `fibonacciMemo.js` (algorithm + events)
   - Implement `fibonacciMemoDebug.js` (debug projection)
   - Create `DPTableView.jsx`
   - Create `DPDebuggerTab.jsx`
   - Add rendering case in `App.jsx`
   - Verify: can switch to DP domain, select Fibonacci Memo, generate, step through, see table fill

3. **Phase 3 — Remaining algorithms**
   - Implement each algorithm + debug file in order:
     1. Fibonacci Tabulation
     2. LCS
     3. Edit Distance
     4. Knapsack
     5. LIS
     6. Matrix Chain Multiplication
   - Each one: implement algorithm → events → debug projection → verify in UI

4. **Phase 4 — Polish & tests**
   - Add `group: "dp"` to all descriptors for debugger grouping
   - Generalize `MatrixView.jsx` (backward-compatible)
   - Add unit tests (`dynamicProgramming.test.js`)
   - Update contracts test
   - Add smoke test
   - Add E2E test
   - Verify all existing tests still pass

---

## 16. Risk Assessment

| Risk | Mitigation |
|---|---|
| DP table sizes could be large for big inputs | Cap input sizes in the UI (e.g. Fibonacci ≤ 30, strings ≤ 20, knapsack items ≤ 15) |
| MatrixView generalization could break Floyd-Warshall | All new props are optional with defaults matching current behavior; test Floyd-Warshall E2E |
| Contracts test count assertions | Update the exact count from 8+3+7 to 8+3+7+7 |
| `showInspector` logic in App.jsx only shows sidebar for sorting/searching | Add `"dynamicProgramming"` to the `showInspector` condition, or handle DP input inline |
| Large event sequences | DP tables produce O(m×n) events which is fine for small inputs; the same scale as existing graph algorithms |

---

## 17. Complexity Tab Integration

The existing `ComplexityTab` already renders a reference table for all algorithms in a given category. It combines `getBenchmarkable("sorting")` and `getBenchmarkable("searching")`. For DP:

- `ComplexityTab` needs a small addition: when `tab === "dynamicProgramming"`, show the DP algorithm complexities
- Since DP algorithms have `run: null` (not benchmarkable), the "run side-by-side" comparison panel won't apply — show the reference table only

---

## 18. Pseudocode Tab Integration

The existing `PseudocodeTab` already renders `descriptor.pseudocode` + `descriptor.codeLines` for any algorithm. It uses the `pseudoAlgo` state from App.jsx. For DP:

- The `pseudoControls` already pick from `ALL_DESCRIPTORS`
- DP algorithms will appear in the pseudocode picker
- No changes needed to `PseudocodeTab` itself
- May want to add `setPseudoAlgo` behavior when switching to DP domain (auto-select the first DP algorithm)
