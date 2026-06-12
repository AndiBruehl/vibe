"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type ConversationLiveRefreshProps = {
  conversationId: string;
  initialLatestMessageAt: string | null;
  initialMessageCount: number;
};

type ConversationStatus = {
  latestMessageAt: string | null;
  messageCount: number;
};

async function fetchConversationStatus(conversationId: string) {
  const response = await fetch(`/api/messages/${conversationId}/status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ConversationStatus;
}

export default function ConversationLiveRefresh({
  conversationId,
  initialLatestMessageAt,
  initialMessageCount,
}: ConversationLiveRefreshProps) {
  const router = useRouter();
  const latestMessageAtRef = useRef(initialLatestMessageAt);
  const messageCountRef = useRef(initialMessageCount);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    latestMessageAtRef.current = initialLatestMessageAt;
    messageCountRef.current = initialMessageCount;
    isRefreshingRef.current = false;
  }, [initialLatestMessageAt, initialMessageCount]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (document.visibilityState !== "visible" || isRefreshingRef.current) {
        return;
      }

      const status = await fetchConversationStatus(conversationId);

      if (!status) {
        return;
      }

      const hasChanged =
        status.latestMessageAt !== latestMessageAtRef.current ||
        status.messageCount !== messageCountRef.current;

      latestMessageAtRef.current = status.latestMessageAt;
      messageCountRef.current = status.messageCount;

      if (hasChanged) {
        isRefreshingRef.current = true;
        router.refresh();
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [conversationId, router]);

  return null;
}
