"use client";

import Link from "next/link";
import { Bookmark, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SavedMessage = {
  id: string;
  conversationId: string;
  conversationName: string;
  senderName: string;
  body: string;
  createdAt: string;
  hasAttachment: boolean;
};

export default function SavedMessages({ items, de, loadFailed = false }: { items: SavedMessage[]; de: boolean; loadFailed?: boolean }) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  const [query, setQuery] = useState("");
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized ? items.filter((item) => `${item.conversationName} ${item.senderName} ${item.body}`.toLocaleLowerCase().includes(normalized)) : items;
  }, [items, query]);
  const grouped = useMemo(() => {
    const groups = new Map<string, SavedMessage[]>();
    visibleItems.forEach((item) => groups.set(item.conversationId, [...(groups.get(item.conversationId) || []), item]));
    return [...groups.entries()];
  }, [visibleItems]);

  const retry = () => startRetry(() => router.refresh());

  if (loadFailed) return <section className="mt-5 rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-slate-800"><Bookmark className="mx-auto size-8 text-orange-500" /><p className="mt-3 font-bold text-slate-800 dark:text-slate-100">{de ? "Gespeicherte Nachrichten konnten gerade nicht geladen werden." : "Saved messages could not be loaded right now."}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{de ? "Deine übrigen Nachrichten bleiben davon unberührt." : "Your other messages are not affected."}</p><button type="button" onClick={retry} disabled={retrying} className="mt-4 min-h-11 rounded-full border border-orange-400/60 px-4 py-2 text-sm font-black text-orange-600 transition hover:bg-orange-500/10 disabled:opacity-60 dark:text-orange-300">{retrying ? (de ? "Wird erneut geladen…" : "Trying again…") : (de ? "Erneut versuchen" : "Try again")}</button></section>;

  return <section className="mt-5">
    <label className="relative block"><span className="sr-only">{de ? "Gespeicherte Nachrichten durchsuchen" : "Search saved messages"}</span><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={4000} placeholder={de ? "Gespeicherte Nachrichten durchsuchen" : "Search saved messages"} className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
    {items.length === 0 ? <div className="mt-5 rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800"><Bookmark className="mx-auto size-8 text-orange-500" /><p className="mt-3 font-bold text-slate-800 dark:text-slate-100">{de ? "Noch keine gespeicherten Nachrichten." : "No saved messages yet."}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{de ? "Speichere eine Nachricht direkt in einer Unterhaltung, um sie hier wiederzufinden." : "Save a message in a conversation to find it here later."}</p></div> : grouped.length === 0 ? <p className="mt-5 rounded-2xl bg-white p-5 text-center text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{de ? "Keine gespeicherten Nachrichten gefunden." : "No saved messages found."}</p> : <div className="mt-5 space-y-5">{grouped.map(([conversationId, messages]) => <section key={conversationId} className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800"><header className="border-b border-slate-100 px-4 py-3 dark:border-slate-700"><Link href={`/messages/${conversationId}`} className="font-bold text-slate-800 no-underline hover:text-orange-500 dark:text-slate-100 dark:hover:text-orange-300">{messages[0].conversationName}</Link></header><div className="divide-y divide-slate-100 dark:divide-slate-700">{messages.map((message) => <Link key={message.id} href={`/messages/${message.conversationId}#message-${message.id}`} className="block px-4 py-3 no-underline transition hover:bg-orange-50/70 dark:hover:bg-orange-500/10"><div className="flex items-baseline justify-between gap-3"><span className="truncate text-xs font-black text-orange-600 dark:text-orange-300">{message.senderName}</span><time className="shrink-0 text-[11px] text-slate-400">{new Date(message.createdAt).toLocaleString(de ? "de-DE" : "en-GB", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</time></div><p className="mt-1 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{message.body || (message.hasAttachment ? (de ? "Mediennachricht" : "Media message") : (de ? "Leere Nachricht" : "Empty message"))}</p></Link>)}</div></section>)}</div>}
  </section>;
}
