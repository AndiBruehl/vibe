"use client";

import { useRef } from "react";
import { postComment } from "@/actions";
import MentionTextarea from "./MentionTextarea";
import useVibeLanguage from "./useVibeLanguage";
import EmojiPicker from "./EmojiPicker";
import useEmojiTextarea from "./useEmojiTextarea";

type CommentFormProps = {
  postId: string;
  compact?: boolean;
};

export default function CommentForm({ postId, compact = false }: CommentFormProps) {
  const de = useVibeLanguage() === "de";
  const formRef = useRef<HTMLFormElement>(null);
  const { textareaRef, insertEmoji } = useEmojiTextarea();

  async function action(formData: FormData) {
    await postComment(formData);
    formRef.current?.reset();
  }

  if (compact) {
    return (
      <form ref={formRef} action={action} className="mt-4 grid grid-cols-[minmax(0,1fr)_2.75rem_auto] items-center gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
        <input type="hidden" name="postId" value={postId} />
        <MentionTextarea
          ref={textareaRef}
          data-emoji-builtin="true"
          name="text"
          rows={1}
          placeholder={de ? "Schreibe einen Kommentar..." : "Write a comment..."}
          className="vibe-composer-control w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/15 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          required
        />
        <EmojiPicker onSelect={insertEmoji} />
        <button type="submit" className="vibe-composer-submit shrink-0 rounded-xl bg-linear-to-r from-orange-500 to-pink-500 px-3 text-sm font-bold text-white transition hover:brightness-110">{de ? "Senden" : "Post"}</button>
      </form>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />

      <MentionTextarea
        ref={textareaRef}
        data-emoji-builtin="true"
        name="text"
        rows={3}
        placeholder={de ? "Schreibe einen Kommentar..." : "Write a comment..."}
        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        required
      />

      <div className="flex items-center justify-end gap-2">
        <EmojiPicker onSelect={insertEmoji} />
        <button
          type="submit"
          className="vibe-composer-submit rounded-xl bg-black px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {de ? "Kommentieren" : "Comment"}
        </button>
      </div>
    </form>
  );
}
