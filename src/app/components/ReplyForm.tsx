"use client";

import { useRef } from "react";
import { postReply } from "@/actions";

type ReplyFormProps = {
  postId: string;
  parentCommentId: string;
};

export default function ReplyForm({ postId, parentCommentId }: ReplyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await postReply(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={action} className="mt-3 space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="parentCommentId" value={parentCommentId} />

      <textarea
        name="text"
        rows={2}
        placeholder="Write a reply..."
        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-slate-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        required
      />

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-black dark:hover:bg-slate-200"
        >
          Reply
        </button>
      </div>
    </form>
  );
}
