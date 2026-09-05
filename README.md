# Algo App

A React web application for **visualizing**, **benchmarking**, and **step-by-step debugging** of classic algorithms — built as part of a Design & Analysis of Algorithms (DAA) course. It lets students and developers run fair benchmarks, watch algorithms execute frame by frame, and step through their internal state with a live memory debugger.

**Live Demo:** [algo-app-lilac.vercel.app](https://algo-app-lilac.vercel.app)

---

## Key Features

- **Benchmarking** — Run sorting and string-matching algorithms against multiple input sizes and shapes; compare execution time or comparison counts via line and bar charts. Uses Web Workers for non-blocking measurement, warmup iterations, median aggregation, and shared identical inputs across algorithms for fair comparison.
- **Visualizer** — Watch sorting algorithms execute step by step with animated array bars, swap/compare highlighting, sorted-region markers, comparison counters, and audio tones. Driven by `requestAnimationFrame` with speed presets.
- **Memory Debugger** — Step through any algorithm with a live view of variables, memory state, call stack, and per-line source highlighting. Covers all 8 sorting algorithms, Binary Search (found/not-found targets), and Brute Force / Horspool / KMP string matching.
- **Graph Playground** — An interactive SVG graph editor (add, remove, connect, set weights) combined with step-by-step debuggers for DFS, BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim, and Kruskal. Shows colored visit states, queues/heaps/frontiers, distance badges, predecessor trees, and matrix views.
- **Complexity Reference** — Time and space complexity table with Big-O for best, average, and worst cases, plus a "run side-by-side" comparison panel.
- **Pseudocode** — Clean pseudocode display for every supported algorithm.
- **Run History** — Track and compare up to 20 previous benchmark runs side by side, persisted across sessions.
- **Auto Report** — Generates a narrative summary of benchmark results (best/worst performer, scaling assessment) ready to copy into coursework.
- **AI Assistant** — Ask questions about algorithms and results in Arabic or English. Requests are proxied through a serverless function so the API key never ships to the browser.
- **Export** — Results exportable as CSV, Excel (.xlsx via SheetJS), or PNG chart images.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | JavaScript (ES6+), JSX |
| UI Framework | React 18.3 |
| Build Tool / Dev Server | Vite 5 |
| Charts | Hand-written inline SVG (no charting library) |
| Excel Export | SheetJS `xlsx` (dynamically imported) |
| Unit / Component Tests | Vitest 4 + jsdom + Testing Library |
| E2E Tests | Cypress 13 |
| Serverless Function | Node.js (Vercel-style `api/` handler) |
| AI Provider | Groq (`llama-3.3-70b-versatile`) |
| Rate Limiting | Upstash Redis (optional, shared) / in-memory fallback |
| Deployment | Vercel |
| Persistence | Browser `localStorage` only — no database |

---

## Project Structure

```
.
├── index.html                  Vite HTML entry point
├── vite.config.js              Vite config: React plugin + build CSP + Vitest
├── package.json                Dependencies and scripts
├── .env.example                Environment variable template
├── Makefile                    Convenience make targets
├── api/
│   └── assistant.js            Serverless AI proxy (Groq chat completions)
├── landing/                    Standalone marketing page (not part of Vite build)
├── cypress/                    E2E tests
│   └── e2e/app.cy.js           Full app E2E suite (18 cases)
└── src/
    ├── main.jsx                React bootstrap (StrictMode + ErrorBoundary)
    ├── App.jsx                 Root component: layout, tabs, all settings
    ├── algorithms/             Algorithm implementations + descriptors
    │   ├── registry.js         Central descriptor registry + domain model
    │   ├── sorting/            8 sorts (insertion, bubble, selection, merge,
    │   │                       quick, heap, counting, radix) + debug/steps
    │   ├── searching/          Brute force, Horspool, KMP, Binary Search
    │   └── graphs/             DFS, BFS, Dijkstra, Bellman-Ford, Floyd-Warshall,
    │                           Prim, Kruskal + interactive graph editor model
    ├── core/
    │   ├── benchmark/          Engine (measure/median), jobs, Web Worker runner
    │   ├── execution/          Deterministic event collector
    │   └── structures/         MinHeap, DisjointSet (Union-Find)
    ├── components/
    │   ├── charts/             Hand-written SVG line/bar charts
    │   ├── sidebar/            Configuration panels per domain
    │   ├── ui/                 Header, shared primitives (buttons, inputs, checkboxes)
    │   └── visualizer/         Graph debugger SVG, matrix view
    ├── hooks/                  useBenchmarks, usePlayback, usePersistentState, useRunHistory
    ├── tabs/                   Benchmark, Visualizer, Debugger, Complexity,
    │                           Pseudocode, History, Report, AI Assistant
    ├── theme/                  Design tokens (dark/light palettes), ThemeContext
    ├── styles/                 Global CSS (glass materials, motion, themes)
    └── utils/                  Array/text generators, constants, export utils, audio
```

---

## Getting Started

### Prerequisites

- **Node.js v18** or higher
- npm (included with Node.js)

### Installation

```bash
git clone https://github.com/Khaled10A/algo-app.git
cd algo-app
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

All variables are optional. The app works fully without any of them — only the AI Assistant feature requires a key.

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Server-side key for Groq AI completions. **Never prefix with `VITE_`** — that would embed it in the public bundle. |
| `ALLOWED_ORIGIN` | Enables single-origin CORS for the AI endpoint (e.g. `https://algo-app-lilac.vercel.app`). |
| `UPSTASH_REDIS_REST_URL` | Enables shared rate limiting (15 req/min/IP) across serverless instances. Create a free database at [console.upstash.com](https://console.upstash.com). |
| `UPSTASH_REDIS_REST_TOKEN` | Token for the Upstash Redis database above. |
| `VITE_AI_ENDPOINT` | Override the AI proxy URL (default `/api/assistant`) — useful when developing locally without a serverless runtime. |

### AI Assistant Setup

The assistant calls `/api/assistant`, a serverless function that keeps the Groq API key on the server.

- **Local development:** Run `vercel dev` (which executes `api/` functions locally), or deploy first and set `VITE_AI_ENDPOINT` in your local `.env`.
- **Deployment (Vercel):** Set `GROQ_API_KEY` as an encrypted environment variable in your project settings.

### Production Build

```bash
npm run build
npm run preview
```

---

## Testing

```bash
npm run test:unit          # Vitest unit + component tests (348 tests)
npm run test:e2e           # Cypress E2E (start dev server in another terminal first)
npm run test:e2e:open      # Interactive Cypress runner
npm run lint               # ESLint
npm run format             # Prettier
```

---

## Detailed Feature Breakdown

### Benchmark Tab

Run any combination of sorting or string-matching algorithms against controlled inputs and compare their performance.

**How to use:**
1. Select algorithms to benchmark (checkboxes).
2. Choose input type: Random, Sorted, Reverse Sorted, or Nearly Sorted (sorting) — or Start, End, Multiple, No-Match (string matching). You can also upload a `.txt` file for string matching.
3. Enter comma-separated input sizes (e.g. `100, 500, 1000, 5000`) or use a custom array.
4. Pick a metric: Execution Time (ms) or Comparison Count.
5. Click **RUN**. Results appear as line charts, bar charts, and data tables with best/worst performer callouts.

**Under the hood:** Inputs are generated once per (shape, size) and shared across all algorithms for fair comparison. Each measurement uses warmup iterations and a median of 5 repeats. Runs execute in a Web Worker to keep the UI responsive, with a 120-second timeout and cancellation support.

### Visualizer Tab

Watch sorting algorithms execute step by step with animated array bars.

**How to use:**
1. Select an algorithm (Insertion, Bubble, Selection, Heap, Counting, or Radix Sort).
2. Set the array size and speed.
3. Click **GENERATE** then **PLAY**. Use step controls (next/prev/reset) for fine-grained control.

Highlights show comparisons and swaps in real time. Sorted regions are visually marked. Audio tones play on each highlighted operation.

### Debugger Tab

Step through any algorithm with a detailed view of its internal state.

**How to use:**
1. Select an algorithm and domain (Sorting, Searching, or Graphs).
2. Configure input (array size, text/pattern for string matching, or use the default graph).
3. Click **GENERATE** then step through with play/next/prev controls.

**What you see per step:**
- **Sorting:** Array bars with active elements highlighted, variable watches, memory snapshot, call stack, highlighted source line.
- **String Matching:** Text and pattern grids with highlight positions, LPS (for KMP) or shift (for Horspool) tables, match positions.
- **Binary Search:** Array with mid/low/high pointers, target value, found/not-found result.
- **Graphs:** Interactive SVG with colored visit states, queue/stack/heap panels, distance badges on nodes, predecessor tree, and for Floyd-Warshall the full distance matrix.

### Graph Playground

A full interactive graph domain combining an editor and algorithm debugger.

**How to use:**
1. The default graph is pre-loaded (5 nodes, weighted edges, intentionally disconnected for MST demos).
2. Edit the graph: click to add nodes, drag to connect, set weights, delete mode to remove elements.
3. Select a graph algorithm (DFS, BFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Prim, Kruskal).
4. Click **GENERATE** then step through the algorithm.

**Special behaviors:**
- Dijkstra rejects negative weights with a clear error message.
- Bellman-Ford detects negative cycles and shows an alert.
- Floyd-Warshall displays the full distance matrix with the current k-node highlighted.
- Prim and Kruskal show minimum spanning forest with total weight and tree count for disconnected graphs.

### Complexity Tab

Reference table showing best/average/worst time complexity and space complexity for every supported algorithm, plus a "Run Side-by-Side" panel that executes a quick comparison at n=100 (sorting) or text size 500 (string matching).

### Pseudocode Tab

Clean, readable pseudocode for any selected algorithm, with complexity chips showing the Big-O notation.

### History Tab

Lists up to 20 previous benchmark runs. Select 2–4 runs of the same kind (sorting or searching) to compare side by side with tables and mini-bars. Persisted in `localStorage` across sessions.

### Report Tab

Auto-generates a narrative analysis of your latest benchmark: best/worst algorithm, per-input-shape winners, measured vs. theoretical scaling. Ready to copy into coursework or documentation.

### AI Assistant Tab

Chat with an AI assistant about algorithms and your benchmark results. Supports Arabic and English.

**Features:**
- Quick-action buttons for common questions.
- "Analyze Results" mode that feeds actual benchmark data to the model.
- Algorithm recommender form.
- Conversational chat with context from your session.

The AI requests are proxied through the serverless `api/assistant.js` endpoint, keeping the Groq API key server-side.

---

## Algorithms Implemented

### Sorting (8)

| Algorithm | Paradigm | Best | Average | Worst | Space |
|---|---|---|---|---|---|
| Insertion Sort | Decrease & Conquer | O(n) | O(n²) | O(n²) | O(1) |
| Selection Sort | Brute Force | O(n²) | O(n²) | O(n²) | O(1) |
| Bubble Sort | Brute Force | O(n) | O(n²) | O(n²) | O(1) |
| Merge Sort | Divide & Conquer | O(n log n) | O(n log n) | O(n log n) | O(n) |
| Quick Sort | Divide & Conquer | O(n log n) | O(n log n) | O(n²) | O(log n) |
| Heap Sort | Divide & Conquer | O(n log n) | O(n log n) | O(n log n) | O(1) |
| Counting Sort | Non-Comparison | O(n+k) | O(n+k) | O(n+k) | O(k) |
| Radix Sort | Non-Comparison | O(nk) | O(nk) | O(nk) | O(n+k) |

### String Matching (4)

| Algorithm | Paradigm | Best | Average | Worst | Space |
|---|---|---|---|---|---|
| Binary Search | Decrease & Conquer | O(1) | O(log n) | O(log n) | O(1) |
| Brute Force | Brute Force | O(n) | O(n×m) | O(n×m) | O(1) |
| Horspool | Transform & Conquer | O(n/m) | O(n/m) | O(n×m) | O(σ) |
| KMP | Dynamic Programming | O(n) | O(n+m) | O(n+m) | O(m) |

### Graph Algorithms (7)

| Algorithm | Type | Time | Space |
|---|---|---|---|
| DFS | Traversal | O(V+E) | O(V) |
| BFS | Traversal | O(V+E) | O(V) |
| Dijkstra | Shortest Path | O((V+E) log V) | O(V+E) |
| Bellman-Ford | Shortest Path | O(V·E) | O(V) |
| Floyd-Warshall | All-Pairs Shortest Path | O(V³) | O(V²) |
| Prim | Minimum Spanning Tree | O((V+E) log V) | O(V+E) |
| Kruskal | Minimum Spanning Tree | O(E log E) | O(V+E) |

---

## Architecture

Every algorithm is described by a single canonical **descriptor** registered centrally in `src/algorithms/registry.js`:

```js
{
  id: "quick-sort",
  name: "Quick Sort",
  category: "sorting",        // sorting | searching | graphs
  color: "#a78bfa",
  complexity: { best, average, worst, space, paradigm },
  run:   (input) => result,   // benchmark implementation
  steps: (arr) => snapshots,  // visualizer frames (optional)
  debug: (input) => snapshots,// debugger snapshots (optional)
  pseudocode: "...",
  codeLines: [...],           // source lines shown by the debugger
}
```

Adding an algorithm means creating its module + descriptor and registering it — no edits scattered across tabs. The benchmark engine, visualizer, debugger, complexity reference, and pseudocode panel all derive from the same descriptors.

**Event → Projector → Snapshot pattern:** Modern sorts (Heap, Counting, Radix) and graph algorithms produce a deterministic, JSON-serializable event stream via `createEventCollector()`. A projector maps each event to exactly one debugger/visualizer snapshot. This keeps algorithm code UI-free and fully deterministic.

---

## Export Options

Results can be exported from the sidebar:

- **CSV** — raw benchmark data
- **Excel (.xlsx)** — formatted spreadsheet via SheetJS (with automatic CSV fallback)
- **PNG** — all charts exported as images (theme-aware background)

---

## Known Limitations

- **Single-user, in-browser only** — no accounts, sync, or multi-device history. All persistence is `localStorage` (per-browser).
- **Visualizer is sorting-only** — searching and graph domains have no visualizer, only the step debugger.
- **Charts are static SVG** — no zooming, tooltips, or interactive overlays beyond fullscreen.
- **In-browser timing is machine-dependent** — absolute ms values vary by hardware; the app frames results as single-machine observations.
- **Rate limiting without Upstash** — falls back to per-instance in-memory limiting, which doesn't bound abuse across scaled instances.

---

## Known Incomplete Items

- AI Assistant has French/German language strings coded but not exposed in the UI (only Arabic/English are available).
- Merge Sort and Quick Sort don't expose `steps` for the visualizer (only the debugger).
- Graph algorithms don't have `run` implementations for the Benchmark tab (debugger-only).

---

## Built With

- [React 18](https://react.dev/) — UI framework
- [Vite 5](https://vitejs.dev/) — build tool and dev server
- [Vitest](https://vitest.dev/) + [Cypress](https://www.cypress.io/) — testing
- JavaScript (ES6+) — no external algorithm libraries; all implementations are original
- Vanilla SVG — charts are hand-written, no charting library
- [SheetJS](https://docs.sheetjs.com/) — Excel export
- [Groq](https://groq.com/) — AI completions (server-side only)
- [Upstash](https://upstash.com/) — shared rate limiting (optional)

---

## License

Not specified.

---

**Generated with Codebuff 🤖**
