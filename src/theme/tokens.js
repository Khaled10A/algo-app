export const PALETTES = {
  dark: {
    bg: "#1e1e20",
    surface: "#28282a",
    surfaceAlt: "#232325",
    codeBg: "#202022",
    inputBg: "#28282a",
    sidebar: "rgba(30, 30, 32, 0.78)",
    toolbar: "rgba(30, 30, 32, 0.72)",
    border: "rgba(255, 255, 255, 0.065)",
    borderStrong: "rgba(255, 255, 255, 0.13)",
    trackBg: "rgba(255, 255, 255, 0.09)",
    textPrimary: "#f5f5f7",
    textStrong: "#ffffff",
    textSecondary: "rgba(235, 235, 245, 0.65)",
    textMuted: "rgba(235, 235, 245, 0.50)",
    textFaint: "rgba(235, 235, 245, 0.42)",
    accent: "#0a84ff",
    accentText: "#409cff",
    accentTint: "rgba(10, 132, 255, 0.16)",
    pink: "#ff375f",
    green: "#30d158",
    orange: "#ff9f0a",
    red: "#ff453a",
    redStrong: "#ff6961",
    purple: "#bf5af2",
    yellow: "#ffd60a",
    indigo: "#5e5ce6",
    teal: "#64d2ff",
    chartBg: "#28282a",
    rowEven: "#232325",
    rowOdd: "#28282a",
    btnBorder: "rgba(255, 255, 255, 0.12)",
    btnDisabledBg: "rgba(255, 255, 255, 0.08)",
    btnDisabledText: "rgba(235, 235, 245, 0.35)",
    shadowCard: "0 1px 2px rgba(0, 0, 0, 0.22), 0 6px 20px rgba(0, 0, 0, 0.14)",
    shadowFloat:
      "0 4px 12px rgba(0, 0, 0, 0.22), 0 14px 36px rgba(0, 0, 0, 0.18)",
    shadowPopover:
      "0 12px 32px rgba(0, 0, 0, 0.38), 0 32px 80px rgba(0, 0, 0, 0.42)",
    scrim: "rgba(0, 0, 0, 0.42)",
    onAccent: "#ffffff",
  },
  light: {
    bg: "#f5f5f7",
    surface: "#ffffff",
    surfaceAlt: "#f5f5f7",
    codeBg: "#f2f2f5",
    inputBg: "#ffffff",
    sidebar: "rgba(246, 246, 248, 0.80)",
    toolbar: "rgba(250, 250, 252, 0.75)",
    border: "rgba(0, 0, 0, 0.055)",
    borderStrong: "rgba(0, 0, 0, 0.11)",
    trackBg: "rgba(0, 0, 0, 0.06)",
    textPrimary: "#1d1d1f",
    textStrong: "#000000",
    textSecondary: "rgba(60, 60, 67, 0.72)",
    textMuted: "rgba(60, 60, 67, 0.55)",
    textFaint: "rgba(60, 60, 67, 0.42)",
    accent: "#0071e3",
    accentText: "#0071e3",
    accentTint: "rgba(0, 113, 227, 0.10)",
    pink: "#e8386d",
    green: "#1f9d48",
    orange: "#c93400",
    red: "#d70015",
    redStrong: "#e02020",
    purple: "#8944ab",
    yellow: "#b25000",
    indigo: "#5856d6",
    teal: "#0e7490",
    chartBg: "#ffffff",
    rowEven: "#f7f7f9",
    rowOdd: "#ffffff",
    btnBorder: "rgba(0, 0, 0, 0.14)",
    btnDisabledBg: "rgba(0, 0, 0, 0.05)",
    btnDisabledText: "rgba(60, 60, 67, 0.4)",
    shadowCard: "0 1px 2px rgba(0, 0, 0, 0.05), 0 6px 20px rgba(0, 0, 0, 0.06)",
    shadowFloat:
      "0 4px 12px rgba(0, 0, 0, 0.06), 0 14px 36px rgba(0, 0, 0, 0.08)",
    shadowPopover:
      "0 12px 32px rgba(0, 0, 0, 0.12), 0 32px 80px rgba(0, 0, 0, 0.16)",
    scrim: "rgba(0, 0, 0, 0.32)",
    onAccent: "#ffffff",
  },
};

export function getPalette(theme) {
  return PALETTES[theme] || PALETTES.dark;
}

export const CHART_FALLBACK_COLORS = [
  "#0a84ff",
  "#ff375f",
  "#30d158",
  "#ff9f0a",
  "#bf5af2",
  "#64d2ff",
];

export const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif';
export const FONT_MONO =
  'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export function tableStyles(theme) {
  const p = getPalette(theme);
  return {
    TH: {
      padding: "8px 12px",
      textAlign: "left",
      fontSize: 11,
      fontWeight: 600,
      color: p.textSecondary,
      borderBottom: `1px solid ${p.borderStrong}`,
    },
    TD: {
      padding: "8px 12px",
      borderBottom: `1px solid ${p.border}`,
      color: p.textPrimary,
      fontSize: 12,
    },
    rowEven: p.rowEven,
    rowOdd: p.rowOdd,
  };
}

export const MOTION = {
  fast: "0.15s cubic-bezier(0.25, 0.1, 0.25, 1)",
  base: "0.24s cubic-bezier(0.22, 1, 0.36, 1)",
  spring: "0.28s cubic-bezier(0.34, 1.28, 0.64, 1)",
};
