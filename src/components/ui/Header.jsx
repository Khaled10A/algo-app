import { DOMAINS } from "../../algorithms/registry";
import { MOTION } from "../../theme/tokens";

function SunIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.4" stroke={color} strokeWidth="1.8" />
      <g stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.3" y1="5.3" x2="7" y2="7" />
        <line x1="17" y1="17" x2="18.7" y2="18.7" />
        <line x1="5.3" y1="18.7" x2="7" y2="17" />
        <line x1="17" y1="7" x2="18.7" y2="5.3" />
      </g>
    </svg>
  );
}

function MoonIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 13.2A8.2 8.2 0 0 1 10.8 4a8.2 8.2 0 1 0 9.2 9.2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header({ tab, setTab, subTab, setSubTab, isDark, palette, onToggleTheme }) {
  const domain = DOMAINS.find((d) => d.id === tab) || DOMAINS[0];
  const p = palette;

  const segContainer = {
    display: "flex",
    alignItems: "center",
    gap: 2,
    background: p.trackBg,
    borderRadius: 8,
    padding: 2,
  };

  const segBtn = (active) => ({
    padding: "5px 14px",
    borderRadius: 6,
    border: "none",
    background: active ? p.surface : "transparent",
    color: active ? p.textPrimary : p.textSecondary,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    boxShadow: active ? p.shadowCard : "none",
    transition: `background ${MOTION.fast}, color ${MOTION.fast}`,
  });

  const tabBtn = (active) => ({
    padding: "4px 10px",
    borderRadius: 999,
    border: "none",
    background: active ? p.accentTint : "transparent",
    color: active ? p.accentText : p.textSecondary,
    fontSize: 11.5,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: `background ${MOTION.fast}, color ${MOTION.fast}`,
  });

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 16px",
        background: p.toolbar,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${p.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div
          aria-hidden="true"
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: `linear-gradient(135deg, ${p.accent}, ${p.indigo})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 6l-5 6 5 6M16 6l5 6-5 6"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: p.textStrong, lineHeight: 1.2 }}>
            ALGO BENCHMARK
          </div>
          <div style={{ fontSize: 10, color: p.textSecondary, lineHeight: 1.2 }}>
            Design &amp; Analysis of Algorithms
          </div>
        </div>
      </div>

      <nav aria-label="Algorithm domains" style={{ ...segContainer, marginLeft: 6 }}>
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setTab(d.id);
              setSubTab(d.subTabs[0]);
            }}
            aria-pressed={tab === d.id}
            style={segBtn(tab === d.id)}
          >
            {d.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <nav
        aria-label="Sections"
        style={{ display: "flex", alignItems: "center", gap: 3, overflowX: "auto" }}
      >
        {domain.subTabs.map((st) => (
          <button
            key={st}
            onClick={() => setSubTab(st)}
            aria-pressed={subTab === st}
            style={{ ...tabBtn(subTab === st), whiteSpace: "nowrap" }}
          >
            {st}
          </button>
        ))}
      </nav>

      <button
        onClick={onToggleTheme}
        aria-label="Toggle theme"
        title="Toggle theme"
        style={{
          marginLeft: 4,
          width: 30,
          height: 30,
          borderRadius: 7,
          border: `1px solid ${p.border}`,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: p.textSecondary,
          transition: `background ${MOTION.fast}`,
        }}
      >
        {isDark ? <SunIcon color={p.textSecondary} /> : <MoonIcon color={p.textSecondary} />}
      </button>
    </header>
  );
}
