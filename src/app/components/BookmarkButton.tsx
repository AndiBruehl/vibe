"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { togglePostBookmark } from "@/actions";

type BookmarkButtonProps = {
  postId: string;
  initialBookmarked: boolean;
};

type OptimisticState = {
  bookmarked: boolean;
};

export default function BookmarkButton({
  postId,
  initialBookmarked,
}: BookmarkButtonProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticState, setOptimisticState] = useOptimistic<
    OptimisticState,
    void
  >(
    {
      bookmarked: initialBookmarked,
    },
    (state) => ({
      bookmarked: !state.bookmarked,
    }),
  );

  function handleClick() {
    const formData = new FormData();
    formData.append("postId", postId);

    startTransition(async () => {
      setOptimisticState();

      try {
        await togglePostBookmark(formData);
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
      className="inline-flex items-center justify-center rounded-full p-2 transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
      aria-label={
        optimisticState.bookmarked ? "Remove bookmark" : "Add bookmark"
      }
      title={optimisticState.bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <Bookmark
        className={`size-5 transition ${
          optimisticState.bookmarked
            ? "fill-white text-white dark:fill-white dark:text-white"
            : "fill-transparent text-black dark:text-white"
        }`}
      />
    </button>
  );
}
