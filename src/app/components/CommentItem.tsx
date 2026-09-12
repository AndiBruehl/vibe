"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CommentLikeButton from "./CommentLikeButton";
import ReplyForm from "./ReplyForm";
import { deleteComment, editComment } from "@/actions";
import MentionTextarea from "./MentionTextarea";
import MentionText from "./MentionText";
import useVibeLanguage from "./useVibeLanguage";

type Author = {
  username: string | null;
  name: string | null;
  avatar: string | null;
  email?: string | null;
};

type Mention = { username: string | null; name: string | null };

type Reply = {
  id: string;
  text: string;
  createdAt: Date;
  author: Author;
  likesCount: number;
  isLikedByViewer: boolean;
  mentions: Mention[];
};

type CommentData = {
  id: string;
  text: string;
  createdAt: Date;
  author: Author;
  likesCount: number;
  isLikedByViewer: boolean;
  isOwned?: boolean;
  mentions: Mention[];
  replies: Reply[];
};

type CommentItemProps = {
  comment: CommentData;
  postId: string;
  isReply?: boolean;
  rootCommentId?: string;
};

export default function CommentItem({
  comment,
  postId,
  isReply = false,
  rootCommentId,
}: CommentItemProps) {
  const de = useVibeLanguage() === "de";
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const profileHref = comment.author.username
    ? `/profile/${encodeURIComponent(comment.author.username)}`
    : null;

  return (
    <div
      className={
        isReply ? "ml-8 border-l border-gray-200 pl-4 dark:border-gray-700" : ""
      }
    >
      <article id={`comment-${comment.id}`} className="scroll-mt-24 rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
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
                  className="font-semibold text-slate-900 transition hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
                >
                  {comment.author.name || "Unknown"}
                </Link>
              ) : (
                <p className="font-semibold text-slate-900 dark:text-white">
                  {comment.author.name || "Unknown"}
                </p>
              )}

              {profileHref ? (
                <Link
                  href={profileHref}
                  className="text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  @{comment.author.username}
                </Link>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  @{comment.author.username || "user"}
                </p>
              )}

              <span className="text-xs text-slate-400 dark:text-slate-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            {!isEditing ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200"><MentionText text={comment.text} /></p> : null}

            {isEditing ? (
              <form action={editComment} className="mt-3 space-y-3">
                <input type="hidden" name="commentId" value={comment.id} />
                <input type="hidden" name="postId" value={postId} />

                <MentionTextarea
                  name="text"
                  defaultValue={comment.text}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  required
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {de ? "Speichern" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-slate-200 dark:hover:bg-gray-800"
                  >
                    {de ? "Abbrechen" : "Cancel"}
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

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowReplyForm((prev) => !prev)}
                  className="text-xs font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showReplyForm ? (de ? "Abbrechen" : "Cancel") : (de ? "Antworten" : "Reply")}
                </button>
              ) : null}

              {comment.isOwned && !isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {de ? "Bearbeiten" : "Edit"}
                  </button>
                  <form action={deleteComment} className="m-0">
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="postId" value={postId} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 transition hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {de ? "Löschen" : "Delete"}
                    </button>
                  </form>
                </>
              ) : null}
            </div>

            {showReplyForm ? (
              <ReplyForm postId={postId} parentCommentId={rootCommentId ?? comment.id} />
            ) : null}
          </div>
        </div>
      </article>

      {!isReply && comment.replies.length > 0 ? (
        <div className="mt-3 border-l-2 border-orange-200 pl-3 dark:border-orange-400/30">
          <button
            type="button"
            onClick={() => setShowReplies((current) => !current)}
            className="mb-3 text-xs font-semibold text-orange-600 transition hover:text-orange-700 dark:text-orange-300 dark:hover:text-orange-200"
            aria-expanded={showReplies}
          >
            {showReplies
              ? (de ? "Antworten ausblenden" : "Hide replies")
              : de ? `${comment.replies.length} ${comment.replies.length === 1 ? "Antwort anzeigen" : "Antworten anzeigen"}` : `View ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
          </button>
          {showReplies && <div className="space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={{ ...reply, replies: [] }}
                postId={postId}
                isReply
                rootCommentId={comment.id}
              />
            ))}
          </div>}
        </div>
      ) : null}
    </div>
  );
}

// EOF
