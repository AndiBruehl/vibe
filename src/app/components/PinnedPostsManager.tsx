"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProfilePinnedPosts } from "@/actions";

type PinnedPost = { id: string; description: string; createdAt: Date };

export default function PinnedPostsManager({ posts, language, unavailable = false }: { posts: PinnedPost[]; language: "de" | "en"; unavailable?: boolean }) {
  const [orderedPosts, setOrderedPosts] = useState(posts);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const de = language === "de";
  const text = {
    title: de ? "Reihenfolge der Pins" : "Pin order",
    hint: de ? "Anpinnen und Entfernen funktioniert direkt in deinen Beiträgen." : "Pin and unpin directly from your posts.",
    empty: de ? "Noch keine Beiträge angepinnt." : "No posts pinned yet.",
    save: de ? "Reihenfolge speichern" : "Save order",
    saved: de ? "Reihenfolge wurde gespeichert." : "Order was saved.",
    unavailable: de ? "Pins sind gerade nicht verfügbar. Dein normaler Feed bleibt sichtbar." : "Pins are temporarily unavailable. Your regular feed remains visible.",
    failed: de ? "Reihenfolge konnte nicht gespeichert werden. Bitte versuche es erneut." : "Order could not be saved. Please try again.",
    up: de ? "Nach oben" : "Move up",
    down: de ? "Nach unten" : "Move down",
  };

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedPosts.length) return;
    setOrderedPosts((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function saveOrder() {
    setMessage("");
    startTransition(async () => {
      const formData = new FormData();
      orderedPosts.forEach((post) => formData.append("postId", post.id));
      const result = await setProfilePinnedPosts(formData);
      if (!result.ok) {
        setMessage(result.error === "unavailable" ? text.unavailable : text.failed);
        return;
      }
      setMessage(text.saved);
      router.refresh();
    });
  }

  if (unavailable) return <section className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">{text.unavailable}</section>;

  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <h2 className="text-base font-bold text-slate-900 dark:text-white">{text.title}</h2>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text.hint}</p>
    {orderedPosts.length === 0 ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{text.empty}</p> : <>
      <div className="mt-4 space-y-2">
        {orderedPosts.map((post, index) => <div key={post.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-900/45">
          <span className="w-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{index + 1}</span>
          <p className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-100">{post.description || new Date(post.createdAt).toLocaleDateString(language)}</p>
          <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || isPending} className="rounded-md px-2 py-1 text-sm disabled:opacity-35" aria-label={text.up}>↑</button>
          <button type="button" onClick={() => move(index, 1)} disabled={index === orderedPosts.length - 1 || isPending} className="rounded-md px-2 py-1 text-sm disabled:opacity-35" aria-label={text.down}>↓</button>
        </div>)}
      </div>
      {message && <p role="status" className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>}
      <button type="button" onClick={saveOrder} disabled={isPending} className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60">{isPending ? "…" : text.save}</button>
    </>}
  </section>;
}
