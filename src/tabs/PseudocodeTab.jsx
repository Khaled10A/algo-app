import { Label } from '../components/ui/SharedComponents';
import { getAlgorithmSafe } from '../algorithms/registry';
import { getPalette, FONT_MONO } from '../theme/tokens';

export function PseudocodeTab({ pseudoAlgo, isDark }) {
  const d = getAlgorithmSafe(pseudoAlgo);
  const p = getPalette(isDark ? "dark" : "light");

  if (!d) {
    return (
      <div>
        <Label>Pseudocode</Label>
        <div style={{
          background: p.surface,
          borderRadius: 10,
          border: `1px solid ${p.border}`,
          padding: "18px 22px", fontSize: 12,
          color: p.textSecondary,
        }}>
          Unknown algorithm "{String(pseudoAlgo)}" — pick one from the sidebar.
        </div>
      </div>
    );
  }

  const c = d.complexity;

  return (
    <div>
      <Label>Pseudocode — {d.name}</Label>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          ["Paradigm", c.paradigm, "#64748b"],
          ["Best", c.best, "#4ade80"],
          ["Average", c.average, "#fb923c"],
          ["Worst", c.worst, "#f87171"],
          ["Space", c.space, "#94a3b8"],
        ].map(([k, v, color]) => (
          <div key={k} style={{ background: isDark ? "#0f172a" : "#f1f5f9", border: `1px solid ${p.border}`, borderRadius: 7, padding: "7px 12px" }}>
            <div style={{ color: p.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{k}</div>
            <div style={{ color, fontWeight: "bold", fontSize: 12 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{
        background: isDark ? "#0f172a" : "#f1f5f9",
        borderRadius: 10,
        border: `1px solid ${p.border}`,
        padding: "18px 22px",
      }}>
        <pre style={{ color: p.textPrimary, fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", fontFamily: FONT_MONO }}>
          {d.pseudocode || "// No pseudocode available"}
        </pre>
      </div>
    </div>
  );
}
