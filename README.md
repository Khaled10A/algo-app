# Algo App

A React web application for **visualizing**, **benchmarking**, and **step-by-step debugging** of classic sorting and string-searching algorithms — built as part of a Design & Analysis of Algorithms course.

🔗 **Live Demo:** [algo-app-lilac.vercel.app](https://algo-app-lilac.vercel.app)

---

## Features

| Tab | Description |
|-----|-------------|
| **Benchmark** | Run algorithms against multiple input sizes and types; compare execution time or comparison counts via line and bar charts |
| **Visualizer** | Watch sorting algorithms execute step by step with animated array bars; control speed and step manually |
| **Debugger** | Step through any algorithm with a live view of variables, memory state, call stack, and per-line highlighting |
| **Complexity** | Time and space complexity reference table with Big-O for best, average, and worst cases |
| **Pseudocode** | Clean pseudocode panel for every supported algorithm |
| **History** | Track and compare up to 20 previous benchmark runs side by side |
| **Report** | Auto-generated summary of results with export options |
| **AI Assistant** | Ask questions about algorithm behaviour and results |

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

### String Searching

| Algorithm | Paradigm | Best | Average | Worst | Space |
|-----------|----------|------|---------|-------|-------|
| Brute Force | Brute Force | O(n) | O(n×m) | O(n×m) | O(1) |
| Horspool | Transform & Conquer | O(n/m) | O(n/m) | O(n×m) | O(σ) |
| KMP | Dynamic Programming | O(n) | O(n+m) | O(n+m) | O(m) |

---

## Project Structure

\`\`\`
src/
|-- algorithms/
|   |-- searching/
|   |   |-- bruteForce.js
|   |   |-- bruteForceDebug.js
|   |   |-- horspool.js
|   |   |-- horspoolDebug.js
|   |   |-- index.js
|   |   |-- kmp.js
|   |   +-- kmpDebug.js
|   +-- sorting/
|       |-- bubbleSort.js
|       |-- index.js
|       |-- insertionSort.js
|       |-- mergeSort.js
|       |-- quickSort.js
|       +-- selectionSort.js
|-- components/
|   |-- charts/
|   |   |-- BarChart.jsx
|   |   +-- LineChart.jsx
|   |-- ui/
|   |   |-- Header.jsx
|   |   |-- SharedComponents.jsx
|   |   +-- Sidebar.jsx
|   +-- visualizer/
|       +-- ArrayVisualizer.jsx
|-- tabs/
|   |-- AIAssistantTab.jsx
|   |-- BenchmarkTab.jsx
|   |-- ComplexityTab.jsx
|   |-- DebuggerTab.jsx
|   |-- HistoryTab.jsx
|   |-- PseudocodeTab.jsx
|   |-- ReportTab.jsx
|   +-- VisualizerTab.jsx
|-- utils/
|   |-- constants.js
|   |-- exportUtils.js
|   +-- generators.js
|-- styles/
|   +-- index.css
|-- App.jsx
+-- main.jsx
\`\`\`

---

## Getting Started

### Prerequisites

- Node.js v14 or higher
- npm (included with Node.js)

### Installation

\`\`\`bash
git clone https://github.com/Khaled10A/algo-app.git
cd algo-app
npm install
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

\`\`\`bash
npm run build
npm run preview
\`\`\`

---

## Export Options

Results can be exported in three formats directly from the sidebar:

- **CSV** — raw benchmark data
- **Excel (.xlsx)** — formatted spreadsheet via SheetJS
- **PNG** — all four charts exported as images

---

## Built With

- [React 18](https://react.dev/) — UI framework
- [Vite 5](https://vitejs.dev/) — build tool
- JavaScript (ES6+) — no external algorithm libraries; all implementations are original
- Vanilla SVG — charts are hand-written SVG, no charting library dependency
