"use client";

import { useEffect, useState } from "react";

type ActivityUnreadBadgeProps = {
  initialCount: number;
  className: string;
};

export default function ActivityUnreadBadge({
  initialCount,
  className,
}: ActivityUnreadBadgeProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const handleStatus = (event: Event) => {
      setCount((event as CustomEvent<{ count: number }>).detail.count);
    };

    window.addEventListener("activity:unread-status", handleStatus);
    return () => window.removeEventListener("activity:unread-status", handleStatus);
  }, []);

  if (count <= 0) return null;
  return <span className={className}>{count > 9 ? "9+" : count}</span>;
}
