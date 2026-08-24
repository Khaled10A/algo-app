import { useState } from "react";
import { LineChart } from '../components/charts/LineChart';
import { Label } from '../components/ui/SharedComponents';
import { useTheme } from '../theme/ThemeContext';
import { getBenchmarkable } from '../algorithms/registry';
import { generateArray, generateText } from '../utils/generators';
import { measure } from '../core/benchmark/engine';
import { tableStyles, CHART_FALLBACK_COLORS, getPalette } from '../theme/tokens';

function ComparePanel({ tab, metric }) {
  const [result, setResult] = useState(null);
  const th = useTheme();
  const panelBg = th === "light" ? "#f1f5f9" : "#0f172a";
  const panelBorder = th === "light" ? "#e2e8f0" : "#1e293b";
  const trackBg = th === "light" ? "#e2e8f0" : "#1e293b";
  const descriptors = getBenchmarkable(tab);

  function run() {
    if (tab === "sorting") {
      const arr = generateArray(100, "random");
      const res = descriptors
        .map(({ name, color, run: fn }) => {
          const { time, comparisons } = measure(fn, { setup: () => [arr], repeats: 1 });
          return { name, color, time: parseFloat(time.toFixed(4)), comparisons };
        })
        .sort((a, b) => a.time - b.time);
      setResult(res);
    } else {
      const text = generateText(500, "test", "multiple");
      const res = descriptors
        .map(({ name, color, run: fn }) => {
          const { time, comparisons } = measure(fn, { setup: () => [text, "test"], repeats: 1 });
          return { name, color, time: parseFloat(time.toFixed(4)), comparisons };
        })
        .sort((a, b) => a.time - b.time);
      setResult(res);
    }
  }

  const mk = metric === "time" ? "time" : "comparisons";
  const maxVal = result ? Math.max(...result.map((r) => r[mk]), 1) : 1;

  return (
    <div style={{ background: panelBg, borderRadius: 10, border: `1px solid ${panelBorder}`, padding: "14px 18px" }}>
      <button onClick={run} style={{ ...btnStyle(th), marginBottom: 12 }}>Run side-by-side (n=100)</button>
      {result && result.map((r, i) => (
        <div key={r.name} style={{ marginBottom: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
            <span style={{ color: r.color || CHART_FALLBACK_COLORS[i % CHART_FALLBACK_COLORS.length] }}>{r.name}</span>
            <span style={{ color: pf.textSecondary, fontSize: 10 }}>{mk === "time" ? r.time + " ms" : r.comparisons.toLocaleString()}</span>
          </div>
          <div style={{ background: trackBg, borderRadius: 4, height: 7 }}>
            <div style={{ width: `${(r[mk] / maxVal) * 100}%`, height: "100%", background: r.color || CHART_FALLBACK_COLORS[i % CHART_FALLBACK_COLORS.length], borderRadius: 4, transition: "width 0.4s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function btnStyle(th) {
  const p2 = getPalette(th);
  return {
    background: th === "light" ? "#ffffff" : "#232325",
    border: `1px solid ${th === "light" ? "#cbd5e1" : "#1e293b"}`,
    borderRadius: 6,
    color: th === "light" ? "#475569" : "#94a3b8",
    fontSize: 11, cursor: "pointer", padding: "6px 12px", fontFamily: "monospace",
  };
}

export function ComplexityTab({ tab, metric, isDark }) {
  const ts = tableStyles(isDark ? "dark" : "light");
  const rows = [
    ...getBenchmarkable("sorting"),
    ...getBenchmarkable("searching"),
  ];
  const pf = getPalette(isDark ? "dark" : "light");

  return (
    <div>
      <Label>Complexity reference</Label>
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ background: isDark ? "#232325" : "#e8e8ed" }}>
            {["Algorithm", "Paradigm", "Best", "Average", "Worst", "Space"].map((h) => <th key={h} style={ts.TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((d, i) => {
              const c = d.complexity;
              return (
                <tr key={d.id} style={{ background: i % 2 === 0 ? ts.rowEven : ts.rowOdd }}>
                  <td style={{ ...ts.TD, color: d.color, fontWeight: "bold" }}>{d.name}</td>
                  <td style={{ ...ts.TD, color: pf.textSecondary, fontSize: 11 }}>{c.paradigm}</td>
                  <td style={{ ...ts.TD, color: "#1f9d48" }}>{c.best}</td>
                  <td style={{ ...ts.TD, color: "#c93400" }}>{c.average}</td>
                  <td style={{ ...ts.TD, color: "#d70015" }}>{c.worst}</td>
                  <td style={{ ...ts.TD, color: pf.textSecondary }}>{c.space}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Label>Comparison mode</Label>
      <ComparePanel tab={tab} metric={metric} />
    </div>
  );
}
