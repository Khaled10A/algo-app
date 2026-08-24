import { Label } from '../components/ui/SharedComponents';
import { getAlgorithm } from '../algorithms/registry';

export function PseudocodeTab({ pseudoAlgo, isDark }) {
  const d = getAlgorithm(pseudoAlgo);
  const c = d.complexity;

  return (
    <div>
      <Label color="#a78bfa">PSEUDOCODE — {d.name}</Label>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          ["Paradigm", c.paradigm, "#64748b"],
          ["Best", c.best, "#4ade80"],
          ["Average", c.average, "#fb923c"],
          ["Worst", c.worst, "#f87171"],
          ["Space", c.space, "#94a3b8"],
        ].map(([k, v, color]) => (
          <div key={k} style={{ background: isDark ? "#0f172a" : "#f1f5f9", border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`, borderRadius: 7, padding: "7px 12px" }}>
            <div style={{ color: isDark ? "#475569" : "#64748b", fontSize: 8, letterSpacing: 2, marginBottom: 2 }}>{k}</div>
            <div style={{ color, fontWeight: "bold", fontSize: 12 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{
        background: isDark ? "#0f172a" : "#f1f5f9",
        borderRadius: 10,
        border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
        padding: "18px 22px",
      }}>
        <pre style={{ color: isDark ? "#e2e8f0" : "#1e293b", fontSize: 13, lineHeight: 1.9, margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
          {d.pseudocode || "// No pseudocode available"}
        </pre>
      </div>
    </div>
  );
}
