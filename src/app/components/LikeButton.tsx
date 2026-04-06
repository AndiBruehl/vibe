"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { togglePostLike } from "@/actions";

type LikeButtonProps = {
  postId: string;
  initialLiked: boolean;
  initialLikes: number;
};

type OptimisticState = {
  liked: boolean;
  likes: number;
};

export default function LikeButton({
  postId,
  initialLiked,
  initialLikes,
}: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticState, setOptimisticState] = useOptimistic<
    OptimisticState,
    void
  >(
    {
      liked: initialLiked,
      likes: initialLikes,
    },
    (state) => ({
      liked: !state.liked,
      likes: state.liked ? state.likes - 1 : state.likes + 1,
    }),
  );

  function handleClick() {
    const formData = new FormData();
    formData.append("postId", postId);

    startTransition(async () => {
      setOptimisticState();

      try {
        await togglePostLike(formData);
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
    >
      <Heart
        className={`size-5 transition ${
          optimisticState.liked
            ? "fill-red-500 text-red-500"
            : "fill-transparent text-white dark:text-white"
        }`}
      />
      <span className="font-medium text-gray-900 dark:text-white">
        {optimisticState.likes}
      </span>
    </button>
  );
}
