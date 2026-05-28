\# Algo App

A React web application for visualizing and benchmarking sorting and string-searching algorithms interactively.

## Features

- Visualizer: Watch algorithms sort step by step
- Benchmark: Compare algorithm speeds with charts
- Complexity: Time and space complexity analysis
- Pseudocode: View pseudocode for each algorithm
- History: Track previous runs
- Report: Export results

## Algorithms Included

Sorting: Bubble, Selection, Insertion, Merge, Quick

String Searching: Brute Force, Horspool, KMP

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

Clone the repo:
    git clone https://github.com/Khaled10A/algo-app.git
    cd algo-app

Install dependencies:
    npm install

Start the app:
    npm start

Open http://localhost:3000 in your browser.

## Project Structure

```
src/
├── algorithms/
│   ├── sorting/        # Sorting algorithms
│   └── searching/      # String searching algorithms
├── components/
│   ├── ui/             # Sidebar, Header, shared components
│   ├── charts/         # Line and Bar charts
│   └── visualizer/     # Array visualizer
├── tabs/               # App tabs (Benchmark, Visualizer...)
└── utils/              # Constants, generators, export tools
```
## Built With
- React
- JavaScript (ES6+)
