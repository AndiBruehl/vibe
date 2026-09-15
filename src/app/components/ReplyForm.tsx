"use client";

import { useRef } from "react";
import { postReply } from "@/actions";
import MentionTextarea from "./MentionTextarea";
import useVibeLanguage from "./useVibeLanguage";
import EmojiPicker from "./EmojiPicker";
import useEmojiTextarea from "./useEmojiTextarea";

type ReplyFormProps = {
  postId: string;
  parentCommentId: string;
};

export default function ReplyForm({ postId, parentCommentId }: ReplyFormProps) {
  const de = useVibeLanguage() === "de";
  const formRef = useRef<HTMLFormElement>(null);
  const { textareaRef, insertEmoji } = useEmojiTextarea();

  async function action(formData: FormData) {
    await postReply(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={action} className="mt-3 space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="parentCommentId" value={parentCommentId} />

      <MentionTextarea
        ref={textareaRef}
        data-emoji-builtin="true"
        name="text"
        rows={2}
        placeholder={de ? "Schreibe eine Antwort..." : "Write a reply..."}
        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        required
      />

      <div className="flex items-center justify-end gap-2">
        <EmojiPicker onSelect={insertEmoji} />
        <button
          type="submit"
          className="vibe-composer-submit rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {de ? "Antworten" : "Reply"}
        </button>
      </div>
    </form>
  );
}
