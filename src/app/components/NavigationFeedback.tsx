"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavigationFeedback() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const complete = window.setTimeout(() => setNavigating(false), 160);
    return () => window.clearTimeout(complete);
  }, [pathname]);

  useEffect(() => {
    const startNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>('a[href^="/"]');
      if (
        !link ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const destination = new URL(link.href, window.location.origin);
      if (destination.pathname === window.location.pathname && !destination.search) {
        return;
      }

      setNavigating(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setNavigating(false), 8000);
    };

    document.addEventListener("click", startNavigation, true);
    return () => {
      document.removeEventListener("click", startNavigation, true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!navigating) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
      <div className="h-1 overflow-hidden bg-slate-200/70 dark:bg-slate-700/70">
        <div className="h-full w-[78%] animate-[vibe-navigation-progress_900ms_ease-out_infinite] rounded-r-full bg-linear-to-r from-orange-500 via-red-500 to-pink-500" />
      </div>
      <div className="absolute right-4 top-3 flex size-8 items-center justify-center rounded-full bg-slate-950/75 text-white shadow-lg backdrop-blur-sm dark:bg-slate-800/80">
        <LoaderCircle className="size-4 animate-spin" />
      </div>
    </div>
  );
}
