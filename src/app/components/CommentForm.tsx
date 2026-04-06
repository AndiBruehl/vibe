"use client";

import { useRef } from "react";
import { postComment } from "@/actions";

type CommentFormProps = {
  postId: string;
};

export default function CommentForm({ postId }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await postComment(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />

      <textarea
        name="text"
        rows={3}
        placeholder="Write a comment..."
        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-slate-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        required
      />

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
        >
          Comment
        </button>
      </div>
    </form>
  );
}
