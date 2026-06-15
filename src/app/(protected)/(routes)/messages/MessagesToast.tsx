"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function MessagesToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const msg = searchParams.get("msg");

  useEffect(() => {
    if (msg === "group-deleted") {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        // remove query param without reload
        const url = new URL(window.location.href);
        url.searchParams.delete("msg");
        window.history.replaceState({}, "", url.toString());
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [msg, router]);

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-4 z-50 rounded bg-green-600 px-4 py-2 text-sm text-white shadow">
      Group deleted
    </div>
  );
}
