import { useState, useRef, useLayoutEffect } from "react";
import './styles/index.css';

// Context
import { ThemeCtx } from './components/ui/Sidebar';

// UI Components
import { Sec, Chk, SInput, RunBtn, GhostBtn, Empty } from './components/ui/SharedComponents';

// Tabs
import { SortResults, SearchResults } from './tabs/BenchmarkTab';
import { VisualizerTab } from './tabs/VisualizerTab';
import { ComplexityTab } from './tabs/ComplexityTab';
import { PseudocodeTab } from './tabs/PseudocodeTab';
import { HistoryTab } from './tabs/HistoryTab';
import { ReportTab } from './tabs/ReportTab';
import { DebuggerTab } from './tabs/DebuggerTab';
import { AIAssistantTab } from './tabs/AIAssistantTab';

// Utils
import { generateArray } from './utils/generators';
import { exportCSV, exportXLSX, exportAllChartsPNG } from './utils/exportUtils';
import {
  SORT_ALGOS, SORT_STEPS, SEARCH_ALGOS,
  INPUT_TYPES, INPUT_LABELS, TEXT_SCENARIOS, SCENARIO_LABELS,
} from './utils/constants';

// ── Global style reset (inlined for artifact compatibility) ──
function GlobalStyle() {
  useLayoutEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { height: 100%; width: 100%; overflow: hidden; }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
}

