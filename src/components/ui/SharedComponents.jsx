import { forwardRef } from "react";
import { useTheme } from "./Sidebar";

export function Sec({ title, children }) {
  const th = useTheme();
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: th === "light" ? "#64748b" : "#94a3b8", marginBottom: 8, fontWeight: "bold" }}>{title}</div>
      <div role="group" aria-label={title} style={{ display: "flex", flexDirection: "column", gap: 5 }}>{children}</div>
    </div>
  );
}

const hiddenInputStyle = {
  position: "absolute",
  opacity: 0,
  width: 1,
  height: 1,
  margin: 0,
  pointerEvents: "none",
};

export function Chk({ label, checked, onChange, radio }) {
  const th = useTheme();
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
      <input
        type={radio ? "radio" : "checkbox"}
        checked={checked}
        onChange={onChange}
        style={hiddenInputStyle}
        tabIndex={0}
      />
      <span aria-hidden="true" style={{
        width: 14, height: 14, borderRadius: radio ? "50%" : 3,
        border: `1px solid ${checked ? "#38bdf8" : (th === "light" ? "#94a3b8" : "#334155")}`,
        background: checked ? "#38bdf8" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {checked && <span style={{ width: radio ? 4 : 6, height: radio ? 4 : 5, borderRadius: radio ? "50%" : 1, background: th === "light" ? "#fff" : "#020817" }} />}
      </span>
      <span style={{ fontSize: 11, color: checked ? (th === "light" ? "#1e293b" : "#e2e8f0") : (th === "light" ? "#475569" : "#64748b") }}>{label}</span>
    </label>
  );
}

export function SInput({ value, onChange, placeholder, hint, label }) {
  const th = useTheme();
  return (
    <div>
      <input value={value} onChange={onChange} placeholder={placeholder} aria-label={label || placeholder || "input"} style={{
        width: "100%", background: th === "light" ? "#f1f5f9" : "#0f172a",
        border: `1px solid ${th === "light" ? "#cbd5e1" : "#1e293b"}`, borderRadius: 6,
        padding: "7px 9px", color: th === "light" ? "#1e293b" : "#e2e8f0", fontSize: 12, fontFamily: "monospace", boxSizing: "border-box",
      }} />
      {hint && <div style={{ fontSize: 9, color: th === "light" ? "#64748b" : "#475569", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

export function RunBtn({ onClick, running, label }) {
  const th = useTheme();
  return (
    <button onClick={onClick} disabled={running} style={{
      width: "100%", padding: "10px", borderRadius: 7, border: "none",
      background: running ? (th === "light" ? "#e2e8f0" : "#1e293b") : "linear-gradient(135deg,#0284c7,#6366f1)",
      color: running ? (th === "light" ? "#64748b" : "#475569") : "#fff", fontSize: 11, letterSpacing: 2,
      cursor: running ? "not-allowed" : "pointer", fontFamily: "monospace", fontWeight: "bold",
    }}>{running ? "⏳ RUNNING..." : `▶  ${label || "RUN BENCHMARK"}`}</button>
  );
}

export function GhostBtn({ onClick, label, color = "#4ade80" }) {
  const th = useTheme();
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "7px", borderRadius: 6,
      border: `1px solid ${th === "light" ? "#cbd5e1" : "#1e293b"}`,
      background: "transparent", color, fontSize: 10, letterSpacing: 2,
      cursor: "pointer", fontFamily: "monospace", marginTop: 5,
    }}>{label}</button>
  );
}

export function Label({ color, children }) {
  return <div style={{ fontSize: 12, letterSpacing: 2, color, marginBottom: 14, fontWeight: "bold" }}>{children}</div>;
}

export function Empty({ icon, text }) {
  const th = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "55vh", gap: 12, opacity: 0.3 }}>
      <div style={{ fontSize: 42 }} aria-hidden="true">{icon}</div>
      <div style={{ fontSize: 11, color: th === "light" ? "#64748b" : "#94a3b8", letterSpacing: 2 }}>{text.toUpperCase()}</div>
    </div>
  );
}

export const ChartBox = forwardRef(({ title, children, onExport, onFullscreen }, ref) => {
  const th = useTheme();
  const bg = th === "light" ? "#f8fafc" : "#0f172a";
  const border = th === "light" ? "#e2e8f0" : "#1e293b";
  const textColor = th === "light" ? "#64748b" : "#94a3b8";
  return (
    <div ref={ref} style={{ background: bg, borderRadius: 10, border: `1px solid ${border}`, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 9, color: textColor, letterSpacing: 2 }}>{title.toUpperCase()}</div>
        <div style={{ display: "flex", gap: 5 }}>
          {onFullscreen && (
            <button onClick={onFullscreen} aria-label={`Fullscreen: ${title}`} title="Fullscreen" style={{ background: "none", border: `1px solid ${border}`, borderRadius: 4, color: textColor, fontSize: 11, cursor: "pointer", padding: "3px 7px", fontFamily: "monospace" }}>⛶</button>
          )}
          <button onClick={onExport} aria-label={`Export PNG: ${title}`} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 4, color: textColor, fontSize: 9, cursor: "pointer", padding: "3px 8px", fontFamily: "monospace" }}>⬇ PNG</button>
        </div>
      </div>
      {children}
    </div>
  );
});

export function FullscreenChart({ chart, onClose }) {
  if (!chart) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#0f172a", border: "1px solid #334155", borderRadius: 14,
        padding: "24px 28px", maxWidth: "90vw", width: 760, position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 2 }}>{chart.title?.toUpperCase()}</span>
          <button onClick={onClose} aria-label="Close fullscreen chart" style={{
            background: "none", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8",
            fontSize: 18, cursor: "pointer", width: 30, height: 30, display: "flex",
            alignItems: "center", justifyContent: "center", lineHeight: 1,
          }}>×</button>
        </div>
        {chart.node}
      </div>
    </div>
  );
}
