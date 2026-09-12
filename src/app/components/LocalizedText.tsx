"use client";

import useVibeLanguage from "@/app/components/useVibeLanguage";

export default function LocalizedText({ en, de }: { en: string; de: string }) {
  return <>{useVibeLanguage() === "de" ? de : en}</>;
}
