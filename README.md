# Algo App

A React web application for **visualizing**, **benchmarking**, and **step-by-step debugging** of classic algorithms — built as part of a Design & Analysis of Algorithms course.

🔗 **Live Demo:** [algo-app-lilac.vercel.app](https://algo-app-lilac.vercel.app)

---

## Features

| Section | Description |
|-----|-------------|
| **Benchmark** | Run algorithms against multiple input sizes and types; compare execution time or comparison counts via line and bar charts. Measurements use warmup iterations and median aggregation, run in a Web Worker, and share identical inputs across algorithms for fair comparison. |
| **Visualizer** | Watch sorting algorithms execute step by step with animated array bars; requestAnimationFrame-based playback with speed presets. |
| **Debugger** | Step through any algorithm with a live view of variables, memory state, call stack, and per-line highlighting. Covers all five sorting algorithms, Binary Search (with found/not-found targets), and Brute Force / Horspool / KMP string matching. |
| **Graphs** | First-class graph traversal domain: DFS & BFS debugging over an interactive SVG graph. |
| **Complexity** | Time and space complexity reference table with Big-O for best, average, and worst cases, plus side-by-side comparison runs. |
| **Pseudocode** | Clean pseudocode panel for every supported algorithm. |
| **History** | Track and compare up to 20 previous benchmark runs side by side. Persisted across sessions. |
| **Report** | Auto-generated summary of results with export options. |
| **AI Assistant** | Ask questions about algorithm behaviour and results (Arabic/English). Requests are proxied through a serverless function — no API key ships to the browser. |

---

## Algorithms

### Sorting

| Algorithm | Paradigm | Best | Average | Worst | Space |
|-----------|----------|------|---------|-------|-------|
| Insertion Sort | Decrease & Conquer | O(n) | O(n²) | O(n²) | O(1) |
| Selection Sort | Brute Force | O(n²) | O(n²) | O(n²) | O(1) |
| Bubble Sort | Brute Force | O(n) | O(n²) | O(n²) | O(1) |
| Merge Sort | Divide & Conquer | O(n log n) | O(n log n) | O(n log n) | O(n) |
| Quick Sort | Divide & Conquer | O(n log n) | O(n log n) | O(n²) | O(log n) |

### Searching

| Algorithm | Paradigm | Best | Average | Worst | Space |
|-----------|----------|------|---------|-------|-------|
| Binary Search | Decrease & Conquer | O(1) | O(log n) | O(log n) | O(1) |
| Brute Force | Brute Force | O(n) | O(n×m) | O(n×m) | O(1) |
| Horspool | Transform & Conquer | O(n/m) | O(n/m) | O(n×m) | O(σ) |
| KMP | Dynamic Programming | O(n) | O(n+m) | O(n+m) | O(m) |

### Graph Traversal

| Algorithm | Paradigm | Best | Average | Worst | Space |
|-----------|----------|------|---------|-------|-------|
| BFS | Graph Traversal | O(V+E) | O(V+E) | O(V+E) | O(V) |
| DFS | Graph Traversal | O(V+E) | O(V+E) | O(V+E) | O(V) |

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

Adding an algorithm means creating its module + descriptor and registering it — no edits scattered across tabs.

```
src/
|-- algorithms/
|   |-- registry.js            central descriptor registry
|   |-- graphs/                bfs/dfs implementations + descriptors
|   |-- searching/             brute force, horspool, kmp, binary search + descriptors
|   +-- sorting/               five sorts + descriptors
|-- core/
|   +-- benchmark/
|       |-- engine.js          framework-agnostic measurement core
|       |-- jobs.js            serializable benchmark specs -> executable jobs
|       |-- runner.js          Web Worker wrapper with sync fallback
|       +-- worker.js          worker entry point
|-- hooks/                     useBenchmarks, usePlayback, usePersistentState, useRunHistory
|-- components/
|   |-- charts/                hand-written SVG line/bar charts
|   |-- sidebar/               configuration panels per domain
|   |-- ui/                    header, shared primitives
|   +-- visualizer/            array bars, graph debugger
|-- tabs/                      benchmark, visualizer, complexity, pseudocode,
|                              history, report, debugger, AI assistant
|-- theme/tokens.js            centralized dark/light design tokens
+-- utils/                     constants, generators, export utils, audio
api/assistant.js               serverless AI proxy (holds GROQ_API_KEY server-side)
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
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

### AI Assistant setup

The assistant calls `/api/assistant`, a serverless function that keeps the model provider key on the server.

- **Local development:** run `vercel dev` (which executes `api/` functions locally), or deploy first.
- **Deployment (Vercel):** set `GROQ_API_KEY` as an encrypted environment variable in your project settings. Never prefix it with `VITE_` — anything prefixed that way is embedded into the client bundle and publicly readable.
- Optionally set `VITE_AI_ENDPOINT` in the client env to point the UI at a deployed proxy while developing locally without one.

Without a configured key the app works fully; the AI tab simply reports that it is not configured on the deployment.

### Build for production

```bash
npm run build
npm run preview
```

### Tests

```bash
npm run test:unit       # Vitest unit + component tests
npm run test:e2e        # Cypress (start `npm run dev` in another terminal first)
npm run test:e2e:open   # interactive Cypress runner
```

---

## Export Options

Results can be exported directly from the sidebar:

- **CSV** — raw benchmark data
- **Excel (.xlsx)** — formatted spreadsheet via SheetJS
- **PNG** — all charts exported as images (theme-aware background)

---

## Built With

- [React 18](https://react.dev/) — UI framework
- [Vite 5](https://vitejs.dev/) — build tool
- JavaScript (ES6+) — no external algorithm libraries; all implementations are original
- Vanilla SVG — charts are hand-written SVG, no charting library dependency
