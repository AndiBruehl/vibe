"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, MessageCircle, X } from "lucide-react";

type UnreadMessageStatus = {
  count: number;
  latestUnreadAt: string | null;
};

type MessageNotificationsProps = {
  initialStatus: UnreadMessageStatus;
  initialInteractionStatus: UnreadInteractionStatus;
};

type UnreadInteractionStatus = {
  commentCount: number;
  replyCount: number;
  likeCount: number;
  mentionCount: number;
  latestUnreadAt: string | null;
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

async function fetchUnreadInteractions() {
  const response = await fetch("/api/notifications/unread", {
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as UnreadInteractionStatus;
}

function getMessageText(count: number) {
  if (count === 1) {
    return "You have a new message.";
  }

  return `You have new messages in ${count} conversations.`;
}

function getInteractionText(status: UnreadInteractionStatus) {
  const parts: string[] = [];
  if (status.commentCount) {
    parts.push(`${status.commentCount} new ${status.commentCount === 1 ? "comment" : "comments"}`);
  }
  if (status.replyCount) {
    parts.push(`${status.replyCount} ${status.replyCount === 1 ? "reply" : "replies"} to your comments`);
  }
  if (status.likeCount) {
    parts.push(`${status.likeCount} new ${status.likeCount === 1 ? "like" : "likes"}`);
  }
  if (status.mentionCount) {
    parts.push(`${status.mentionCount} new ${status.mentionCount === 1 ? "mention" : "mentions"}`);
  }
  return parts.join(" · ");
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

function dispatchUnreadInteractionStatus(status: UnreadInteractionStatus) {
  window.dispatchEvent(
    new CustomEvent("activity:unread-status", {
        detail: { count: status.commentCount + status.replyCount + status.likeCount + status.mentionCount },
    }),
  );
}

export default function MessageNotifications({
  initialStatus,
  initialInteractionStatus,
}: MessageNotificationsProps) {
  const latestUnreadAtRef = useRef(initialStatus.latestUnreadAt);
  const latestInteractionAtRef = useRef(initialInteractionStatus.latestUnreadAt);
  const [toast, setToast] = useState<UnreadMessageStatus | null>(null);
  const [interactionToast, setInteractionToast] =
    useState<UnreadInteractionStatus | null>(null);

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

      const interactions = await fetchUnreadInteractions();
      if (!interactions) return;

      dispatchUnreadInteractionStatus(interactions);

      const hasNewInteractions =
        interactions.latestUnreadAt &&
        interactions.latestUnreadAt !== latestInteractionAtRef.current;

      if (hasNewInteractions) {
        setInteractionToast(interactions);
      }

      latestInteractionAtRef.current = interactions.latestUnreadAt;
    },
    [showToast],
  );

  useEffect(() => {
    dispatchUnreadStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    dispatchUnreadInteractionStatus(initialInteractionStatus);
  }, [initialInteractionStatus]);

  useEffect(() => {
    latestInteractionAtRef.current = initialInteractionStatus.latestUnreadAt;
  }, [initialInteractionStatus]);

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

  useEffect(() => {
    if (!interactionToast) return;
    const timeout = window.setTimeout(() => setInteractionToast(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [interactionToast]);

  if (!toast && !interactionToast) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {interactionToast ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:bg-gray-900 dark:shadow-black/30">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white"><Bell size={18} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">New activity</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{getInteractionText(interactionToast)}</p>
              <Link href="/activity" className="mt-3 inline-flex text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" onClick={() => setInteractionToast(null)}>Open activity</Link>
            </div>
            <button type="button" className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label="Close notification" onClick={() => setInteractionToast(null)}><X size={16} /></button>
          </div>
        </div>
      ) : null}
      {toast ? (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:bg-gray-900 dark:shadow-black/30">
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
      ) : null}
    </div>
  );
}
