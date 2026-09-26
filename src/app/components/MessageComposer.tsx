"use client";

import { ImagePlus, LoaderCircle, Reply, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/actions";
import EmojiPicker from "@/app/components/EmojiPicker";
import MentionTextarea from "@/app/components/MentionTextarea";
import useVibeLanguage from "@/app/components/useVibeLanguage";
import DraftStatus from "@/app/components/DraftStatus";

type MessageComposerProps = {
  conversationId: string;
  blocked?: boolean;
  blockedByOther?: boolean;
  systemNoReply?: boolean;
};

export default function MessageComposer({ conversationId, blocked = false, blockedByOther = false, systemNoReply = false }: MessageComposerProps) {
  const de = useVibeLanguage() === "de";
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"restored" | "saved" | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; body: string; sender: string } | null>(null);
  const draftKey = `vibe.messageDraft.${conversationId}`;

  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      setBody(draft);
      setDraftStatus("restored");
    }
    setDraftReady(true);
  }, [draftKey]);
  useEffect(() => { const handler = (event: Event) => { const detail = (event as CustomEvent<{ id?: unknown; body?: unknown; sender?: unknown }>).detail; if (!detail || typeof detail.id !== "string" || !detail.id) return; setReplyTo({ id: detail.id, body: typeof detail.body === "string" ? detail.body : "", sender: typeof detail.sender === "string" && detail.sender ? detail.sender : "VIBE" }); }; window.addEventListener("vibe:message-reply", handler); return () => window.removeEventListener("vibe:message-reply", handler); }, []);

  useEffect(() => {
    if (!draftReady) return;
    const timer = window.setTimeout(() => {
      if (body.trim()) {
        localStorage.setItem(draftKey, body);
        setDraftStatus("saved");
      } else {
        localStorage.removeItem(draftKey);
        setDraftStatus(null);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [body, draftKey, draftReady]);

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
    if (blocked || systemNoReply || (!body.trim() && !imageUrl) || isUploading) return;
    const data = new FormData(event.currentTarget);
    setError("");
    setIsSending(true);
    try {
      await sendMessage(data);
      formRef.current?.reset();
      setBody("");
      localStorage.removeItem(draftKey);
      setDraftStatus(null);
      setImageUrl("");
      setPreviewUrl("");
      setReplyTo(null);
      router.refresh();
    } catch {
      setError(de ? "Nachrichten sind in dieser Unterhaltung nicht möglich." : "Messages are not available in this conversation.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={action} className="conversation-composer rounded-2xl bg-white p-3 shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="replyToMessageId" value={replyTo?.id || ""} />
      {blocked || systemNoReply ? (
        <div role="status" className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-200">
          {systemNoReply ? (de ? "VibeTeam-Nachrichten können nicht beantwortet werden." : "VibeTeam messages cannot be replied to.") : de
            ? blockedByOther
              ? "Keine Nachrichten möglich: Dieser Nutzer hat dich blockiert."
              : "Keine Nachrichten möglich: Du hast diesen Nutzer blockiert."
            : blockedByOther
              ? "No messages possible: this user blocked you."
              : "No messages possible: you blocked this user."}
        </div>
      ) : <>
      {previewUrl && (
        <div className="relative mb-3 inline-block">
          <img src={previewUrl} alt={de ? "Ausgewählter Anhang" : "Selected attachment"} className="max-h-40 rounded-xl object-cover" />
          <button type="button" onClick={() => { setPreviewUrl(""); setImageUrl(""); }} className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-slate-900 text-white shadow" aria-label={de ? "Bild entfernen" : "Remove image"}><X size={15} /></button>
        </div>
      )}
      {replyTo && <div className="mb-2 flex items-center gap-2 rounded-xl border-l-2 border-orange-400 bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200"><Reply size={14}/><span className="min-w-0 flex-1 truncate"><b>{replyTo.sender}</b>: {replyTo.body || (de ? "Mediennachricht" : "Media message")}</span><button type="button" onClick={() => setReplyTo(null)} className="grid size-7 place-items-center rounded-full" aria-label={de ? "Antwort entfernen" : "Remove reply"}><X size={15}/></button></div>}
      <div className="grid w-full grid-cols-[2.75rem_2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700" aria-label={de ? "Bild anhängen" : "Attach image"}><ImagePlus size={21} /></button>
        <EmojiPicker onSelect={insertEmoji} />
        <MentionTextarea data-emoji-builtin="true" ref={textareaRef} name="body" value={body} onChange={(event) => setBody(event.target.value)} rows={1} placeholder={isUploading ? (de ? "Bild wird hochgeladen..." : "Uploading image...") : (de ? "Nachricht" : "Message")} className="vibe-composer-control w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100" />
        <button type="submit" disabled={isSending || isUploading || (!body.trim() && !imageUrl)} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50" aria-label={de ? "Nachricht senden" : "Send message"}>{isSending ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}</button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-300">{error}</p>}
      <p className="mt-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">{de ? "Nachrichten können bis zu 10 Minuten nach dem Senden bearbeitet werden." : "Messages can be edited for up to 10 minutes after sending."}</p>
      {!error && draftReady && body.trim() && <div className="mt-2"><DraftStatus state={draftStatus} de={de} onDiscard={() => { setBody(""); localStorage.removeItem(draftKey); setDraftStatus(null); textareaRef.current?.focus(); }} /></div>}
      </>}
    </form>
  );
}
