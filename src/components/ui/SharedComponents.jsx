import { forwardRef } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { getPalette, MOTION } from "../../theme/tokens";

export function Sec({ title, children }) {
  const th = useTheme();
  const p = getPalette(th);
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSecondary,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div role="group" aria-label={title} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

const hiddenInputStyle = {
  position: "absolute",
  clipPath: "inset(50%)",
  width: 14,
  height: 14,
  margin: 0,
};

export function Chk({ label, checked, onChange, radio, groupName }) {
  const th = useTheme();
  const p = getPalette(th);
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", userSelect: "none", minHeight: 22 }}>
      <input
        type={radio ? "radio" : "checkbox"}
        name={radio ? groupName : undefined}
        checked={checked}
        onChange={onChange}
        className="chk-input"
        style={hiddenInputStyle}
      />
      <span
        aria-hidden="true"
        style={{
          width: 15,
          height: 15,
          borderRadius: radio ? "50%" : 4,
          border: checked ? "none" : `1px solid ${p.borderStrong}`,
          background: checked ? p.accent : p.surface,
          boxShadow: checked ? "none" : `inset 0 1px 2px rgba(0,0,0,0.06)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: `background ${MOTION.fast}, border-color ${MOTION.fast}`,
        }}
      >
        {checked &&
          (radio ? (
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.onAccent }} />
          ) : (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6.2 4.8 9 10 3.4" stroke={p.onAccent} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
      </span>
      <span style={{ fontSize: 13, color: checked ? p.textPrimary : p.textSecondary, transition: `color ${MOTION.fast}` }}>
        {label}
      </span>
    </label>
  );
}

export function SInput({ value, onChange, placeholder, hint, label }) {
  const th = useTheme();
  const p = getPalette(th);
  return (
    <div>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label || placeholder || "input"}
        style={{
          width: "100%",
          background: p.inputBg,
          border: `1px solid ${p.borderStrong}`,
          borderRadius: 6,
          padding: "7px 10px",
          color: p.textPrimary,
          fontSize: 13,
          boxSizing: "border-box",
          outline: "none",
          transition: `border-color ${MOTION.fast}, box-shadow ${MOTION.fast}`,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = p.accent;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${p.accentTint}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = p.borderStrong;
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {hint && <div style={{ fontSize: 11, color: p.textSecondary, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function RunBtn({ onClick, onCancel, running, label }) {
  const th = useTheme();
  const p = getPalette(th);

  if (running && onCancel) {
    return (
      <button
        onClick={onCancel}
        aria-label="Cancel benchmark"
        style={{
          width: "100%",
          padding: "9px 10px",
          borderRadius: 7,
          border: "none",
          background: "transparent",
          color: p.red,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 0,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 69, 58, 0.10)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        CANCEL
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={running}
      style={{
        width: "100%",
        padding: "9px 10px",
        borderRadius: 7,
        border: "none",
        background: running ? p.btnDisabledBg : p.accent,
        color: running ? p.btnDisabledText : p.onAccent,
        fontSize: 13,
        fontWeight: 600,
        cursor: running ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: `filter ${MOTION.fast}, transform ${MOTION.fast}`,
      }}
      onMouseEnter={(e) => {
        if (!running) e.currentTarget.style.filter = "brightness(1.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "none";
      }}
      onMouseDown={(e) => {
        if (!running) e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "none";
      }}
    >
      {running ? "Running…" : label || "RUN BENCHMARK"}
    </button>
  );
}

export function GhostBtn({ onClick, label, color }) {
  const th = useTheme();
  const p = getPalette(th);
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "7px 10px",
        borderRadius: 7,
        border: `1px solid ${p.btnBorder}`,
        background: p.surface,
        color: color || p.textPrimary,
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        marginTop: 6,
        fontFamily: "inherit",
        transition: `background ${MOTION.fast}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = p.trackBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = p.surface)}
    >
      {label}
    </button>
  );
}

export function Label({ color, children }) {
  const th = useTheme();
  const p = getPalette(th);
  return (
    <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: color || p.textPrimary, marginBottom: 14 }}>
      {children}
    </div>
  );
}

export function Empty({ icon, text }) {
  const th = useTheme();
  const p = getPalette(th);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "55vh",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 40, opacity: 0.5 }} aria-hidden="true">
        {icon}
      </div>
      <div style={{ fontSize: 13, color: p.textSecondary }}>{text}</div>
    </div>
  );
}

export const ChartBox = forwardRef(({ title, children, onExport, onFullscreen }, ref) => {
  const th = useTheme();
  const p = getPalette(th);
  return (
    <div
      ref={ref}
      style={{
        background: p.surface,
        borderRadius: 10,
        border: `1px solid ${p.border}`,
        boxShadow: p.shadowCard,
        padding: "12px 14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: p.textSecondary }}>{title}</div>
        <div style={{ display: "flex", gap: 5 }}>
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              aria-label={`Fullscreen: ${title}`}
              title="Fullscreen"
              style={{
                background: "none",
                border: `1px solid ${p.btnBorder}`,
                borderRadius: 5,
                color: p.textSecondary,
                fontSize: 11,
                cursor: "pointer",
                padding: "3px 7px",
                transition: `background ${MOTION.fast}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = p.trackBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              ⛶
            </button>
          )}
          <button
            onClick={onExport}
            aria-label={`Export PNG: ${title}`}
            style={{
              background: "none",
              border: `1px solid ${p.btnBorder}`,
              borderRadius: 5,
              color: p.textSecondary,
              fontSize: 11,
              cursor: "pointer",
              padding: "3px 8px",
              transition: `background ${MOTION.fast}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = p.trackBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Export
          </button>
        </div>
      </div>
      {children}
    </div>
  );
});

export function FullscreenChart({ chart, onClose }) {
  const th = useTheme();
  const p = getPalette(th);
  if (!chart) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: p.scrim,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: p.surface,
          borderRadius: 14,
          boxShadow: p.shadowPopover,
          padding: "22px 26px",
          maxWidth: "90vw",
          width: 780,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: p.textPrimary }}>{chart.title}</span>
          <button
            onClick={onClose}
            aria-label="Close fullscreen chart"
            style={{
              background: "none",
              border: `1px solid ${p.btnBorder}`,
              borderRadius: 6,
              color: p.textSecondary,
              fontSize: 16,
              cursor: "pointer",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {chart.node}
      </div>
    </div>
  );
}

export function BenchmarkError({ message }) {
  const th = useTheme();
  const p = getPalette(th);
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        marginTop: 8,
        padding: "9px 11px",
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.5,
        background: "rgba(255, 59, 48, 0.08)",
        border: `1px solid ${p.red}55`,
        color: p.red,
        wordBreak: "break-word",
      }}
    >
      {message}
    </div>
  );
}
