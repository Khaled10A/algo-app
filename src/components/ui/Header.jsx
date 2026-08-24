import { useLayoutEffect, useRef, useState } from "react";
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

  const segRefs = useRef({});
  const [thumb, setThumb] = useState(null);

  useLayoutEffect(() => {
    const el = segRefs.current[tab];
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const tabRefs = useRef({});
  const [tabThumb, setTabThumb] = useState(null);
  useLayoutEffect(() => {
    const el = tabRefs.current[subTab];
    if (el) setTabThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [subTab, domain.id]);

  const segContainer = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 2,
    background: "rgba(0, 0, 0, 0.22)",
    borderRadius: 9,
    padding: 2,
    boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.22)",
  };

  const segBtn = (active) => ({
    position: "relative",
    zIndex: 1,
    padding: "5px 14px",
    borderRadius: 7,
    border: "none",
    background: "transparent",
    color: active ? p.textPrimary : p.textSecondary,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: `color ${MOTION.base}`,
  });

  return (
    <header
      className="glass-toolbar"
      style={{
        position: "absolute",
        top: 12,
        left: 14,
        right: 14,
        height: 52,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 14px",
        borderRadius: 14,
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
            boxShadow: `0 2px 8px ${p.accent}44, inset 0 1px 0 rgba(255,255,255,0.35)`,
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

      <nav aria-label="Algorithm domains" style={{ ...segContainer, marginLeft: 4 }}>
        {thumb && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 2,
              left: thumb.left,
              width: thumb.width,
              height: "calc(100% - 4px)",
              borderRadius: 7,
              background: p.surface,
              boxShadow: "0 1px 3px rgba(0,0,0,0.24), 0 3px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.10)",
              transition: `left ${MOTION.spring}, width ${MOTION.spring}`,
            }}
          />
        )}
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            ref={(el) => (segRefs.current[d.id] = el)}
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
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 2,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {tabThumb && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: tabThumb.left,
              width: tabThumb.width,
              height: "100%",
              borderRadius: 999,
              background: p.accentTint,
              boxShadow: `inset 0 0 0 1px ${p.accent}44`,
              transition: `left ${MOTION.spring}, width ${MOTION.spring}`,
            }}
          />
        )}
        {domain.subTabs.map((st) => (
          <button
            key={st}
            ref={(el) => (tabRefs.current[st] = el)}
            onClick={() => setSubTab(st)}
            aria-pressed={subTab === st}
            style={{
              position: "relative",
              zIndex: 1,
              padding: "5px 10px",
              borderRadius: 999,
              border: "none",
              background: "transparent",
              color: subTab === st ? p.accentText : p.textSecondary,
              fontSize: 11.5,
              fontWeight: subTab === st ? 600 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: `color ${MOTION.base}`,
            }}
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
          borderRadius: 8,
          border: "none",
          background: p.trackBg,
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
