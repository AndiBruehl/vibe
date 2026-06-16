"use client";

import { useState, useTransition } from "react";

type Props = {
  topicId?: string;
  slug?: string;
  initiallyFollowing?: boolean;
};

export default function TopicFollowButton({
  topicId,
  slug,
  initiallyFollowing = false,
}: Props) {
  const [isFollowing, setIsFollowing] = useState<boolean>(initiallyFollowing);
  const [isPending, startTransition] = useTransition();

  async function handle(action: "follow" | "unfollow") {
    if (!topicId && !slug) return;

    // optimistic
    setIsFollowing(action === "follow");

    startTransition(async () => {
      try {
        const res = await fetch(`/api/topics/${action}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ topicId, slug }),
        });

        if (!res.ok) {
          // revert on error
          setIsFollowing((prev) => !prev);
          console.error("TopicFollow error", await res.text());
        }
      } catch (err) {
        setIsFollowing((prev) => !prev);
        console.error(err);
      }
    });
  }

  return (
    <div>
      {isFollowing ? (
        <button
          onClick={() => handle("unfollow")}
          disabled={isPending}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white hover:bg-white/10"
        >
          {isPending ? "..." : "Following"}
        </button>
      ) : (
        <button
          onClick={() => handle("follow")}
          disabled={isPending}
          className="rounded-2xl bg-linear-to-r from-red-500 to-yellow-500 px-3 py-1 text-sm font-semibold text-white hover:scale-[1.02]"
        >
          {isPending ? "..." : "Follow"}
        </button>
      )}
    </div>
  );
}
