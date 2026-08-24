import { DOMAINS } from "../../algorithms/registry";

export function Header({ tab, setTab, subTab, setSubTab, isDark, border }) {
  const domain = DOMAINS.find((d) => d.id === tab) || DOMAINS[0];

  return (
    <div style={{
      borderBottom: `1px solid ${border}`, padding: "12px 32px",
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      background: isDark ? "#020817" : "#ffffff", width: "100%",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7,
        background: "linear-gradient(135deg,#38bdf8,#818cf8)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
      }}>⚡</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: 2, color: isDark ? "#f1f5f9" : "#0f172a" }}>ALGO BENCHMARK</div>
        <div style={{ fontSize: 8, color: isDark ? "#475569" : "#94a3b8", letterSpacing: 3 }}>DESIGN & ANALYSIS OF ALGORITHMS</div>
      </div>

      <nav style={{ display: "flex", gap: 5, marginLeft: 20 }} aria-label="Algorithm domains">
        {DOMAINS.map((d) => (
          <button key={d.id} onClick={() => { setTab(d.id); setSubTab(d.subTabs[0]); }} aria-pressed={tab === d.id} style={{
            padding: "5px 14px", borderRadius: 5, border: "1px solid",
            borderColor: tab === d.id ? "#38bdf8" : border,
            background: tab === d.id ? "rgba(56,189,248,0.1)" : "transparent",
            color: tab === d.id ? "#38bdf8" : (isDark ? "#475569" : "#94a3b8"),
            fontSize: 10, letterSpacing: 2, cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase",
          }}>{d.label}</button>
        ))}
      </nav>

      <div style={{ display: "flex", gap: 4, marginLeft: "auto", alignItems: "center" }} aria-label="Sections">
        {domain.subTabs.map((st) => (
          <button key={st} onClick={() => setSubTab(st)} aria-pressed={subTab === st} style={{
            padding: "4px 10px", borderRadius: 4, border: "1px solid",
            borderColor: subTab === st ? "#f472b6" : border,
            background: subTab === st ? "rgba(244,114,182,0.08)" : "transparent",
            color: subTab === st ? "#f472b6" : (isDark ? "#475569" : "#94a3b8"),
            fontSize: 9, letterSpacing: 1, cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase",
          }}>{st}</button>
        ))}
      </div>
    </div>
  );
}
