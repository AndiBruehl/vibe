"use client";

import { useRef } from "react";
import { postComment } from "@/actions";

type CommentFormProps = {
  postId: string;
  compact?: boolean;
};

export default function CommentForm({ postId, compact = false }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await postComment(formData);
    formRef.current?.reset();
  }

  if (compact) {
    return (
      <form ref={formRef} action={action} className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
        <input type="hidden" name="postId" value={postId} />
        <input
          name="text"
          placeholder="Write a comment..."
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/15 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          required
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-linear-to-r from-orange-500 to-pink-500 px-3 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          Post
        </button>
      </form>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />

      <textarea
        name="text"
        rows={3}
        placeholder="Write a comment..."
        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        required
      />

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Comment
        </button>
      </div>
    </form>
  );
}
