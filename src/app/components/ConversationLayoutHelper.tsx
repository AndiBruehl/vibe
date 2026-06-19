"use client";

import { useEffect } from "react";

export default function ConversationLayoutHelper() {
  useEffect(() => {
    const messagesEl = document.querySelector<HTMLElement>(
      ".conversation-messages",
    );
    const composerEl = document.querySelector<HTMLElement>(
      ".conversation-composer",
    );

    if (!messagesEl || !composerEl) return;

    // Apply padding-bottom to messages container equal to composer height
    const applyPadding = () => {
      const h = composerEl.offsetHeight || 0;
      messagesEl.style.paddingBottom = `${h + 12}px`;
    };

    applyPadding();

    // ResizeObserver for composer size changes
    const ro = new ResizeObserver(() => {
      applyPadding();
    });
    ro.observe(composerEl);

    // Also update on window resize
    const onResize = () => applyPadding();
    window.addEventListener("resize", onResize);

    // robust scroll helper: try scrolling container, else fallback to window
    const scrollToBottom = () => {
      const tryScroll = () => {
        if (!messagesEl) return;

        // If container is scrollable, scroll it
        if (messagesEl.scrollHeight > messagesEl.clientHeight) {
          messagesEl.scrollTop = messagesEl.scrollHeight;
          return true;
        }

        // fallback: scroll page to bottom
        const docHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        );
        window.scrollTo({ top: docHeight, behavior: "smooth" });
        return false;
      };

      // attempt multiple times to account for layout/hydration timing
      tryScroll();
      requestAnimationFrame(() => tryScroll());
      setTimeout(() => tryScroll(), 50);
      setTimeout(() => tryScroll(), 150);
    };

    // MutationObserver to auto-scroll to bottom when new messages arrive
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length > 0) {
          requestAnimationFrame(() => scrollToBottom());
          break;
        }
      }
    });
    mo.observe(messagesEl, { childList: true, subtree: true });

    // Initial scroll on mount
    requestAnimationFrame(() => scrollToBottom());

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
