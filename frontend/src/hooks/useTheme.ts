import { useState, useEffect, useCallback } from "react";
import { THEME_STORAGE_KEY } from "../config/runtime";

/**
 * Persists the chosen theme (light / dark / navy) so it survives reloads and applies to the whole app.
 */
export type Theme = "light" | "dark" | "dark-navy";

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (v === "dark" || v === "light" || v === "dark-navy") return v;
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(readTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return { theme, setTheme };
}
