"use client";
import { useEffect } from "react";

export default function SessionRevocation() {
  useEffect(() => {
    let stopped = false;
    let pending = false;
    const controller = new AbortController();
    async function check() {
      if (pending || stopped) return;
      pending = true;
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) });
        if (!response.ok) return;
        const session = await response.json();
        if (!stopped && !session?.user) window.location.replace("/join?notice=session-expired");
      } catch { /* Retry after connectivity returns. */ }
      finally { pending = false; }
    }
    void check();
    const timer = window.setInterval(() => void check(), 5000);
    const focus = () => { void check(); };
    window.addEventListener("focus", focus);
    return () => { stopped = true; controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, []);
  return null;
}
