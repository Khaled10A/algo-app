import { useEffect, useRef, useState } from "react";
import "./styles/index.css";

import { ThemeCtx } from './theme/ThemeContext';
import { Header } from './components/ui/Header';
import { Empty } from './components/ui/SharedComponents';
import { ConfigSidebar } from './components/sidebar/ConfigSidebar';
import { GraphDebugger } from './components/visualizer/GraphDebugger';

import { SortResults, SearchResults } from './tabs/BenchmarkTab';
import { VisualizerTab } from './tabs/VisualizerTab';
import { ComplexityTab } from './tabs/ComplexityTab';
import { PseudocodeTab } from './tabs/PseudocodeTab';
import { HistoryTab } from './tabs/HistoryTab';
import { ReportTab } from './tabs/ReportTab';
import { DebuggerTab } from './tabs/DebuggerTab';
import { AIAssistantTab } from './tabs/AIAssistantTab';

import { generateArray } from './utils/generators';
import { exportCSV, exportXLSX, exportAllChartsPNG } from './utils/exportUtils';
import { getDomain, getAlgorithmForDisplay } from './algorithms/registry';
import { INPUT_LABELS, SCENARIO_LABELS } from './utils/constants';
import { getPalette, FONT_SANS } from './theme/tokens';

import { usePersistentState } from './hooks/usePersistentState';
import { usePlayback } from './hooks/usePlayback';
import { useBenchmarks } from './hooks/useBenchmarks';
import { useRunHistory } from './hooks/useRunHistory';

