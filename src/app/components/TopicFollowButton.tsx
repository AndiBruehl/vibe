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
  const [following, setFollowing] = useState<boolean>(initiallyFollowing);
  const [isPending, startTransition] = useTransition();

  async function toggle() {
    startTransition(async () => {
      try {
        const url = following ? "/api/topics/unfollow" : "/api/topics/follow";
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ topicId, slug }),
        });

        if (!res.ok) {
          console.error("Topic follow/unfollow failed", await res.text());
          return;
        }

        setFollowing((s) => !s);
      } catch (err) {
        console.error("TopicFollowButton error", err);
      }
    });
  }

  return (
    <button
      onClick={() => toggle()}
      disabled={isPending}
      className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition 
        ${following ? "bg-slate-200 text-slate-800" : "bg-slate-800 text-white"}`}
    >
      {isPending ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
