"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { likeComment } from "@/actions";

type CommentLikeButtonProps = {
  commentId: string;
  postId: string;
  initialLiked: boolean;
  initialLikes: number;
};

type OptimisticState = {
  liked: boolean;
  likes: number;
};

export default function CommentLikeButton({
  commentId,
  postId,
  initialLiked,
  initialLikes,
}: CommentLikeButtonProps) {
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
    formData.append("commentId", commentId);
    formData.append("postId", postId);

    startTransition(async () => {
      setOptimisticState();

      try {
        await likeComment(formData);
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
      className="inline-flex items-center gap-1 text-xs text-gray-500 transition hover:text-gray-700 disabled:opacity-60 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <Heart
        className={`size-4 transition ${
          optimisticState.liked
            ? "fill-red-500 text-red-500"
            : "fill-transparent"
        }`}
      />
      <span>{optimisticState.likes}</span>
    </button>
  );
}