export default function App() {
  const [tab, setTab] = useState("sorting");
  const [subTab, setSubTab] = useState("benchmark");

  // SORTING
  const [selSort, setSelSort] = useState(["Insertion Sort", "Merge Sort", "Quick Sort"]);
  const [sortTypes, setSortTypes] = useState(["random", "sorted", "reverse", "nearly"]);
  const [sortSizes, setSortSizes] = useState("50,100,150");
  const [sortMetric, setSortMetric] = useState("time");
  const [sortResults, setSortResults] = useState(null);
  const [sortRunning, setSortRunning] = useState(false);

  // SEARCH
  const [selSearch, setSelSearch] = useState(["Brute Force", "Horspool", "KMP"]);
  const [searchScs, setSearchScs] = useState(["start", "end", "multiple", "nomatch"]);
  const [searchSizes, setSearchSizes] = useState("300,500");
  const [pattern, setPattern] = useState("algo");
  const [searchMetric, setSearchMetric] = useState("time");
  const [searchResults, setSearchResults] = useState(null);
  const [searchRunning, setSearchRunning] = useState(false);

  // VISUALIZER
  const [vizAlgo, setVizAlgo] = useState("Bubble Sort");
  const [vizSize, setVizSize] = useState(16);
  const [vizSteps, setVizSteps] = useState([]);
  const [vizStep, setVizStep] = useState(0);
  const [vizPlaying, setVizPlaying] = useState(false);
  const vizRef = useRef(null);
  const [vizSpeed, setVizSpeed] = useState(80);

  // PSEUDOCODE
  const [pseudoAlgo, setPseudoAlgo] = useState("Insertion Sort");

  // THEME
  const [theme, setTheme] = useState("dark");

  // CUSTOM INPUT
  const [sortInputMode, setSortInputMode] = useState("random");
  const [customArrayStr, setCustomArrayStr] = useState("34,7,23,32,5,62,32,14,7,89,21,45");

  // HISTORY
  const [runHistory, setRunHistory] = useState([]);
  const [historyCompare, setHistoryCompare] = useState([]);

  // Chart refs for bulk export
  const sortLineRef = useRef(); const sortBarRef = useRef();
  const srchLineRef = useRef(); const srchBarRef = useRef();

  const allPseudoAlgos = [...Object.keys(SORT_ALGOS), ...Object.keys(SEARCH_ALGOS)];
  const SUB_TABS = ["benchmark", "visualizer", "complexity", "pseudocode", "history", "report", "debugger", "ai"];

  const isDark = theme === "dark";
  const bg = isDark ? "#020817" : "#f8fafc";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const border = isDark ? "#1e293b" : "#e2e8f0";
  const sidebar = isDark ? "#020817" : "#ffffff";

  function toggle(arr, set, val) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  function runSort() {
    if (!selSort.length || !sortTypes.length) return;
    setSortRunning(true);
    setTimeout(() => {
      const sizes = sortSizes.split(",").map(s => parseInt(s.trim())).filter(n => n > 0);
      const customArr = sortInputMode === "custom"
        ? customArrayStr.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n))
        : null;
      const results = {};
      selSort.forEach(algo => {
        results[algo] = {};
        sortTypes.forEach(type => {
          results[algo][type] = (customArr ? [customArr.length] : sizes).map((n) => {
            const arr = customArr ? [...customArr] : generateArray(n, type);
            const t0 = performance.now();
            const { comparisons } = SORT_ALGOS[algo](arr);
            const t1 = performance.now();
            return { n: arr.length, time: parseFloat((t1 - t0).toFixed(4)), comparisons };
          });
        });
      });
      const newResult = {
        id: Date.now(),
        kind: "sorting",
        label: `Sort Run #${runHistory.filter(h => h.kind === "sorting").length + 1}`,
        ts: new Date().toLocaleTimeString(),
        inputMode: sortInputMode,
        customArr: customArr ? customArrayStr : null,
        metric: sortMetric,
        results,
        sizes: customArr ? [customArr.length] : sizes,
        algos: [...selSort],
        types: [...sortTypes],
      };
      setSortResults(newResult);
      setRunHistory(h => [newResult, ...h].slice(0, 20));
      setSortRunning(false);
    }, 50);
  }

  function runSearch() {
    if (!selSearch.length || !searchScs.length || !pattern) return;
    setSearchRunning(true);
    setTimeout(() => {
      const sizes = searchSizes.split(",").map(s => parseInt(s.trim())).filter(n => n > 0);
      const results = {};
      selSearch.forEach(algo => {
        results[algo] = {};
        searchScs.forEach(sc => {
          results[algo][sc] = sizes.map(n => {
            const pat = sc === "nomatch" ? "ZZZZZ" : pattern;
            const chars = "abcdefghijklmnopqrstuvwxyz ";
            let textStr = Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
            if (sc === "start") textStr = pat + textStr.slice(pat.length);
            else if (sc === "end") textStr = textStr.slice(0, n - pat.length) + pat;
            else if (sc === "multiple") {
              const interval = Math.floor(n / 4);
              let arr2 = textStr.split("");
              for (let k = 0; k < 3; k++) {
                const pos = interval * (k + 1);
                for (let c = 0; c < pat.length && pos + c < n; c++) arr2[pos + c] = pat[c];
              }
              textStr = arr2.join("");
            }
            const t0 = performance.now();
            const { comparisons } = SEARCH_ALGOS[algo](textStr, pat);
            const t1 = performance.now();
            return { n, time: parseFloat((t1 - t0).toFixed(4)), comparisons };
          });
        });
      });
      const newResult = {
        id: Date.now(),
        kind: "search",
        label: `Search Run #${runHistory.filter(h => h.kind === "search").length + 1}`,
        ts: new Date().toLocaleTimeString(),
        metric: searchMetric,
        pattern,
        results,
        sizes,
        algos: [...selSearch],
        scenarios: [...searchScs],
      };
      setSearchResults(newResult);
      setRunHistory(h => [newResult, ...h].slice(0, 20));
      setSearchRunning(false);
    }, 50);
  }

  function startViz() {
    clearInterval(vizRef.current); setVizPlaying(false);
    const fn = SORT_STEPS[vizAlgo]; if (!fn) return;
    const steps = fn(generateArray(vizSize, "random"));
    setVizSteps(steps); setVizStep(0);
  }

  function playViz() {
    if (!vizSteps.length) return; setVizPlaying(true);
    vizRef.current = setInterval(() => {
      setVizStep(s => {
        if (s >= vizSteps.length - 1) { clearInterval(vizRef.current); setVizPlaying(false); return s; }
        return s + 1;
      });
    }, vizSpeed);
  }

  function pauseViz() { clearInterval(vizRef.current); setVizPlaying(false); }

  function exportSortCSV() {
    if (!sortResults) return;
    const { results, sizes, algos, types } = sortResults;
    const mk = sortMetric === "time" ? "time" : "comparisons";
    exportCSV(
      ["Algorithm", "Input Type", ...sizes.map(n => `n=${n}`)],
      algos.flatMap(a => types.map(t => [a, INPUT_LABELS[t], ...results[a][t].map(r => r[mk])])),
      "sorting_results.csv"
    );
  }

  function exportSearchCSV() {
    if (!searchResults) return;
    const { results, sizes, algos, scenarios } = searchResults;
    const mk = searchMetric === "time" ? "time" : "comparisons";
    exportCSV(
      ["Algorithm", "Scenario", ...sizes.map(n => `n=${n}`)],
      algos.flatMap(a => scenarios.map(sc => [a, SCENARIO_LABELS[sc], ...results[a][sc].map(r => r[mk])])),
      "search_results.csv"
    );
  }

  return (
    <ThemeCtx.Provider value={theme}>
      <GlobalStyle />
      <div style={{ height: "100vh", width: "100%", background: bg, color: text, fontFamily: "'Courier New', monospace", overflow: "hidden", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>

        {/* HEADER */}
        <div style={{ borderBottom: `1px solid ${border}`, padding: "12px 32px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: isDark ? "#020817" : "#ffffff", width: "100%" }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#38bdf8,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: 2, color: isDark ? "#f1f5f9" : "#0f172a" }}>ALGO BENCHMARK</div>
            <div style={{ fontSize: 8, color: isDark ? "#475569" : "#94a3b8", letterSpacing: 3 }}>DESIGN & ANALYSIS OF ALGORITHMS</div>
          </div>
          <div style={{ display: "flex", gap: 5, marginLeft: 20 }}>
            {["sorting", "string"].map(t => (
              <button key={t} onClick={() => { setTab(t); setSubTab("benchmark"); }} style={{
                padding: "5px 14px", borderRadius: 5, border: "1px solid",
                borderColor: tab === t ? "#38bdf8" : border,
                background: tab === t ? "rgba(56,189,248,0.1)" : "transparent",
                color: tab === t ? "#38bdf8" : (isDark ? "#475569" : "#94a3b8"),
                fontSize: 10, letterSpacing: 2, cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase",
              }}>{t === "sorting" ? "Sorting" : "String Matching"}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, marginLeft: "auto", alignItems: "center" }}>
            {SUB_TABS.map(st => (
              <button key={st} onClick={() => setSubTab(st)} style={{
                padding: "4px 10px", borderRadius: 4, border: "1px solid",
                borderColor: subTab === st ? "#f472b6" : border,
                background: subTab === st ? "rgba(244,114,182,0.08)" : "transparent",
                color: subTab === st ? "#f472b6" : (isDark ? "#475569" : "#94a3b8"),
                fontSize: 9, letterSpacing: 1, cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase",
              }}>{st}</button>
            ))}
            <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{
              marginLeft: 8, padding: "4px 10px", borderRadius: 4, border: `1px solid ${border}`,
              background: "transparent", color: isDark ? "#fbbf24" : "#475569",
              fontSize: 13, cursor: "pointer", lineHeight: 1,
            }}>{isDark ? "☀️" : "🌙"}</button>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, width: "100%", overflow: "hidden" }}>

          {/* SIDEBAR */}
          <div style={{ width: 280, borderRight: `1px solid ${border}`, padding: "18px 16px", overflowY: "auto", background: sidebar, flexShrink: 0 }}>
            {tab === "sorting" ? (
              <>
                {subTab === "benchmark" && <>
                  <Sec title="ALGORITHMS">
                    {Object.keys(SORT_ALGOS).map(a => <Chk key={a} label={a} checked={selSort.includes(a)} onChange={() => toggle(selSort, setSelSort, a)} />)}
                  </Sec>
                  <Sec title="INPUT MODE">
                    {[["random", "Random / Generated"], ["custom", "Custom Array"]].map(([v, l]) => (
                      <Chk key={v} radio label={l} checked={sortInputMode === v} onChange={() => setSortInputMode(v)} />
                    ))}
                  </Sec>
                  {sortInputMode === "custom" ? (
                    <Sec title="YOUR ARRAY">
                      <textarea value={customArrayStr} onChange={e => setCustomArrayStr(e.target.value)}
                        placeholder="e.g. 34,7,23,32,5,62" rows={3}
                        style={{ width: "100%", background: isDark ? "#0f172a" : "#f1f5f9", border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`, borderRadius: 6, padding: "7px 9px", color: isDark ? "#e2e8f0" : "#1e293b", fontSize: 12, fontFamily: "monospace", boxSizing: "border-box", resize: "vertical" }} />
                      <div style={{ fontSize: 9, color: "#475569", marginTop: 3 }}>
                        {customArrayStr.split(",").filter(s => !isNaN(parseInt(s.trim())) && s.trim() !== "").length} numbers — comma-separated
                      </div>
                    </Sec>
                  ) : (
                    <>
                      <Sec title="INPUT TYPE">
                        {INPUT_TYPES.map(t => <Chk key={t} label={INPUT_LABELS[t]} checked={sortTypes.includes(t)} onChange={() => toggle(sortTypes, setSortTypes, t)} />)}
                      </Sec>
                      <Sec title="INPUT SIZES">
                        <SInput value={sortSizes} onChange={e => setSortSizes(e.target.value)} placeholder="50,100,150" hint="comma-separated" />
                      </Sec>
                    </>
                  )}
                  <Sec title="METRIC">
                    {["time", "comparisons"].map(m => <Chk key={m} radio label={m === "time" ? "Execution Time (ms)" : "Comparisons"} checked={sortMetric === m} onChange={() => setSortMetric(m)} />)}
                  </Sec>
                  <RunBtn onClick={runSort} running={sortRunning} />
                  {sortResults && <GhostBtn onClick={exportSortCSV} label="⬇ Export CSV" />}
                  {sortResults && <GhostBtn color="#38bdf8" onClick={() => exportXLSX([{
                    name: "Sorting Results", title: "Sorting Benchmark Results",
                    headers: ["Algorithm", "Input Type", ...sortResults.sizes.map(n => `n=${n}`)],
                    rows: sortResults.algos.flatMap(a => sortResults.types.map(t => [a, INPUT_LABELS[t], ...sortResults.results[a][t].map(r => sortMetric === "time" ? r.time : r.comparisons)])),
                  }], "sorting_results.xlsx")} label="⬇ Export Excel (.xlsx)" />}
                  {sortResults && <GhostBtn color="#fb923c" onClick={() => exportAllChartsPNG({ sort_line_chart: sortLineRef, sort_bar_chart: sortBarRef, search_line_chart: srchLineRef, search_bar_chart: srchBarRef })} label="⬇ All 4 Charts PNG" />}
                </>}
                {subTab === "visualizer" && <>
                  <Sec title="ALGORITHM">
                    {Object.keys(SORT_STEPS).map(a => <Chk key={a} radio label={a} checked={vizAlgo === a} onChange={() => setVizAlgo(a)} />)}
                  </Sec>
                  <Sec title="ARRAY SIZE">
                    <input type="range" min={6} max={32} value={vizSize} onChange={e => setVizSize(+e.target.value)} style={{ width: "100%", accentColor: "#38bdf8" }} />
                    <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>{vizSize} elements</div>
                  </Sec>
                  <Sec title="ANIMATION SPEED">
                    <input type="range" min={20} max={500} step={10}
                      value={501 - vizSpeed}
                      onChange={e => { const spd = 501 - +e.target.value; setVizSpeed(spd); if (vizPlaying) { pauseViz(); setTimeout(() => playViz(), 0); } }}
                      style={{ width: "100%", accentColor: "#f472b6" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#64748b", marginTop: 2 }}>
                      <span>SLOW</span>
                      <span style={{ color: "#f472b6" }}>{vizSpeed <= 80 ? "FAST" : vizSpeed <= 200 ? "MED" : "SLOW"}</span>
                      <span>FAST</span>
                    </div>
                  </Sec>
                  <RunBtn onClick={startViz} label="GENERATE ARRAY" />
                  {vizSteps.length > 0 && (
                    <button onClick={vizPlaying ? pauseViz : playViz} style={{
                      width: "100%", marginTop: 6, padding: "8px", borderRadius: 6, border: "1px solid #1e293b",
                      background: vizPlaying ? "#7f1d1d22" : "#164e6322", color: vizPlaying ? "#f87171" : "#4ade80",
                      fontSize: 10, cursor: "pointer", fontFamily: "monospace", letterSpacing: 2,
                    }}>{vizPlaying ? "⏸ PAUSE" : "▶ PLAY"}</button>
                  )}
                </>}
                {subTab === "history" && (
                  <Sec title="HISTORY">
                    <div style={{ fontSize: 10, color: "#64748b" }}>{runHistory.length} run{runHistory.length !== 1 ? "s" : ""} stored (max 20)</div>
                    {runHistory.length > 0 && <button onClick={() => { setRunHistory([]); setHistoryCompare([]); }} style={{ marginTop: 6, width: "100%", padding: "6px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 9, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>🗑 CLEAR ALL</button>}
                    {historyCompare.length > 0 && <button onClick={() => setHistoryCompare([])} style={{ marginTop: 5, width: "100%", padding: "6px", borderRadius: 6, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.06)", color: "#a78bfa", fontSize: 9, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>✕ CLEAR SELECTION</button>}
                  </Sec>
                )}
                {subTab === "pseudocode" && (
                  <Sec title="SELECT ALGORITHM">
                    {allPseudoAlgos.map(a => <Chk key={a} radio label={a} checked={pseudoAlgo === a} onChange={() => setPseudoAlgo(a)} />)}
                  </Sec>
                )}
              </>
            ) : (
              <>
                <Sec title="ALGORITHMS">
                  {Object.keys(SEARCH_ALGOS).map(a => <Chk key={a} label={a} checked={selSearch.includes(a)} onChange={() => toggle(selSearch, setSelSearch, a)} />)}
                </Sec>
                {subTab === "benchmark" && <>
                  <Sec title="SCENARIO">
                    {TEXT_SCENARIOS.map(sc => <Chk key={sc} label={SCENARIO_LABELS[sc]} checked={searchScs.includes(sc)} onChange={() => toggle(searchScs, setSearchScs, sc)} />)}
                  </Sec>
                  <Sec title="TEXT SIZES">
                    <SInput value={searchSizes} onChange={e => setSearchSizes(e.target.value)} placeholder="300,500" hint="comma-separated" />
                  </Sec>
                  <Sec title="PATTERN">
                    <SInput value={pattern} onChange={e => setPattern(e.target.value)} placeholder="search pattern..." />
                  </Sec>
                  <Sec title="METRIC">
                    {["time", "comparisons"].map(m => <Chk key={m} radio label={m === "time" ? "Execution Time (ms)" : "Comparisons"} checked={searchMetric === m} onChange={() => setSearchMetric(m)} />)}
                  </Sec>
                  <RunBtn onClick={runSearch} running={searchRunning} />
                  {searchResults && <GhostBtn onClick={exportSearchCSV} label="⬇ Export CSV" />}
                  {searchResults && <GhostBtn color="#38bdf8" onClick={() => exportXLSX([{
                    name: "String Matching", title: "String Matching Benchmark Results",
                    headers: ["Algorithm", "Scenario", ...searchResults.sizes.map(n => `n=${n}`)],
                    rows: searchResults.algos.flatMap(a => searchResults.scenarios.map(sc => [a, SCENARIO_LABELS[sc], ...searchResults.results[a][sc].map(r => searchMetric === "time" ? r.time : r.comparisons)])),
                  }], "search_results.xlsx")} label="⬇ Export Excel (.xlsx)" />}
                  {searchResults && <GhostBtn color="#fb923c" onClick={() => exportAllChartsPNG({ sort_line_chart: sortLineRef, sort_bar_chart: sortBarRef, search_line_chart: srchLineRef, search_bar_chart: srchBarRef })} label="⬇ All 4 Charts PNG" />}
                </>}
                {subTab === "history" && (
                  <Sec title="HISTORY">
                    <div style={{ fontSize: 10, color: "#64748b" }}>{runHistory.length} run{runHistory.length !== 1 ? "s" : ""} stored (max 20)</div>
                    {runHistory.length > 0 && <button onClick={() => { setRunHistory([]); setHistoryCompare([]); }} style={{ marginTop: 6, width: "100%", padding: "6px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 9, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>🗑 CLEAR ALL</button>}
                    {historyCompare.length > 0 && <button onClick={() => setHistoryCompare([])} style={{ marginTop: 5, width: "100%", padding: "6px", borderRadius: 6, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.06)", color: "#a78bfa", fontSize: 9, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>✕ CLEAR SELECTION</button>}
                  </Sec>
                )}
                {subTab === "pseudocode" && (
                  <Sec title="SELECT ALGORITHM">
                    {allPseudoAlgos.map(a => <Chk key={a} radio label={a} checked={pseudoAlgo === a} onChange={() => setPseudoAlgo(a)} />)}
                  </Sec>
                )}
              </>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", minWidth: 0, height: "100%" }}>
            {subTab === "benchmark" && tab === "sorting" && (
              sortResults
                ? <SortResults results={sortResults} metric={sortMetric} lineRef={sortLineRef} barRef={sortBarRef} />
                : <Empty icon="📊" text="Configure & Run Sorting Benchmark" />
            )}
            {subTab === "benchmark" && tab === "string" && (
              searchResults
                ? <SearchResults results={searchResults} metric={searchMetric} lineRef={srchLineRef} barRef={srchBarRef} />
                : <Empty icon="🔍" text="Configure & Run String Matching Benchmark" />
            )}
            {subTab === "visualizer" && (
              <VisualizerTab
                vizAlgo={vizAlgo}
                vizSteps={vizSteps}
                vizStep={vizStep}
                setVizStep={setVizStep}
                pauseViz={pauseViz}
                isDark={isDark}
              />
            )}
            {subTab === "complexity" && (
              <ComplexityTab tab={tab} metric={sortMetric} isDark={isDark} />
            )}
            {subTab === "pseudocode" && (
              <PseudocodeTab pseudoAlgo={pseudoAlgo} isDark={isDark} />
            )}
            {subTab === "history" && (
              <HistoryTab
                history={runHistory}
                compare={historyCompare}
                setCompare={setHistoryCompare}
                isDark={isDark}
              />
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
            {subTab === "debugger" && (
              <DebuggerTab isDark={isDark} />
            )}
            {subTab === "ai" && (
              <AIAssistantTab
                isDark={isDark}
                sortResults={sortResults}
                searchResults={searchResults}
              />
            )}
          <a href="https://www.instagram.com/_10qrv?igsh=dmUzbnFtd3AydWVk"
            target="_blank" rel="noopener noreferrer"
            style={{ marginTop: "auto", paddingTop: 16, fontSize: 11,
              color: "#475569", textDecoration: "none", fontFamily: "monospace",
              letterSpacing: 1, textAlign: "center", display: "block",
              transition: "color 0.2s", borderTop: "1px solid #1e293b", paddingTop: 12 }}
            onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
            onMouseLeave={e => e.currentTarget.style.color = "#475569"}
          >© Khaled Alnajjar</a>
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>

  );
}
