import { useState, useRef } from "react";
import { LineChart, BarChart } from '../components/charts/LineChart';
import { Label, Empty, ChartBox, FullscreenChart } from '../components/ui/SharedComponents';
import { useTheme } from '../theme/ThemeContext';
import { exportSVGasPNG } from '../utils/exportUtils';
import { getAlgorithmForDisplay } from '../algorithms/registry';
import { INPUT_LABELS, SCENARIO_LABELS } from '../utils/constants';
import { tableStyles, getPalette } from '../theme/tokens';

export function SortResults({ results, metric, lineRef: externalLineRef, barRef: externalBarRef }) {
  const { results: data, sizes, algos, types } = results;
  const mk = metric === "time" ? "time" : "comparisons";
  const ml = metric === "time" ? "Time (ms)" : "Comparisons";
  const internalLineRef = useRef(); const internalBarRef = useRef();
  const lineRef = externalLineRef || internalLineRef;
  const barRef = externalBarRef || internalBarRef;
  const [fsChart, setFsChart] = useState(null);
  const th = useTheme();
  const ts = tableStyles(th);
  const meta = algos.map((id) => getAlgorithmForDisplay(id));
  const algoColors = meta.map((d) => d.color);

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

  return (
    <div>
      <FullscreenChart chart={fsChart} onClose={() => setFsChart(null)} />
      <Label>SORTING RESULTS</Label>

      <div
        className="surface-card"
        style={{ borderRadius: 12, padding: "13px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#d70015" }}>Worst performer</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#d70015" }}>{getAlgorithmForDisplay(worstAlgo).name}</span>
        </div>
        <div aria-hidden="true" style={{ width: 1, height: 22, background: "rgba(127,127,127,0.30)" }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#1f9d48" }}>Best performer</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1f9d48" }}>{getAlgorithmForDisplay(bestAlgo).name}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <ChartBox ref={lineRef} title="Line Chart — Avg vs Size"
          onExport={() => exportSVGasPNG(lineRef.current, "sort_line_chart.png", th === "light" ? "#ffffff" : "#0f172a")}
          onFullscreen={() => setFsChart({ title: "Line Chart — Avg vs Size", node: <LineChart data={lineData} colors={algoColors} labels={meta.map(d => d.name)} title={`Avg ${ml} vs n`} xTitle="Input Size (n)" yTitle={ml} fullscreen /> })}>
          <LineChart data={lineData} colors={algoColors} labels={meta.map(d => d.name)} title={`Avg ${ml} vs n`} xTitle="Input Size (n)" yTitle={ml} />
        </ChartBox>
        <ChartBox ref={barRef} title={`Bar Chart — ${INPUT_LABELS[types[0]]}`}
          onExport={() => exportSVGasPNG(barRef.current, "sort_bar_chart.png", th === "light" ? "#ffffff" : "#0f172a")}
          onFullscreen={() => setFsChart({ title: `Bar Chart — ${INPUT_LABELS[types[0]]}`, node: <BarChart data={barData} colors={algoColors} labels={meta.map(d => d.name)} title={`${ml} — ${INPUT_LABELS[types[0]]}`} xTitle="Input Size (n)" yTitle={ml} fullscreen /> })}>
          <BarChart data={barData} colors={algoColors} labels={meta.map(d => d.name)} title={`${ml} — ${INPUT_LABELS[types[0]]}`} xTitle="Input Size (n)" yTitle={ml} />
        </ChartBox>
      </div>

      {types.map(type => (
        <div key={type} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "inherit", marginBottom: 6 }}>{INPUT_LABELS[type]}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ background: ts.rowOdd }}>
              <th style={ts.TH}>Algorithm</th>
              {sizes.map(n => <th key={n} style={ts.TH}>n = {n}</th>)}
              <th style={{ ...ts.TH, color: "#8944ab" }}>Basic Ops (n={sizes[sizes.length-1]})</th>
              <th style={{ ...ts.TH, color: "#c93400" }}>Theoretical Formula</th>
            </tr></thead>
            <tbody>{algos.map((algo, ai) => {
              const isWorst = algo === worstAlgo;
              const isBest = algo === bestAlgo;
              const rowBg = isWorst ? "rgba(239,68,68,0.06)" : isBest ? "rgba(74,222,128,0.06)" : (ai % 2 === 0 ? ts.rowEven : ts.rowOdd);
              const dsc = meta[ai];
              const displayName = dsc.name;
              const nameColor = isWorst ? "#d70015" : isBest ? "#1f9d48" : dsc.color;
              return (
                <tr key={algo} style={{ background: rowBg }}>
                  <td style={{ ...ts.TD, fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: nameColor, fontWeight: 600 }}>{displayName}</span>
                    {isWorst && <span style={{ fontSize: 9, background: "rgba(255, 59, 48, 0.12)", color: "#d70015", borderRadius: 4, padding: "1px 5px", letterSpacing: 1 }}>WORST</span>}
                    {isBest && <span style={{ fontSize: 9, background: "rgba(48, 209, 88, 0.14)", color: "#1f9d48", borderRadius: 4, padding: "1px 5px", letterSpacing: 1 }}>BEST</span>}
                  </td>
                  {data[algo][type].map((row, si) => (
                    <td key={si} style={{ ...ts.TD, color: isWorst ? "#d70015" : "inherit", fontWeight: 500 }}>
                      {mk === "time" ? row.time.toFixed(4) + " ms" : row.comparisons.toLocaleString()}
                    </td>
                  ))}
                  <td style={{ ...ts.TD, color: "#8944ab", fontFamily: "monospace", fontSize: 10 }}>
                    {data[algo][type][data[algo][type].length - 1].comparisons.toLocaleString()}
                  </td>
                  <td style={{ ...ts.TD, fontSize: 10 }}>
                    {(() => {
                      const n = sizes[sizes.length - 1];
                      const c = getAlgorithmForDisplay(algo).complexity;
                      if (!c) return "-";
                      const theoretical = c.worst.includes("n²") ? Math.round(n*n)
                        : c.worst.includes("n log n") ? Math.round(n * Math.log2(n))
                        : c.worst.includes("n×m") ? "-"
                        : c.worst.includes("n+m") ? "-"
                        : n;
                      return (
                        <span>
                          <span style={{ color: "#c93400" }}>{c.worst}</span>
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
  const ts = tableStyles(th);
  const lineRef = externalLineRef || internalLineRef;
  const barRef = externalBarRef || internalBarRef;

  // ── FILE MODE ──────────────────────────────────────────
  if (results.mode === "file") {
    const { results: data, algos, pattern, fileName, fileLength } = results;
    const mk = metric === "time" ? "time" : "comparisons";
    const isDark = th !== "light";
    const pf = getPalette(th);
    const border = pf.border;
    const cardBg = pf.surface;
    const textMute = pf.textSecondary;

    const rows = algos.map((algo) => {
      const r = data[algo]["file"][0];
      return { algo, name: getAlgorithmForDisplay(algo).name, time: r.time, comparisons: r.comparisons, matches: r.matches?.length || 0, color: getAlgorithmForDisplay(algo).color };
    }).sort((a, b) => a[mk] - b[mk]);

    return (
      <div>
        <Label>STRING MATCHING — FILE RESULTS</Label>

        {/* File info card */}
        <div style={{ background: "rgba(255, 55, 95, 0.06)", border: "1px solid rgba(255, 55, 95, 0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 8, color: "#e8386d", letterSpacing: 2, marginBottom: 3 }}>FILE</div><div style={{ fontSize: 12, color: pf.textPrimary }}>📄 {fileName}</div></div>
          <div><div style={{ fontSize: 8, color: "#e8386d", letterSpacing: 2, marginBottom: 3 }}>TEXT LENGTH</div><div style={{ fontSize: 12, color: pf.textPrimary }}>{fileLength.toLocaleString()} chars</div></div>
          <div><div style={{ fontSize: 8, color: "#e8386d", letterSpacing: 2, marginBottom: 3 }}>PATTERN</div><div style={{ fontSize: 12, color: "#b25000", fontFamily: "inherit" }}>"{pattern}"</div></div>
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
                <tr key={r.algo} style={{ background: i % 2 === 0 ? pf.rowEven : pf.rowOdd }}>
                  <td style={{ padding: "9px 14px", color: r.color, fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: "9px 14px", color: pf.textSecondary }}>{r.time.toFixed(4)} ms</td>
                  <td style={{ padding: "9px 14px", color: pf.textSecondary }}>{r.comparisons.toLocaleString()}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ background: r.matches > 0 ? "rgba(48, 209, 88, 0.14)" : "rgba(255, 59, 48, 0.10)", color: r.matches > 0 ? "#1f9d48" : "#d70015", padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>
                      {r.matches > 0 ? `✓ ${r.matches} match${r.matches > 1 ? "es" : ""}` : "✗ No match"}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {i === 0 && <span style={{ background: "rgba(48, 209, 88, 0.14)", color: "#1f9d48", padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600 }}>Fastest</span>}
                    {i === rows.length - 1 && rows.length > 1 && <span style={{ background: "rgba(255, 59, 48, 0.10)", color: "#d70015", padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 500 }}>Slowest</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bar comparison */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: textMute, marginBottom: 12 }}>{metric === "time" ? "Comparison — execution time" : "Comparison — operations"}</div>
          {rows.map((r, i) => {
            const maxVal = Math.max(...rows.map(x => x[mk]));
            return (
              <div key={r.algo} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: r.color, fontFamily: "monospace" }}>{r.name}</span>
                  <span style={{ color: textMute, fontSize: 10 }}>{mk === "time" ? r.time.toFixed(4) + " ms" : r.comparisons.toLocaleString()}</span>
                </div>
                <div style={{ background: pf.trackBg, borderRadius: 4, height: 8 }}>
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

  const searchMeta = algos.map((id) => getAlgorithmForDisplay(id));
  const searchColors = searchMeta.map((d) => d.color);

  return (
    <div>
      <FullscreenChart chart={fsChart} onClose={() => setFsChart(null)} />
      <Label>STRING MATCHING RESULTS</Label>

      <div
        className="surface-card"
        style={{ borderRadius: 12, padding: "13px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#d70015" }}>Worst performer</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#d70015" }}>{getAlgorithmForDisplay(worstAlgo).name}</span>
        </div>
        <div aria-hidden="true" style={{ width: 1, height: 22, background: "rgba(127,127,127,0.30)" }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#1f9d48" }}>Best performer</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1f9d48" }}>{getAlgorithmForDisplay(bestAlgo).name}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <ChartBox ref={lineRef} title="Line Chart — Avg vs Text Size"
          onExport={() => exportSVGasPNG(lineRef.current, "search_line_chart.png", th === "light" ? "#ffffff" : "#0f172a")}
          onFullscreen={() => setFsChart({ title: "Line Chart — Avg vs Text Size", node: <LineChart data={lineData} colors={searchColors} labels={algos} title={`Avg ${ml} vs n`} xTitle="Text Size" yTitle={ml} fullscreen /> })}>
          <LineChart data={lineData} colors={searchColors} labels={algos} title={`Avg ${ml} vs n`} xTitle="Text Size" yTitle={ml} />
        </ChartBox>
        <ChartBox ref={barRef} title={`Bar Chart — ${SCENARIO_LABELS[scenarios[0]]}`}
          onExport={() => exportSVGasPNG(barRef.current, "search_bar_chart.png", th === "light" ? "#ffffff" : "#0f172a")}
          onFullscreen={() => setFsChart({ title: `Bar Chart — ${SCENARIO_LABELS[scenarios[0]]}`, node: <BarChart data={barData} colors={searchColors} labels={algos} title={`${ml} — ${SCENARIO_LABELS[scenarios[0]]}`} xTitle="Text Size" yTitle={ml} fullscreen /> })}>
          <BarChart data={barData} colors={searchColors} labels={algos} title={`${ml} — ${SCENARIO_LABELS[scenarios[0]]}`} xTitle="Text Size" yTitle={ml} />
        </ChartBox>
      </div>

      {scenarios.map(sc => (
        <div key={sc} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "inherit", marginBottom: 6 }}>{SCENARIO_LABELS[sc]}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ background: ts.rowOdd }}>
              <th style={ts.TH}>Algorithm</th>
              {sizes.map(n => <th key={n} style={ts.TH}>n = {n}</th>)}
              <th style={{ ...ts.TH, color: "#8944ab" }}>Basic Ops (n={sizes[sizes.length-1]})</th>
              <th style={{ ...ts.TH, color: "#c93400" }}>Theoretical Formula</th>
            </tr></thead>
            <tbody>{algos.map((algo, ai) => {
              const isWorst = algo === worstAlgo;
              const isBest = algo === bestAlgo;
              const rowBg = isWorst ? "rgba(239,68,68,0.06)" : isBest ? "rgba(74,222,128,0.06)" : (ai % 2 === 0 ? ts.rowEven : ts.rowOdd);
              const nameColor = isWorst ? "#d70015" : isBest ? "#1f9d48" : searchMeta[ai % 3].color;
              return (
                <tr key={algo} style={{ background: rowBg }}>
                  <td style={{ ...ts.TD, fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: nameColor, fontWeight: 600 }}>{searchMeta[ai].name}</span>
                    {isWorst && <span style={{ fontSize: 9, background: "rgba(255, 59, 48, 0.12)", color: "#d70015", borderRadius: 4, padding: "1px 5px", letterSpacing: 1 }}>WORST</span>}
                    {isBest && <span style={{ fontSize: 9, background: "rgba(48, 209, 88, 0.14)", color: "#1f9d48", borderRadius: 4, padding: "1px 5px", letterSpacing: 1 }}>BEST</span>}
                  </td>
                  {data[algo][sc].map((row, si) => (
                    <td key={si} style={{ ...ts.TD, color: isWorst ? "#d70015" : "inherit", fontWeight: 500 }}>
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
