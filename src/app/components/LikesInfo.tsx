"use client";

import { togglePostLike } from "@/actions";
import { Post, PostLike } from "@prisma/client";
import { HeartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LikesInfo({
  post,
  sessionLike,
  showText = true,
}: {
  post: Post;
  sessionLike: PostLike | null;
  showText?: boolean;
}) {
  const router = useRouter();
  const [likedByMe, setLikedByMe] = useState(!!sessionLike);
  const [isPending, setIsPending] = useState(false);

  return (
    <form
      action={async (data: FormData) => {
        if (isPending) return;

        setIsPending(true);
        setLikedByMe((prev) => !prev);

        try {
          await togglePostLike(data);
          router.refresh();
        } catch (error) {
          setLikedByMe((prev) => !prev);
          throw error;
        } finally {
          setIsPending(false);
        }
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="postId" value={post.id} />

      <button type="submit" disabled={isPending}>
        <HeartIcon
          className={
            likedByMe
              ? "fill-red-500 text-red-500"
              : "text-white dark:text-white"
          }
        />
      </button>

      {showText && <p>{post.likesCount} people like this</p>}
    </form>
  );
}
