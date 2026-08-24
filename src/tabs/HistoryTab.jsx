import { Label } from '../components/ui/SharedComponents';
import { getAlgorithmForDisplay } from '../algorithms/registry';
import { tableStyles } from '../theme/tokens';
import { getPalette } from '../theme/tokens';

export function HistoryTab({ history, compare, setCompare, isDark }) {
  const pf = getPalette(isDark ? "dark" : "light");
  const border = pf.border;
  const cardBg = pf.surface;
  const textMuted = pf.textSecondary;
  const ts = tableStyles(isDark ? "dark" : "light");
  const algoName = (id) => getAlgorithmForDisplay(id).name;
  const algoColor = (id) => getAlgorithmForDisplay(id).color;

  const toggleCompare = (run) => {
    setCompare(prev => {
      if (prev.includes(run.id)) return prev.filter(x => x !== run.id);
      const selectedRuns = history.filter(h => prev.includes(h.id));
      if (selectedRuns.length > 0 && selectedRuns[0].kind !== run.kind) return prev;
      return prev.length < 4 ? [...prev, run.id] : prev;
    });
  };

  const compareRuns = history.filter(h => compare.includes(h.id));

  if (history.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "55vh", gap: 12, opacity: 0.3 }}>
        <div style={{ fontSize: 42 }}>📜</div>
        <div style={{ fontSize: 11, color: pf.textSecondary }}>NO RUNS YET — EXECUTE A BENCHMARK</div>
      </div>
    );
  }

  return (
    <div>
      <Label>Run history</Label>

      {compareRuns.length >= 2 && (
        <div style={{ background: pf.accentTint, border: `1px solid ${pf.accent}40`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: pf.accentText, letterSpacing: 2, marginBottom: 12 }}>COMPARING {compareRuns.length} RUNS</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={ts.TH}>Metric</th>
                  {compareRuns.map(r => <th key={r.id} style={{ ...ts.TH, color: pf.accentText }}>{r.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {compareRuns[0].kind === "sorting" && compareRuns[0].algos.map((algo, ai) => {
                  const rowVals = compareRuns.map(r => {
                    const mk = r.metric === "time" ? "time" : "comparisons";
                    const total = r.types.reduce((s, t) => s + (r.results[algo]?.[t]?.reduce((s2, row) => s2 + (row[mk] || 0), 0) || 0), 0);
                    return total;
                  });
                  const maxV = Math.max(...rowVals, 1);
                  return (
                    <tr key={algo} style={{ background: ai % 2 === 0 ? (isDark ? "#0a0f1e" : "#f1f5f9") : (isDark ? "#0f172a" : "#f8fafc") }}>
                      <td style={{ ...ts.TD, color: algoColor(algo), fontWeight: "bold" }}>{algoName(algo)}</td>
                      {rowVals.map((v, i) => (
                        <td key={i} style={ts.TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ flex: 1, background: pf.trackBg, borderRadius: 3, height: 6 }}>
                              <div style={{ width: `${(v / maxV) * 100}%`, height: "100%", background: algoColor(algo), borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 10, color: pf.textSecondary, minWidth: 50, textAlign: "right" }}>
                              {compareRuns[i].metric === "time" ? v.toFixed(3) + "ms" : v.toLocaleString()}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {compareRuns[0].kind === "search" && compareRuns[0].algos.map((algo, ai) => {
                  const searchColors = ["#f472b6", "#4ade80", "#fb923c"];
                  const rowVals = compareRuns.map(r => {
                    const mk = r.metric === "time" ? "time" : "comparisons";
                    return r.scenarios.reduce((s, sc) => s + (r.results[algo]?.[sc]?.reduce((s2, row) => s2 + (row[mk] || 0), 0) || 0), 0);
                  });
                  const maxV = Math.max(...rowVals, 1);
                  return (
                    <tr key={algo} style={{ background: ai % 2 === 0 ? (isDark ? "#0a0f1e" : "#f1f5f9") : (isDark ? "#0f172a" : "#f8fafc") }}>
                      <td style={{ ...ts.TD, color: searchColors[ai % 3], fontWeight: "bold" }}>{algoName(algo)}</td>
                      {rowVals.map((v, i) => (
                        <td key={i} style={ts.TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ flex: 1, background: pf.trackBg, borderRadius: 3, height: 6 }}>
                              <div style={{ width: `${(v / maxV) * 100}%`, height: "100%", background: searchColors[ai % 3], borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 10, color: pf.textSecondary, minWidth: 50, textAlign: "right" }}>
                              {compareRuns[i].metric === "time" ? v.toFixed(3) + "ms" : v.toLocaleString()}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {compare.length > 0 && compare.length < 2 && (
        <div style={{ background: "rgba(167,139,250,0.04)", border: `1px dashed ${pf.accent}55`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 10, color: pf.accentText, textAlign: "center" }}>
          Select {2 - compare.length} more run{compare.length === 0 ? "s" : ""} to compare (max 4)
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {history.map((run) => {
          const isSelected = compare.includes(run.id);
          const mk = run.metric === "time" ? "time" : "comparisons";
          const algosData = run.kind === "sorting"
            ? run.algos.map(a => ({ id: a, name: algoName(a), val: run.types.reduce((s, t) => s + (run.results[a]?.[t]?.reduce((s2, r) => s2 + (r[mk] || 0), 0) || 0), 0) }))
            : run.algos.map(a => ({ id: a, name: algoName(a), val: run.scenarios.reduce((s, sc) => s + (run.results[a]?.[sc]?.reduce((s2, r) => s2 + (r[mk] || 0), 0) || 0), 0) }));
          const maxVal = Math.max(...algosData.map(d => d.val), 1);
          const worstName = algosData.reduce((a, b) => b.val > a.val ? b : a, algosData[0])?.name;
          const clrs = run.algos.map((id) => algoColor(id));

          return (
            <div key={run.id} style={{
              background: isSelected ? pf.accentTint : cardBg,
              boxShadow: isSelected
                ? `0 0 0 1.5px ${pf.accent}, ${pf.shadowFloat}`
                : "0 0 0 1px rgba(127,127,127,0.14)",
              borderRadius: 12, padding: "14px 16px", transition: "box-shadow 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: "bold", color: isDark ? "#e2e8f0" : "#1e293b", marginBottom: 2 }}>{run.label}</div>
                  <div style={{ fontSize: 9, color: textMuted, letterSpacing: 1 }}>
                    {run.ts} · {run.kind === "sorting" ? "SORTING" : "STRING MATCHING"} · {run.metric === "time" ? "TIME" : "COMPARISONS"}
                    {run.inputMode === "custom" && <span style={{ marginLeft: 6, color: "#fbbf24" }}>· CUSTOM INPUT</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {worstName && <span style={{ fontSize: 9, background: "rgba(255, 59, 48, 0.10)", color: "#d70015", borderRadius: 4, padding: "2px 6px" }}>⚠ {worstName}</span>}
                <button onClick={() => toggleCompare(run)} style={{
                  fontSize: 9, padding: "4px 10px", borderRadius: 5, cursor: "pointer",
                  fontFamily: "monospace", letterSpacing: 1,
                  border: isSelected ? "1px solid #a78bfa" : `1px solid ${border}`,
                  background: "transparent",
                  color: isSelected ? "#a78bfa" : textMuted,
                }}>{isSelected ? "✓ SELECTED" : "+ COMPARE"}</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {algosData.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 90, fontSize: 10, color: clrs[i] || pf.textSecondary, textAlign: "right", flexShrink: 0 }}>{d.name}</div>
                    <div style={{ flex: 1, background: pf.trackBg, borderRadius: 4, height: 8 }}>
                      <div style={{
                        width: `${(d.val / maxVal) * 100}%`, height: "100%",
                        background: d.name === worstName ? pf.redStrong : (clrs[i] || pf.textFaint),
                        borderRadius: 4, transition: "width 0.4s",
                      }} />
                    </div>
                    <div style={{ width: 70, fontSize: 10, color: pf.textSecondary, textAlign: "right", flexShrink: 0 }}>
                      {mk === "time" ? d.val.toFixed(3) + "ms" : d.val.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
