import { useState, useRef } from "react";
import { LineChart, BarChart } from '../components/charts/LineChart';
import { Label, Empty, ChartBox, FullscreenChart } from '../components/ui/SharedComponents';
import { useTheme } from '../components/ui/Sidebar';
import { exportSVGasPNG } from '../utils/exportUtils';
import { COLORS, COMPLEXITY, INPUT_LABELS, SCENARIO_LABELS, TH, TD } from '../utils/constants';

export function SortResults({ results, metric, lineRef: externalLineRef, barRef: externalBarRef }) {
  const { results: data, sizes, algos, types } = results;
  const mk = metric === "time" ? "time" : "comparisons";
  const ml = metric === "time" ? "Time (ms)" : "Comparisons";
  const internalLineRef = useRef(); const internalBarRef = useRef();
  const lineRef = externalLineRef || internalLineRef;
  const barRef = externalBarRef || internalBarRef;
  const [fsChart, setFsChart] = useState(null);
  const th = useTheme();

  const algoTotals = algos.map(algo => ({
    algo,
    total: types.reduce((sum, t) => sum + sizes.reduce((s2, _, si) => s2 + (data[algo][t][si][mk] || 0), 0), 0),
  }));
  const worstAlgo = algoTotals.reduce((a, b) => b.total > a.total ? b : a, algoTotals[0])?.algo;
  const bestAlgo = algoTotals.reduce((a, b) => b.total < a.total ? b : a, algoTotals[0])?.algo;

  const lineData = algos.map(algo => ({
    xLabels: sizes.map(String),
    values: sizes.map((_, si) => {
      const vals = types.map(t => data[algo][t][si][mk]);
      return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4));
    }),
  }));
  const barData = algos.map(algo => ({
    xLabels: sizes.map(String),
    values: sizes.map((_, si) => data[algo][types[0]][si][mk]),
  }));

  const rowEven = th === "light" ? "#f1f5f9" : "#0a0f1e";
  const rowOdd = th === "light" ? "#f8fafc" : "#0f172a";

  return (
    <div>
      <FullscreenChart chart={fsChart} onClose={() => setFsChart(null)} />
      <Label color="#38bdf8">SORTING RESULTS</Label>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔴</span>
          <div>
            <div style={{ fontSize: 8, color: "#f87171", letterSpacing: 2, marginBottom: 2 }}>WORST PERFORMER</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#fca5a5" }}>{worstAlgo}</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🟢</span>
          <div>
            <div style={{ fontSize: 8, color: "#4ade80", letterSpacing: 2, marginBottom: 2 }}>BEST PERFORMER</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#86efac" }}>{bestAlgo}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <ChartBox ref={lineRef} title="Line Chart — Avg vs Size"
          onExport={() => exportSVGasPNG(lineRef.current, "sort_line_chart.png")}
          onFullscreen={() => setFsChart({ title: "Line Chart — Avg vs Size", node: <LineChart data={lineData} colors={COLORS} labels={algos} title={`Avg ${ml} vs n`} xTitle="Input Size (n)" yTitle={ml} fullscreen /> })}>
          <LineChart data={lineData} colors={COLORS} labels={algos} title={`Avg ${ml} vs n`} xTitle="Input Size (n)" yTitle={ml} />
        </ChartBox>
        <ChartBox ref={barRef} title={`Bar Chart — ${INPUT_LABELS[types[0]]}`}
          onExport={() => exportSVGasPNG(barRef.current, "sort_bar_chart.png")}
          onFullscreen={() => setFsChart({ title: `Bar Chart — ${INPUT_LABELS[types[0]]}`, node: <BarChart data={barData} colors={COLORS} labels={algos} title={`${ml} — ${INPUT_LABELS[types[0]]}`} xTitle="Input Size (n)" yTitle={ml} fullscreen /> })}>
          <BarChart data={barData} colors={COLORS} labels={algos} title={`${ml} — ${INPUT_LABELS[types[0]]}`} xTitle="Input Size (n)" yTitle={ml} />
        </ChartBox>
      </div>

      {types.map(type => (
        <div key={type} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", marginBottom: 6 }}>📋 {INPUT_LABELS[type].toUpperCase()}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ background: rowOdd }}>
              <th style={TH}>Algorithm</th>
              {sizes.map(n => <th key={n} style={TH}>n = {n}</th>)}
              <th style={{ ...TH, color: "#a78bfa" }}>Basic Ops (n={sizes[sizes.length-1]})</th>
              <th style={{ ...TH, color: "#fb923c" }}>Theoretical Formula</th>
            </tr></thead>
            <tbody>{algos.map((algo, ai) => {
              const isWorst = algo === worstAlgo;
              const isBest = algo === bestAlgo;
              const rowBg = isWorst ? "rgba(239,68,68,0.06)" : isBest ? "rgba(74,222,128,0.06)" : (ai % 2 === 0 ? rowEven : rowOdd);
              const nameColor = isWorst ? "#f87171" : isBest ? "#4ade80" : COLORS[ai % COLORS.length];
              return (
                <tr key={algo} style={{ background: rowBg }}>
                  <td style={{ ...TD, fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: nameColor }}>{algo}</span>
                    {isWorst && <span style={{ fontSize: 9, background: "rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 4, padding: "1px 5px", letterSpacing: 1 }}>WORST</span>}
                    {isBest && <span style={{ fontSize: 9, background: "rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 4, padding: "1px 5px", letterSpacing: 1 }}>BEST</span>}
                  </td>
                  {data[algo][type].map((row, si) => (
                    <td key={si} style={{ ...TD, color: isWorst ? "#fca5a5" : "#94a3b8" }}>
                      {mk === "time" ? row.time.toFixed(4) + " ms" : row.comparisons.toLocaleString()}
                    </td>
                  ))}
                  <td style={{ ...TD, color: "#a78bfa", fontFamily: "monospace", fontSize: 10 }}>
                    {data[algo][type][data[algo][type].length - 1].comparisons.toLocaleString()}
                  </td>
                  <td style={{ ...TD, fontSize: 10 }}>
                    {(() => {
                      const n = sizes[sizes.length - 1];
                      const c = COMPLEXITY[algo];
                      if (!c) return "-";
                      const theoretical = c.worst.includes("n²") ? Math.round(n*n)
                        : c.worst.includes("n log n") ? Math.round(n * Math.log2(n))
                        : c.worst.includes("n×m") ? "-"
                        : c.worst.includes("n+m") ? "-"
                        : n;
                      return (
                        <span>
                          <span style={{ color: "#fb923c" }}>{c.worst}</span>
                          {theoretical !== "-" && (
                            <span style={{ color: "#475569", fontSize: 9 }}> ≈ {theoretical.toLocaleString()}</span>
                          )}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export function SearchResults({ results, metric, lineRef: externalLineRef, barRef: externalBarRef }) {
  const internalLineRef = useRef();
  const internalBarRef = useRef();
  const [fsChart, setFsChart] = useState(null);
  const th = useTheme();
  const searchColors = ["#f472b6", "#4ade80", "#fb923c"];
  const lineRef = externalLineRef || internalLineRef;
  const barRef = externalBarRef || internalBarRef;

  // ── FILE MODE ──────────────────────────────────────────
  if (results.mode === "file") {
    const { results: data, algos, pattern, fileName, fileLength } = results;
    const mk = metric === "time" ? "time" : "comparisons";
    const isDark = th !== "light";
    const border = isDark ? "#1e293b" : "#e2e8f0";
    const cardBg = isDark ? "#0f172a" : "#ffffff";
    const textMute = isDark ? "#64748b" : "#94a3b8";

    const rows = algos.map((algo, i) => {
      const r = data[algo]["file"][0];
      return { algo, time: r.time, comparisons: r.comparisons, matches: r.matches?.length || 0, color: searchColors[i % 3] };
    }).sort((a, b) => a[mk] - b[mk]);

    return (
      <div>
        <Label color="#f472b6">STRING MATCHING — FILE RESULTS</Label>

        {/* File info card */}
        <div style={{ background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 8, color: "#f472b6", letterSpacing: 2, marginBottom: 3 }}>FILE</div><div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "monospace" }}>📄 {fileName}</div></div>
          <div><div style={{ fontSize: 8, color: "#f472b6", letterSpacing: 2, marginBottom: 3 }}>TEXT LENGTH</div><div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "monospace" }}>{fileLength.toLocaleString()} chars</div></div>
          <div><div style={{ fontSize: 8, color: "#f472b6", letterSpacing: 2, marginBottom: 3 }}>PATTERN</div><div style={{ fontSize: 12, color: "#fbbf24", fontFamily: "monospace" }}>"{pattern}"</div></div>
        </div>

        {/* Results table */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: isDark ? "#0f172a" : "#f1f5f9" }}>
                {["Algorithm", "Time (ms)", "Comparisons", "Matches Found", "Rank"].map(h => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 9, letterSpacing: 1, color: textMute, borderBottom: `1px solid ${border}`, fontWeight: "bold" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.algo} style={{ background: i % 2 === 0 ? (isDark ? "#0a0f1e" : "#f8fafc") : (isDark ? "#0f172a" : "#ffffff") }}>
                  <td style={{ padding: "9px 14px", color: r.color, fontWeight: "bold", fontFamily: "monospace" }}>{r.algo}</td>
                  <td style={{ padding: "9px 14px", color: isDark ? "#94a3b8" : "#475569" }}>{r.time.toFixed(4)} ms</td>
                  <td style={{ padding: "9px 14px", color: isDark ? "#94a3b8" : "#475569" }}>{r.comparisons.toLocaleString()}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ background: r.matches > 0 ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.1)", color: r.matches > 0 ? "#4ade80" : "#f87171", padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>
                      {r.matches > 0 ? `✓ ${r.matches} match${r.matches > 1 ? "es" : ""}` : "✗ No match"}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {i === 0 && <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: "bold" }}>🥇 FASTEST</span>}
                    {i === rows.length - 1 && rows.length > 1 && <span style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", padding: "2px 8px", borderRadius: 4, fontSize: 9 }}>SLOWEST</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bar comparison */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 9, color: textMute, letterSpacing: 2, marginBottom: 12 }}>COMPARISON — {metric === "time" ? "EXECUTION TIME" : "COMPARISONS"}</div>
          {rows.map((r, i) => {
            const maxVal = Math.max(...rows.map(x => x[mk]));
            return (
              <div key={r.algo} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: r.color, fontFamily: "monospace" }}>{r.algo}</span>
                  <span style={{ color: textMute, fontSize: 10 }}>{mk === "time" ? r.time.toFixed(4) + " ms" : r.comparisons.toLocaleString()}</span>
                </div>
                <div style={{ background: isDark ? "#1e293b" : "#e2e8f0", borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${(r[mk] / maxVal) * 100}%`, height: "100%", background: r.color, borderRadius: 4, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── GENERATE MODE (original) ───────────────────────────
  const { results: data, sizes, algos, scenarios } = results;
  const mk = metric === "time" ? "time" : "comparisons";
  const ml = metric === "time" ? "Time (ms)" : "Comparisons";

  const algoTotals = algos.map(algo => ({
    algo,
    total: scenarios.reduce((sum, sc) => sum + sizes.reduce((s2, _, si) => s2 + (data[algo][sc][si][mk] || 0), 0), 0),
  }));
  const worstAlgo = algoTotals.reduce((a, b) => b.total > a.total ? b : a, algoTotals[0])?.algo;
  const bestAlgo = algoTotals.reduce((a, b) => b.total < a.total ? b : a, algoTotals[0])?.algo;

  const lineData = algos.map(algo => ({
    xLabels: sizes.map(String),
    values: sizes.map((_, si) => {
      const vals = scenarios.map(sc => data[algo][sc][si][mk]);
      return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4));
    }),
  }));
  const barData = algos.map(algo => ({
    xLabels: sizes.map(String),
    values: sizes.map((_, si) => data[algo][scenarios[0]][si][mk]),
  }));

  const rowEven = th === "light" ? "#f1f5f9" : "#0a0f1e";
  const rowOdd = th === "light" ? "#f8fafc" : "#0f172a";

  return (
    <div>
      <FullscreenChart chart={fsChart} onClose={() => setFsChart(null)} />
      <Label color="#f472b6">STRING MATCHING RESULTS</Label>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔴</span>
          <div>
            <div style={{ fontSize: 8, color: "#f87171", letterSpacing: 2, marginBottom: 2 }}>WORST PERFORMER</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#fca5a5" }}>{worstAlgo}</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🟢</span>
          <div>
            <div style={{ fontSize: 8, color: "#4ade80", letterSpacing: 2, marginBottom: 2 }}>BEST PERFORMER</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#86efac" }}>{bestAlgo}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <ChartBox ref={lineRef} title="Line Chart — Avg vs Text Size"
          onExport={() => exportSVGasPNG(lineRef.current, "search_line_chart.png")}
          onFullscreen={() => setFsChart({ title: "Line Chart — Avg vs Text Size", node: <LineChart data={lineData} colors={searchColors} labels={algos} title={`Avg ${ml} vs n`} xTitle="Text Size" yTitle={ml} fullscreen /> })}>
          <LineChart data={lineData} colors={searchColors} labels={algos} title={`Avg ${ml} vs n`} xTitle="Text Size" yTitle={ml} />
        </ChartBox>
        <ChartBox ref={barRef} title={`Bar Chart — ${SCENARIO_LABELS[scenarios[0]]}`}
          onExport={() => exportSVGasPNG(barRef.current, "search_bar_chart.png")}
          onFullscreen={() => setFsChart({ title: `Bar Chart — ${SCENARIO_LABELS[scenarios[0]]}`, node: <BarChart data={barData} colors={searchColors} labels={algos} title={`${ml} — ${SCENARIO_LABELS[scenarios[0]]}`} xTitle="Text Size" yTitle={ml} fullscreen /> })}>
          <BarChart data={barData} colors={searchColors} labels={algos} title={`${ml} — ${SCENARIO_LABELS[scenarios[0]]}`} xTitle="Text Size" yTitle={ml} />
        </ChartBox>
      </div>

      {scenarios.map(sc => (
        <div key={sc} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#94a3b8", marginBottom: 6 }}>🔍 {SCENARIO_LABELS[sc].toUpperCase()}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ background: rowOdd }}>
              <th style={TH}>Algorithm</th>
              {sizes.map(n => <th key={n} style={TH}>n = {n}</th>)}
              <th style={{ ...TH, color: "#a78bfa" }}>Basic Ops (n={sizes[sizes.length-1]})</th>
              <th style={{ ...TH, color: "#fb923c" }}>Theoretical Formula</th>
            </tr></thead>
            <tbody>{algos.map((algo, ai) => {
              const isWorst = algo === worstAlgo;
              const isBest = algo === bestAlgo;
              const rowBg = isWorst ? "rgba(239,68,68,0.06)" : isBest ? "rgba(74,222,128,0.06)" : (ai % 2 === 0 ? rowEven : rowOdd);
              const nameColor = isWorst ? "#f87171" : isBest ? "#4ade80" : searchColors[ai % 3];
              return (
                <tr key={algo} style={{ background: rowBg }}>
                  <td style={{ ...TD, fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: nameColor }}>{algo}</span>
                    {isWorst && <span style={{ fontSize: 9, background: "rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 4, padding: "1px 5px", letterSpacing: 1 }}>WORST</span>}
                    {isBest && <span style={{ fontSize: 9, background: "rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 4, padding: "1px 5px", letterSpacing: 1 }}>BEST</span>}
                  </td>
                  {data[algo][sc].map((row, si) => (
                    <td key={si} style={{ ...TD, color: isWorst ? "#fca5a5" : "#94a3b8" }}>
                      {mk === "time" ? row.time.toFixed(4) + " ms" : row.comparisons.toLocaleString()}
                    </td>
                  ))}
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
