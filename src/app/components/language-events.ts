"use client";

import type { VibeLanguage } from "@/app/components/useVibeLanguage";

export function applyVibeLanguage(language: VibeLanguage) {
  localStorage.setItem("vibe-language", language);
  document.documentElement.lang = language;
  window.dispatchEvent(new CustomEvent<VibeLanguage>("vibe-language-change", { detail: language }));
}
