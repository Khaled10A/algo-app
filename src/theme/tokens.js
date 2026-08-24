export const PALETTES = {
  dark: {
    bg: "#020817",
    surface: "#0f172a",
    surfaceAlt: "#0a0f1e",
    codeBg: "#0a0f1e",
    inputBg: "#0f172a",
    border: "#1e293b",
    borderStrong: "#334155",
    trackBg: "#1e293b",
    textPrimary: "#e2e8f0",
    textStrong: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    textFaint: "#475569",
    accent: "#38bdf8",
    pink: "#f472b6",
    green: "#4ade80",
    orange: "#fb923c",
    red: "#f87171",
    redStrong: "#ef4444",
    purple: "#a78bfa",
    yellow: "#fbbf24",
    indigo: "#818cf8",
    chartBg: "#0f172a",
    rowEven: "#0a0f1e",
    rowOdd: "#0f172a",
    btnBorder: "#1e293b",
    btnDisabledBg: "#1e293b",
    btnDisabledText: "#475569",
  },
  light: {
    bg: "#f8fafc",
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    codeBg: "#f1f5f9",
    inputBg: "#f1f5f9",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    trackBg: "#e2e8f0",
    textPrimary: "#1e293b",
    textStrong: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#64748b",
    textFaint: "#64748b",
    accent: "#38bdf8",
    pink: "#f472b6",
    green: "#4ade80",
    orange: "#fb923c",
    red: "#f87171",
    redStrong: "#ef4444",
    purple: "#a78bfa",
    yellow: "#d97706",
    indigo: "#818cf8",
    chartBg: "#ffffff",
    rowEven: "#f1f5f9",
    rowOdd: "#f8fafc",
    btnBorder: "#cbd5e1",
    btnDisabledBg: "#e2e8f0",
    btnDisabledText: "#94a3b8",
  },
};

export function getPalette(theme) {
  return PALETTES[theme] || PALETTES.dark;
}

export const CHART_FALLBACK_COLORS = [
  "#38bdf8",
  "#f472b6",
  "#4ade80",
  "#fb923c",
  "#a78bfa",
  "#fbbf24",
];

export function tableStyles(theme) {
  const p = getPalette(theme);
  return {
    TH: {
      padding: "8px 12px",
      textAlign: "left",
      fontSize: 10,
      letterSpacing: 1,
      color: p.textFaint,
      borderBottom: `1px solid ${p.border}`,
      fontWeight: "bold",
    },
    TD: {
      padding: "7px 12px",
      borderBottom: `1px solid ${theme === "light" ? p.border : p.surfaceAlt}`,
      color: p.textSecondary,
      fontSize: 11,
    },
    rowEven: p.rowEven,
    rowOdd: p.rowOdd,
  };
}
