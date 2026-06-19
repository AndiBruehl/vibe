"use client";

import { useEffect, useRef } from "react";

type ConversationAutoScrollProps = {
  latestMessageId?: string;
};

export default function ConversationAutoScroll({
  latestMessageId,
}: ConversationAutoScrollProps) {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = markerRef.current;
    if (!el) return;

    const scrollToBottom = () => {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      } catch {}

      let parent: HTMLElement | null = el.parentElement;
      while (parent) {
        const style = getComputedStyle(parent);
        const overflowY = style.overflowY;
        const isScrollable =
          parent.scrollHeight > parent.clientHeight &&
          (overflowY === "auto" || overflowY === "scroll");
        if (isScrollable) {
          // Force the scroll to absolute bottom to avoid markers hidden by sticky footer
          parent.scrollTop = parent.scrollHeight - parent.clientHeight;
          break;
        }
        parent = parent.parentElement;
      }
    };

    // Run on next frame and again after a short delay to ensure layout is settled
    requestAnimationFrame(() => setTimeout(scrollToBottom, 50));
  }, [latestMessageId]);

  return <div ref={markerRef} aria-hidden="true" />;
}