function toggleIn(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export default function App() {
  // THEME + NAVIGATION
  const [theme, setTheme] = usePersistentState("theme", "dark");
  const isDark = theme !== "light";
  const p = getPalette(isDark ? "dark" : "light");

  useEffect(() => {
    document.body.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  const [tab, setTabRaw] = usePersistentState("domain", "sorting");
  const [subTabRaw, setSubTabRaw] = usePersistentState("subTab", "benchmark");
  const domain = getDomain(tab) || getDomain("sorting");
  const subTab = domain.subTabs.includes(subTabRaw) ? subTabRaw : domain.subTabs[0];
  const showInspector =
    (domain.id === "sorting" || domain.id === "searching") &&
    ["benchmark", "visualizer", "history", "pseudocode"].includes(subTab);

  function switchTab(id) {
    setTabRaw(id);
    const d = getDomain(id);
    if (d) setSubTabRaw(d.subTabs[0]);
  }

  // SORTING BENCHMARK SETTINGS
  const [selSort, setSelSort] = usePersistentState("sort:algos", ["insertion-sort", "merge-sort", "quick-sort"]);
  const [sortTypes, setSortTypes] = usePersistentState("sort:types", ["random", "sorted", "reverse", "nearly"]);
  const [sortSizes, setSortSizes] = usePersistentState("sort:sizes", "50,100,150");
  const [sortMetric, setSortMetric] = usePersistentState("sort:metric", "time");
  const [sortInputMode, setSortInputMode] = usePersistentState("sort:input-mode", "random");
  const [customArrayStr, setCustomArrayStr] = usePersistentState("sort:custom-array", "34,7,23,32,5,62,32,14,7,89,21,45");

  // STRING MATCHING BENCHMARK SETTINGS
  const [selSearch, setSelSearch] = usePersistentState("search:algos", ["brute-force", "horspool", "kmp"]);
  const [searchScs, setSearchScs] = usePersistentState("search:scenarios", ["start", "end", "multiple", "nomatch"]);
  const [searchSizes, setSearchSizes] = usePersistentState("search:sizes", "300,500");
  const [pattern, setPattern] = usePersistentState("search:pattern", "algo");
  const [searchInputMode, setSearchInputMode] = usePersistentState("search:input-mode", "generate");
  const [searchMetric, setSearchMetric] = usePersistentState("search:metric", "time");
  const [uploadedText, setUploadedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  // VISUALIZER
  const [vizAlgo, setVizAlgo] = usePersistentState("viz:algo", "bubble-sort");
  const [vizSize, setVizSize] = usePersistentState("viz:size", 16);
  const [storedVizSpeed, setStoredVizSpeed] = usePersistentState("viz:speed", 80);
  const [vizSteps, setVizSteps] = useState([]);
  const vizPlayback = usePlayback({ length: vizSteps.length, initialSpeed: storedVizSpeed });
  function setVizSpeed(ms) {
    vizPlayback.setSpeed(ms);
    setStoredVizSpeed(ms);
  }

  // PSEUDOCODE
  const [pseudoAlgo, setPseudoAlgo] = usePersistentState("pseudo:algo", "insertion-sort");

  // BENCHMARKS + HISTORY
  const {
    sortResults,
    searchResults,
    sortRunning,
    searchRunning,
    sortError,
    searchError,
    cancelSort,
    cancelSearch,
    runSort,
    runSearch,
  } = useBenchmarks();
  const { history, compare, addRun, clearAll: clearHistory, clearSelection, updateCompare } = useRunHistory();

  // CHART REFS FOR BULK EXPORT
  const sortLineRef = useRef(); const sortBarRef = useRef();
  const srchLineRef = useRef(); const srchBarRef = useRef();

  async function handleRunSort() {
    const count = history.filter((h) => h.kind === "sorting").length + 1;
    const envelope = await runSort({
      algoIds: selSort,
      types: sortTypes,
      sizesStr: sortSizes,
      metric: sortMetric,
      inputMode: sortInputMode,
      customArrayStr,
      label: `Sort Run #${count}`,
    });
    if (envelope) addRun(envelope);
  }

  async function handleRunSearch() {
    const count = history.filter((h) => h.kind === "search").length + 1;
    const envelope = await runSearch({
      algoIds: selSearch,
      scenarios: searchScs,
      sizesStr: searchSizes,
      metric: searchMetric,
      inputMode: searchInputMode,
      pattern,
      text: uploadedText,
      fileName: uploadedFileName,
      label: searchInputMode === "file" ? undefined : `Search Run #${count}`,
    });
    if (envelope) addRun(envelope);
  }

  function startViz() {
    vizPlayback.pause();
    const d = getAlgorithmForDisplay(vizAlgo);
    if (!d || typeof d.steps !== "function") return;
    setVizSteps(d.steps(generateArray(vizSize, "random")));
    vizPlayback.reset();
  }

  function onUploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadedText(ev.target.result); setUploadedFileName(file.name); };
    reader.readAsText(file);
  }

  function removeUploadedFile() {
    setUploadedText("");
    setUploadedFileName("");
  }

  // EXPORT HANDLERS
  function exportSortCSV() {
    if (!sortResults) return;
    const mk = sortMetric === "time" ? "time" : "comparisons";
    exportCSV(
      ["Algorithm", "Input Type", ...sortResults.sizes.map((n) => `n=${n}`)],
      sortResults.algos.flatMap((a) =>
        sortResults.types.map((t) => [
          getAlgorithmForDisplay(a).name,
          INPUT_LABELS[t],
          ...sortResults.results[a][t].map((r) => r[mk]),
        ])
      ),
      "sorting_results.csv"
    );
  }

  function exportSearchCSV() {
    if (!searchResults) return;
    const mk = searchMetric === "time" ? "time" : "comparisons";
    exportCSV(
      ["Algorithm", "Scenario", ...searchResults.sizes.map((n) => `n=${n}`)],
      searchResults.algos.flatMap((a) =>
        searchResults.scenarios.map((sc) => [
          getAlgorithmForDisplay(a).name,
          SCENARIO_LABELS[sc],
          ...searchResults.results[a][sc].map((r) => r[mk]),
        ])
      ),
      "search_results.csv"
    );
  }

  function exportSortXLSX() {
    if (!sortResults) return;
    const mk = sortMetric === "time" ? "time" : "comparisons";
    exportXLSX([{
      name: "Sorting Results",
      title: "Sorting Benchmark Results",
      headers: ["Algorithm", "Input Type", ...sortResults.sizes.map((n) => `n=${n}`)],
      rows: sortResults.algos.flatMap((a) =>
        sortResults.types.map((t) => [
          getAlgorithmForDisplay(a).name,
          INPUT_LABELS[t],
          ...sortResults.results[a][t].map((r) => r[mk]),
        ])
      ),
    }], "sorting_results.xlsx");
  }

  function exportSearchXLSX() {
    if (!searchResults) return;
    const mk = searchMetric === "time" ? "time" : "comparisons";
    exportXLSX([{
      name: "String Matching",
      title: "String Matching Benchmark Results",
      headers: ["Algorithm", "Scenario", ...searchResults.sizes.map((n) => `n=${n}`)],
      rows: searchResults.algos.flatMap((a) =>
        searchResults.scenarios.map((sc) => [
          getAlgorithmForDisplay(a).name,
          SCENARIO_LABELS[sc],
          ...searchResults.results[a][sc].map((r) => r[mk]),
        ])
      ),
    }], "search_results.xlsx");
  }

  const chartBg = p.chartBg;

  function exportAllPNG() {
    exportAllChartsPNG({
      sort_line_chart: sortLineRef,
      sort_bar_chart: sortBarRef,
      search_line_chart: srchLineRef,
      search_bar_chart: srchBarRef,
    }, chartBg);
  }

  const sortControls = {
    algos: selSort,
    hasResults: !!sortResults,
    running: sortRunning,
    error: sortError,
    cancel: cancelSort,
    metric: sortMetric,
    sizesStr: sortSizes,
    types: sortTypes,
    inputMode: sortInputMode,
    customArrayStr,
    border: p.border,
  };

  const vizControls = {
    algo: vizAlgo,
    size: vizSize,
    speed: vizPlayback.speed,
    playing: vizPlayback.playing,
    hasSteps: vizSteps.length > 0,
    generate: startViz,
    togglePlay: vizPlayback.toggle,
    setSize: setVizSize,
    setSpeed: setVizSpeed,
  };

  const historyControls = {
    count: history.length,
    selected: compare.length,
    clearAll: clearHistory,
    clearSelection,
  };

  const pseudoControls = { algo: pseudoAlgo, setAlgo: setPseudoAlgo };

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ height: "100vh", width: "100%", color: p.textPrimary, fontFamily: FONT_SANS, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", boxSizing: "border-box" }}>
        <Header
          tab={domain.id}
          setTab={switchTab}
          subTab={subTab}
          setSubTab={setSubTabRaw}
          isDark={isDark}
          border={p.border}
          palette={p}
          onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
        />

        <div style={{ flex: 1, width: "100%", overflow: "hidden", paddingTop: 76, position: "relative" }}>
          {showInspector && <ConfigSidebar
            domain={domain.id}
            subTab={subTab}
            isDark={isDark}
            border={p.border}
            palette={p}
            sort={{
              ...sortControls,
              toggleAlgo: (id) => setSelSort((a) => toggleIn(a, id)),
              toggleType: (t) => setSortTypes((a) => toggleIn(a, t)),
              setInputMode: setSortInputMode,
              setCustomArrayStr,
              setSizesStr: setSortSizes,
              setMetric: setSortMetric,
              run: handleRunSort,
              exportCSV: exportSortCSV,
              exportXLSX: exportSortXLSX,
              exportPNG: exportAllPNG,
            }}
            viz={vizControls}
            search={{
              algos: selSearch,
              toggleAlgo: (id) => setSelSearch((a) => toggleIn(a, id)),
              inputMode: searchInputMode,
              setInputMode: (v) => { setSearchInputMode(v); setUploadedText(""); setUploadedFileName(""); },
              scenarios: searchScs,
              toggleScenario: (sc) => setSearchScs((a) => toggleIn(a, sc)),
              sizesStr: searchSizes,
              setSizesStr: setSearchSizes,
              pattern,
              setPattern,
              metric: searchMetric,
              setMetric: setSearchMetric,
              uploadedText,
              fileName: uploadedFileName,
              onFile: onUploadFile,
              removeFile: removeUploadedFile,
              run: handleRunSearch,
              running: searchRunning,
              error: searchError,
              cancel: cancelSearch,
              hasResults: !!searchResults,
              exportCSV: exportSearchCSV,
              exportXLSX: exportSearchXLSX,
              exportPNG: exportAllPNG,
            }}
            history={historyControls}
            pseudo={pseudoControls}
          />}


          {/* MAIN CONTENT */}
          <main style={{ flex: 1, overflowY: "auto", padding: showInspector ? "10px 34px 44px 328px" : "14px 40px 44px", minWidth: 0, height: "100%" }}>
            <div key={domain.id + ":" + subTab} className="panel-in">
            {subTab === "benchmark" && domain.id === "sorting" && (
              sortResults
                ? <SortResults results={sortResults} metric={sortMetric} lineRef={sortLineRef} barRef={sortBarRef} />
                : <Empty icon="📊" text="Configure & Run Sorting Benchmark" />
            )}
            {subTab === "benchmark" && domain.id === "searching" && (
              searchResults
                ? <SearchResults results={searchResults} metric={searchMetric} lineRef={srchLineRef} barRef={srchBarRef} />
                : <Empty icon="🔍" text="Configure & Run String Matching Benchmark" />
            )}
            {subTab === "visualizer" && (
              <VisualizerTab
                vizAlgo={vizAlgo}
                vizSteps={vizSteps}
                playback={vizPlayback}
                isDark={isDark}
              />
            )}
            {subTab === "complexity" && (
              <ComplexityTab tab={domain.id} metric={sortMetric} isDark={isDark} />
            )}
            {subTab === "pseudocode" && (
              <PseudocodeTab pseudoAlgo={pseudoAlgo} isDark={isDark} />
            )}
            {subTab === "history" && (
              <HistoryTab history={history} compare={compare} setCompare={updateCompare} isDark={isDark} />
            )}
            {subTab === "report" && (
              <ReportTab
                sortResults={sortResults}
                searchResults={searchResults}
                sortMetric={sortMetric}
                searchMetric={searchMetric}
                pattern={pattern}
              />
            )}
            {subTab === "debugger" && domain.id === "graphs" && (
              <GraphDebugger isDark={isDark} />
            )}
            {subTab === "debugger" && domain.id !== "graphs" && (
              <DebuggerTab isDark={isDark} />
            )}
            {subTab === "ai" && (
              <AIAssistantTab isDark={isDark} sortResults={sortResults} searchResults={searchResults} />
            )}
            </div>

            <div style={{ marginTop: "auto", textAlign: "center", position: "fixed", bottom: 10, right: 18, pointerEvents: "none", zIndex: 5 }}>
              <div style={{ borderTop: `1px solid ${p.border}`, paddingTop: 10, marginTop: 16 }}>
                <a href="https://www.instagram.com/_10qrv?igsh=dmUzbnFtd3AydWVk"
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: p.textFaint, textDecoration: "none",
                    display: "block", transition: "color 0.2s", pointerEvents: "auto" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = p.accent}
                  onMouseLeave={(e) => e.currentTarget.style.color = p.textFaint}
                  >© Khaled Alnajjar</a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
