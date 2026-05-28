import { createContext, useContext } from "react";

export const ThemeCtx = createContext("dark");
export const useTheme = () => useContext(ThemeCtx);

export function Sidebar({ children, isDark }) {
  return (
    <div style={{
      width: 220, minWidth: 220, borderRight: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
      padding: "20px 16px", overflowY: "auto", height: "100%",
      background: isDark ? "#020817" : "#ffffff",
    }}>
      {children}
    </div>
  );
}
