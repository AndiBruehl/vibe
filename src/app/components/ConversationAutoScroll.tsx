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
    markerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [latestMessageId]);

  return <div ref={markerRef} aria-hidden="true" />;
}
