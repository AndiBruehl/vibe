"use client";

import { ImagePlus, Send, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/actions";
import EmojiPicker from "@/app/components/EmojiPicker";
import MentionTextarea from "@/app/components/MentionTextarea";
import useVibeLanguage from "@/app/components/useVibeLanguage";

export default function MessageComposer({ conversationId }: { conversationId: string }) {
  const de = useVibeLanguage() === "de";
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? body.length;
    const end = textarea?.selectionEnd ?? body.length;
    const nextBody = `${body.slice(0, start)}${emoji}${body.slice(end)}`;

    setBody(nextBody);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: data });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json() as { url?: string };
      if (!result.url) throw new Error("Upload failed");
      setImageUrl(result.url);
    } catch {
      setPreviewUrl("");
      setImageUrl("");
      setError(de ? "Das Bild konnte nicht hochgeladen werden. Bitte erneut versuchen." : "The image could not be uploaded. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function action(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((!body.trim() && !imageUrl) || isUploading) return;
    const data = new FormData(event.currentTarget);
    await sendMessage(data);
    formRef.current?.reset();
    setBody("");
    setImageUrl("");
    setPreviewUrl("");
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={action} className="conversation-composer sticky bottom-20 rounded-2xl bg-white p-3 shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900 md:bottom-4">
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      {previewUrl && (
        <div className="relative mb-3 inline-block">
          <img src={previewUrl} alt={de ? "Ausgewählter Anhang" : "Selected attachment"} className="max-h-40 rounded-xl object-cover" />
          <button type="button" onClick={() => { setPreviewUrl(""); setImageUrl(""); }} className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-slate-900 text-white shadow" aria-label={de ? "Bild entfernen" : "Remove image"}><X size={15} /></button>
        </div>
      )}
      <div className="flex items-end gap-3">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700" aria-label={de ? "Bild anhängen" : "Attach image"}><ImagePlus size={21} /></button>
        <EmojiPicker onSelect={insertEmoji} />
        <MentionTextarea ref={textareaRef} name="body" value={body} onChange={(event) => setBody(event.target.value)} rows={1} placeholder={isUploading ? (de ? "Bild wird hochgeladen..." : "Uploading image...") : (de ? "Nachricht" : "Message")} className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100" />
        <button type="submit" disabled={isUploading || (!body.trim() && !imageUrl)} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50" aria-label={de ? "Nachricht senden" : "Send message"}><Send size={18} /></button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-300">{error}</p>}
    </form>
  );
}
