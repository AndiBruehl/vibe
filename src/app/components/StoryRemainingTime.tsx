"use client";

import { useEffect, useState } from "react";

export default function StoryRemainingTime({ expiresAt }: { expiresAt: string }) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [german, setGerman] = useState(false);

  useEffect(() => {
    const update = () => {
      setMinutes(Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 60000)));
      setGerman((localStorage.getItem("vibe-language") ?? document.documentElement.lang) === "de");
    };
    update();
    const timer = window.setInterval(update, 60000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [expiresAt]);

  if (minutes === null || !Number.isFinite(minutes)) return null;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const duration = hours > 0
    ? `${hours} ${german ? "Std." : "hr"}${remainder ? ` ${remainder} min` : ""}`
    : `${minutes} min`;
  return <p className="text-xs font-normal text-white/70">
    {minutes === 0 ? (german ? "Abgelaufen" : "Expired") : german ? `Noch ${duration} verfügbar` : `Available for ${duration}`}
  </p>;
}
