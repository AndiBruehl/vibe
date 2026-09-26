"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMessage } from "@/actions";

export default function MessageDeleteButton({ messageId, de }: { messageId: string; de: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const router = useRouter();
  const remove = () => startTransition(async () => {
    try { setError(false); await deleteMessage(messageId); router.refresh(); } catch { setError(true); }
  });
  const requestDelete = () => window.dispatchEvent(new CustomEvent("vibe:delete-confirm", { detail: { onConfirm: remove } }));

  return <span className="inline-flex items-center gap-1"><button type="button" onClick={requestDelete} disabled={pending} className="grid size-9 place-items-center rounded-full text-red-200 transition hover:scale-105 hover:text-red-100 disabled:opacity-50" aria-label={de ? "Nachricht löschen" : "Delete message"} title={de ? "Nachricht löschen" : "Delete message"}>{pending ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={17} />}</button>{error ? <span role="status" className="text-[10px] font-semibold text-red-100">{de ? "Nicht gelöscht" : "Not deleted"}</span> : null}</span>;
}
