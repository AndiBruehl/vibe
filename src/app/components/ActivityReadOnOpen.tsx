"use client";

import { useEffect } from "react";

/** Marks the activity inbox read when its page becomes visible. */
export default function ActivityReadOnOpen() {
  useEffect(() => {
    let cancelled = false;

    void fetch("/api/notifications/unread", { method: "PATCH", cache: "no-store" })
      .then((response) => {
        if (response.ok && !cancelled) {
          window.dispatchEvent(new CustomEvent("activity:unread-status", { detail: { count: 0 } }));
        }
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, []);

  return null;
}
