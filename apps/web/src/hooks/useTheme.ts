import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function getEffectiveTheme(): "light" | "dark" {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "system" || !stored) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return stored;
}

function applyTheme(effective: "light" | "dark") {
  document.documentElement.dataset.theme = effective;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", effective === "dark" ? "#0f172a" : "#f8fafc");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
  });
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(getEffectiveTheme);

  useEffect(() => {
    const effective = getEffectiveTheme();
    applyTheme(effective);
    setEffectiveTheme(effective);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "system" || !stored) {
        const effective = media.matches ? "dark" : "light";
        applyTheme(effective);
        setEffectiveTheme(effective);
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const setTheme = (value: Theme) => {
    localStorage.setItem(STORAGE_KEY, value);
    setThemeState(value);
  };

  return { theme, setTheme, effectiveTheme };
}
