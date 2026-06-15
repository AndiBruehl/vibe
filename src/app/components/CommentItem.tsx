"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CommentLikeButton from "./CommentLikeButton";
import ReplyForm from "./ReplyForm";
import { deleteComment, editComment } from "@/actions";

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
  isOwned: boolean;
};

type CommentData = {
  id: string;
  text: string;
  createdAt: Date;
  author: Author;
  likesCount: number;
  isLikedByViewer: boolean;
  isOwned: boolean;
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
  const [isEditing, setIsEditing] = useState(false);

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

            {!isEditing ? (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                {comment.text}
              </p>
            ) : null}

            {isEditing ? (
              <form action={editComment} className="mt-3 space-y-3">
                <input type="hidden" name="commentId" value={comment.id} />
                <input type="hidden" name="postId" value={postId} />

                <textarea
                  name="text"
                  defaultValue={comment.text}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-slate-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  required
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <CommentLikeButton
                commentId={comment.id}
                postId={postId}
                initialLiked={comment.isLikedByViewer}
                initialLikes={comment.likesCount}
              />

              {!isReply && !isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowReplyForm((prev) => !prev)}
                  className="text-xs font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showReplyForm ? "Cancel" : "Reply"}
                </button>
              ) : null}

              {comment.isOwned && !isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Edit
                  </button>
                  <form action={deleteComment} className="m-0">
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="postId" value={postId} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 transition hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </form>
                </>
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
