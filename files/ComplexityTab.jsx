import { useState } from "react";
import { LineChart } from '../components/charts/LineChart';
import { Label } from '../components/ui/SharedComponents';
import { useTheme } from '../components/ui/Sidebar';
import { SORT_ALGOS, SEARCH_ALGOS, COMPLEXITY, COLORS, TH, TD, btnBase } from '../utils/constants';
import { generateArray, generateText } from '../utils/generators';

function ComparePanel({ tab, metric }) {
  const [result, setResult] = useState(null);
  const th = useTheme();
  const panelBg = th === "light" ? "#f1f5f9" : "#0f172a";
  const panelBorder = th === "light" ? "#e2e8f0" : "#1e293b";
  const trackBg = th === "light" ? "#e2e8f0" : "#1e293b";

  function run() {
    if (tab === "sorting") {
      const arr = generateArray(100, "random");
      const res = Object.entries(SORT_ALGOS).map(([name, fn]) => {
        const t0 = performance.now(); const { comparisons } = fn(arr); const t1 = performance.now();
        return { name, time: parseFloat((t1 - t0).toFixed(4)), comparisons };
      }).sort((a, b) => a.time - b.time);
      setResult(res);
    } else {
      const text = generateText(500, "test", "multiple");
      const res = Object.entries(SEARCH_ALGOS).map(([name, fn]) => {
        const t0 = performance.now(); const { comparisons } = fn(text, "test"); const t1 = performance.now();
        return { name, time: parseFloat((t1 - t0).toFixed(4)), comparisons };
      }).sort((a, b) => a.time - b.time);
      setResult(res);
    }
  }

  const mk = metric === "time" ? "time" : "comparisons";
  const maxVal = result ? Math.max(...result.map(r => r[mk]), 1) : 1;

  return (
    <div style={{ background: panelBg, borderRadius: 10, border: `1px solid ${panelBorder}`, padding: "14px 18px" }}>
      <button onClick={run} style={{ ...btnBase, marginBottom: 12, fontSize: 10, letterSpacing: 1 }}>▶ RUN SIDE-BY-SIDE (n=100)</button>
      {result && result.map((r, i) => (
        <div key={r.name} style={{ marginBottom: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
            <span style={{ color: COLORS[i % COLORS.length] }}>{r.name}</span>
            <span style={{ color: "#94a3b8", fontSize: 10 }}>{mk === "time" ? r.time + " ms" : r.comparisons.toLocaleString()}</span>
          </div>
          <div style={{ background: trackBg, borderRadius: 4, height: 7 }}>
            <div style={{ width: `${(r[mk] / maxVal) * 100}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 4, transition: "width 0.4s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComplexityTab({ tab, metric, isDark }) {
  return (
    <div>
      <Label color="#fb923c">COMPLEXITY REFERENCE</Label>
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr style={{ background: isDark ? "#0f172a" : "#e2e8f0" }}>
            {["Algorithm", "Paradigm", "Best", "Average", "Worst", "Space"].map(h => <th key={h} style={TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[...Object.keys(SORT_ALGOS), ...Object.keys(SEARCH_ALGOS)].map((algo, i) => {
              const c = COMPLEXITY[algo];
              return (
                <tr key={algo} style={{ background: i % 2 === 0 ? (isDark ? "#0a0f1e" : "#f1f5f9") : (isDark ? "#0f172a" : "#f8fafc") }}>
                  <td style={{ ...TD, color: COLORS[i % COLORS.length], fontWeight: "bold" }}>{algo}</td>
                  <td style={{ ...TD, color: "#64748b", fontSize: 10 }}>{c.paradigm}</td>
                  <td style={{ ...TD, color: "#4ade80" }}>{c.best}</td>
                  <td style={{ ...TD, color: "#fb923c" }}>{c.average}</td>
                  <td style={{ ...TD, color: "#f87171" }}>{c.worst}</td>
                  <td style={{ ...TD, color: "#94a3b8" }}>{c.space}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Label color="#fb923c">COMPARISON MODE</Label>
      <ComparePanel tab={tab} metric={metric} />
    </div>
  );
}
