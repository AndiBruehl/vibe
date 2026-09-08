"use client";

import type { Post, PostLike } from "@prisma/client";
import LikeButton from "./LikeButton";

export default function LikesInfo({ post, sessionLike, showText = true }: {
  post: Post; sessionLike: PostLike | null; showText?: boolean;
}) {
  return <LikeButton key={post.id} postId={post.id} initialLiked={!!sessionLike}
    initialLikes={post.likesCount} showCount={showText} showText={showText} />;
}
