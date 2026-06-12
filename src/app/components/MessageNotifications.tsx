"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";

type UnreadMessageStatus = {
  count: number;
  latestUnreadAt: string | null;
};

type MessageNotificationsProps = {
  initialStatus: UnreadMessageStatus;
};

async function fetchUnreadStatus() {
  const response = await fetch("/api/messages/unread", {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as UnreadMessageStatus;
}

function getMessageText(count: number) {
  if (count === 1) {
    return "You have a new message.";
  }

  return `You have new messages in ${count} conversations.`;
}

function dispatchUnreadStatus(status: UnreadMessageStatus) {
  window.dispatchEvent(
    new CustomEvent("messages:unread-status", {
      detail: {
        count: status.count,
        latestUnreadAt: status.latestUnreadAt,
      },
    }),
  );
}

export default function MessageNotifications({
  initialStatus,
}: MessageNotificationsProps) {
  const latestUnreadAtRef = useRef(initialStatus.latestUnreadAt);
  const [toast, setToast] = useState<UnreadMessageStatus | null>(null);

  const showToast = useCallback((status: UnreadMessageStatus) => {
    if (status.count <= 0) {
      setToast(null);
      return;
    }

    setToast(status);
  }, []);

  const checkUnreadStatus = useCallback(
    async (showExistingUnread: boolean) => {
      const status = await fetchUnreadStatus();

      if (!status) {
        return;
      }

      dispatchUnreadStatus(status);

      const latestUnreadAt = status.latestUnreadAt;
      const hasNewUnread =
        latestUnreadAt && latestUnreadAt !== latestUnreadAtRef.current;

      if (showExistingUnread || hasNewUnread) {
        showToast(status);
      }

      latestUnreadAtRef.current = latestUnreadAt;
    },
    [showToast],
  );

  useEffect(() => {
    dispatchUnreadStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void checkUnreadStatus(false);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [checkUnreadStatus]);

  useEffect(() => {
    const handleFocus = () => {
      void checkUnreadStatus(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkUnreadStatus(false);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkUnreadStatus]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const internalLink = target.closest('a[href^="/"]');

      if (internalLink) {
        void checkUnreadStatus(false);
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => document.removeEventListener("click", handleClick, true);
  }, [checkUnreadStatus]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[80] w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:bg-gray-900 dark:shadow-black/30">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white">
          <MessageCircle size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            New messages
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {getMessageText(toast.count)}
          </p>
          <Link
            href="/messages"
            className="mt-3 inline-flex text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            onClick={() => setToast(null)}
          >
            Open messages
          </Link>
        </div>

        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Close notification"
          onClick={() => setToast(null)}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
