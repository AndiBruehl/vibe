"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CommentLikeButton from "./CommentLikeButton";
import ReplyForm from "./ReplyForm";

type Author = {
  username: string | null;
  name: string | null;
  avatar: string | null;
};

type Reply = {
  id: string;
  text: string;
  createdAt: Date;
  author: Author;
  likesCount: number;
  isLikedByViewer: boolean;
};

type CommentData = {
  id: string;
  text: string;
  createdAt: Date;
  author: Author;
  likesCount: number;
  isLikedByViewer: boolean;
  replies: Reply[];
};

type CommentItemProps = {
  comment: CommentData;
  postId: string;
  isReply?: boolean;
};

export default function CommentItem({
  comment,
  postId,
  isReply = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const profileHref = comment.author.username
    ? `/profile/${comment.author.username}`
    : null;

  return (
    <div
      className={
        isReply ? "ml-8 border-l border-gray-200 pl-4 dark:border-gray-700" : ""
      }
    >
      <article className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          {profileHref ? (
            <Link
              href={profileHref}
              className="block shrink-0 transition-opacity hover:opacity-90"
            >
              <div className="size-10 overflow-hidden rounded-full bg-gray-300">
                {comment.author.avatar ? (
                  <Image
                    src={comment.author.avatar}
                    alt={comment.author.name || "author"}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
            </Link>
          ) : (
            <div className="size-10 shrink-0 overflow-hidden rounded-full bg-gray-300">
              {comment.author.avatar ? (
                <Image
                  src={comment.author.avatar}
                  alt={comment.author.name || "author"}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : null}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="font-semibold text-gray-900 transition hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
                >
                  {comment.author.name || "Unknown"}
                </Link>
              ) : (
                <p className="font-semibold text-gray-900 dark:text-white">
                  {comment.author.name || "Unknown"}
                </p>
              )}

              {profileHref ? (
                <Link
                  href={profileHref}
                  className="text-sm text-gray-500 transition hover:text-slate-700 dark:text-gray-400 dark:hover:text-slate-300"
                >
                  @{comment.author.username}
                </Link>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{comment.author.username || "user"}
                </p>
              )}

              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
              {comment.text}
            </p>

            <div className="mt-3 flex items-center gap-4">
              <CommentLikeButton
                commentId={comment.id}
                postId={postId}
                initialLiked={comment.isLikedByViewer}
                initialLikes={comment.likesCount}
              />

              {!isReply ? (
                <button
                  type="button"
                  onClick={() => setShowReplyForm((prev) => !prev)}
                  className="text-xs font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showReplyForm ? "Cancel" : "Reply"}
                </button>
              ) : null}
            </div>

            {!isReply && showReplyForm ? (
              <ReplyForm postId={postId} parentCommentId={comment.id} />
            ) : null}
          </div>
        </div>
      </article>

      {!isReply && comment.replies.length > 0 ? (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={{
                ...reply,
                replies: [],
              }}
              postId={postId}
              isReply
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
