"use client";
import { Reply } from "lucide-react";
export default function MessageReplyButton({ id, body, sender, de }: { id: string; body: string; sender: string; de: boolean }) {
  return <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("vibe:message-reply", { detail: { id, body, sender } }))} className="grid size-9 place-items-center rounded-full text-white/80 transition hover:scale-105" aria-label={de ? "Antworten" : "Reply"}><Reply size={17}/></button>;
}
