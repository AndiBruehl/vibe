"use client";

import { CheckCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActivityReadControl({ unreadCount, de }: { unreadCount: number; de: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!unreadCount) return null;

  async function markAllRead() {
    setPending(true);
    try {
      const response = await fetch("/api/notifications/unread", { method: "PATCH", cache: "no-store" });
      if (!response.ok) return;
      window.dispatchEvent(new CustomEvent("activity:unread-status", { detail: { count: 0 } }));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={() => void markAllRead()} disabled={pending} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-400 dark:hover:text-orange-300">
      {pending ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCheck size={16} />}
      {de ? "Alles gelesen" : "Mark all read"}
    </button>
  );
}
