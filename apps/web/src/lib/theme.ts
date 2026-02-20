import type { Theme } from "../hooks/useTheme";

const STORAGE_KEY = "theme";

function getEffectiveTheme(): "light" | "dark" {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (!stored) return "dark";
  if (stored === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return stored;
}

export function initTheme() {
  const effective = getEffectiveTheme();
  document.documentElement.dataset.theme = effective;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", effective === "dark" ? "#0e0f13" : "#f6f7fb");
  }
}
