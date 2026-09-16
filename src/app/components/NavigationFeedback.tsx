"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useVibeLanguage from "@/app/components/useVibeLanguage";

const LOADER_DELAY = 220;

export default function NavigationFeedback() {
  const pathname = usePathname();
  const de = useVibeLanguage() === "de";
  const [navigating, setNavigating] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const delayRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function clearTimers() {
    if (delayRef.current) window.clearTimeout(delayRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    delayRef.current = null;
    timeoutRef.current = null;
  }

  function finishNavigation() {
    clearTimers();
    setShowLoader(false);
    setNavigating(false);
  }

  function startNavigation() {
    clearTimers();
    setNavigating(true);
    setShowLoader(false);
    delayRef.current = window.setTimeout(() => setShowLoader(true), LOADER_DELAY);
    timeoutRef.current = window.setTimeout(finishNavigation, 8000);
  }

  useEffect(() => {
    const complete = window.setTimeout(finishNavigation, 120);
    return () => window.clearTimeout(complete);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href^="/"]');
      if (!link || link.target === "_blank" || link.hasAttribute("download") || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const destination = new URL(link.href, window.location.origin);
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      startNavigation();
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      clearTimers();
    };
  }, []);

  if (!navigating || !showLoader) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] grid place-items-center bg-slate-950/18 p-6 backdrop-blur-[2px] dark:bg-slate-950/45">
      <div role="status" className="vibe-loading-screen vibe-modal-enter w-full max-w-sm rounded-3xl border border-white/15 px-8 py-9 text-center shadow-2xl">
        <div aria-hidden="true" className="vibe-loader-orbit mx-auto grid size-20 place-items-center rounded-full">
          <span className="vibe-loader-core size-12 rounded-full" />
        </div>
        <p className="mt-5 text-xs font-black tracking-[0.24em] text-orange-400">VIBE</p>
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{de ? "Dein nächster Moment lädt…" : "Loading your next moment…"}</p>
        <div className="mx-auto mt-5 h-1.5 w-36 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10"><span className="vibe-loading-line block h-full rounded-full" /></div>
      </div>
    </div>
  );
}
