"use client";

import { useEffect, useState } from "react";

type MessageUnreadBadgeProps = {
  initialCount: number;
  className: string;
};

type UnreadStatusEvent = CustomEvent<{
  count: number;
}>;

export default function MessageUnreadBadge({
  initialCount,
  className,
}: MessageUnreadBadgeProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const handleUnreadStatus = (event: Event) => {
      setCount((event as UnreadStatusEvent).detail.count);
    };

    window.addEventListener("messages:unread-status", handleUnreadStatus);

    return () =>
      window.removeEventListener("messages:unread-status", handleUnreadStatus);
  }, []);

  if (count <= 0) {
    return null;
  }

  return (
    <span className={className}>
      {count > 9 ? "9+" : count}
    </span>
  );
}
