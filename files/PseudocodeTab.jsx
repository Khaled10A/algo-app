import { Label } from '../components/ui/SharedComponents';
import { COMPLEXITY, PSEUDOCODE } from '../utils/constants';

export function PseudocodeTab({ pseudoAlgo, isDark }) {
  return (
    <div>
      <Label color="#a78bfa">PSEUDOCODE — {pseudoAlgo}</Label>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {COMPLEXITY[pseudoAlgo] && [
          ["Paradigm", COMPLEXITY[pseudoAlgo].paradigm, "#64748b"],
          ["Best", COMPLEXITY[pseudoAlgo].best, "#4ade80"],
          ["Average", COMPLEXITY[pseudoAlgo].average, "#fb923c"],
          ["Worst", COMPLEXITY[pseudoAlgo].worst, "#f87171"],
          ["Space", COMPLEXITY[pseudoAlgo].space, "#94a3b8"],
        ].map(([k, v, c]) => (
          <div key={k} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 7, padding: "7px 12px" }}>
            <div style={{ color: "#475569", fontSize: 8, letterSpacing: 2, marginBottom: 2 }}>{k}</div>
            <div style={{ color: c, fontWeight: "bold", fontSize: 12 }}>{v}</div>
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
          {PSEUDOCODE[pseudoAlgo] || "// No pseudocode available"}
        </pre>
      </div>
    </div>
  );
}
