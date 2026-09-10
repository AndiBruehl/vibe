"use client";

import { useEffect } from "react";

export default function MarkActivityRead() {
  useEffect(() => {
    void fetch("/api/notifications/unread", {
      method: "PATCH",
      cache: "no-store",
    }).then((response) => {
      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("activity:unread-status", { detail: { count: 0 } }),
        );
      }
    });
  }, []);

  return null;
}
