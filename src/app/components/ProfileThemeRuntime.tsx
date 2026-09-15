"use client";

import { useEffect } from "react";

export type ThemePreference = "light" | "dark" | "system";

function resolveTheme(preference: ThemePreference) {
  return preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : preference === "system" ? "light" : preference;
}

export function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  html.classList.add(resolved);
  html.dataset.theme = resolved;
}

export default function ProfileThemeRuntime({ initialTheme }: { initialTheme: ThemePreference }) {
  useEffect(() => {
    localStorage.setItem("theme", initialTheme);
    applyTheme(initialTheme);
    if (initialTheme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [initialTheme]);

  return null;
}
