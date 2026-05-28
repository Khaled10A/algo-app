export function Header({ tab, setTab, setSubTab, subTabs, subTab, setSubTab: setSubTabMain, isDark, border, theme, setTheme }) {
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

      <div style={{ display: "flex", gap: 5, marginLeft: 20 }}>
        {["sorting", "string"].map(t => (
          <button key={t} onClick={() => { setTab(t); setSubTabMain("benchmark"); }} style={{
            padding: "5px 14px", borderRadius: 5, border: "1px solid",
            borderColor: tab === t ? "#38bdf8" : border,
            background: tab === t ? "rgba(56,189,248,0.1)" : "transparent",
            color: tab === t ? "#38bdf8" : (isDark ? "#475569" : "#94a3b8"),
            fontSize: 10, letterSpacing: 2, cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase",
          }}>{t === "sorting" ? "Sorting" : "String Matching"}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginLeft: "auto", alignItems: "center" }}>
        {subTabs.map(st => (
          <button key={st} onClick={() => setSubTabMain(st)} style={{
            padding: "4px 10px", borderRadius: 4, border: "1px solid",
            borderColor: subTab === st ? "#38bdf8" : border,
            background: subTab === st ? "rgba(56,189,248,0.08)" : "transparent",
            color: subTab === st ? "#38bdf8" : (isDark ? "#475569" : "#94a3b8"),
            fontSize: 9, letterSpacing: 1, cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase",
          }}>{st}</button>
        ))}
        <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{
          marginLeft: 8, padding: "4px 10px", borderRadius: 4, border: `1px solid ${border}`,
          background: "transparent", color: isDark ? "#475569" : "#94a3b8",
          fontSize: 9, cursor: "pointer", fontFamily: "monospace",
        }}>{isDark ? "☀ LIGHT" : "🌙 DARK"}</button>
      </div>
    </div>
  );
}
