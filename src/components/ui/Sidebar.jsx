import { createContext, useContext } from "react";

export const ThemeCtx = createContext("dark");
export const useTheme = () => useContext(ThemeCtx);
