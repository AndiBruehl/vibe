"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProfilePinnedPosts } from "@/actions";

type PostOption = { id: string; description: string; createdAt: Date };

export default function PinnedPostsManager({
  posts,
  initialIds,
  language,
  unavailable = false,
}: {
  posts: PostOption[];
  initialIds: string[];
  language: "de" | "en";
  unavailable?: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const de = language === "de";
  const text = {
    title: de ? "Angepinnte Beiträge" : "Pinned posts",
    hint: de ? "Wähle bis zu drei eigene Beiträge. Sie erscheinen vor deinem normalen Feed." : "Choose up to three of your posts. They appear before your regular feed.",
    empty: de ? "Du hast noch keine öffentlichen Beiträge zum Anpinnen." : "You do not have any public posts to pin yet.",
    save: de ? "Pins speichern" : "Save pins",
    saved: de ? "Pins wurden gespeichert." : "Pins were saved.",
    unavailable: de ? "Pins sind gerade nicht verfügbar. Dein normaler Feed bleibt sichtbar." : "Pins are temporarily unavailable. Your regular feed remains visible.",
    maximum: de ? "Du kannst höchstens drei Beiträge anpinnen." : "You can pin up to three posts.",
    failed: de ? "Pins konnten nicht gespeichert werden. Bitte versuche es erneut." : "Pins could not be saved. Please try again.",
    remove: de ? "Entfernen" : "Remove",
    add: de ? "Anpinnen" : "Pin",
    up: de ? "Nach oben" : "Move up",
    down: de ? "Nach unten" : "Move down",
  };

  function togglePost(id: string) {
    setMessage("");
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) {
        setMessage(text.maximum);
        return current;
      }
      return [...current, id];
    });
  }

  function move(id: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function savePins() {
    setMessage("");
    startTransition(async () => {
      const formData = new FormData();
      selectedIds.forEach((id) => formData.append("postId", id));
      const result = await setProfilePinnedPosts(formData);
      if (!result.ok) {
        setMessage(result.error === "unavailable" ? text.unavailable : text.failed);
        return;
      }
      setMessage(text.saved);
      router.refresh();
    });
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{text.title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{selectedIds.length}/3</span>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text.hint}</p>

      {unavailable ? <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">{text.unavailable}</p> : posts.length === 0 ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{text.empty}</p> : (
        <div className="mt-4 space-y-2">
          {posts.map((post) => {
            const position = selectedIds.indexOf(post.id);
            const selected = position >= 0;
            return <div key={post.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-900/45">
              <span className="w-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{selected ? position + 1 : ""}</span>
              <p className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-100">{post.description || new Date(post.createdAt).toLocaleDateString(language)}</p>
              {selected && <><button type="button" onClick={() => move(post.id, -1)} disabled={position === 0 || isPending} className="rounded-md px-2 py-1 text-sm disabled:opacity-35" aria-label={text.up}>↑</button><button type="button" onClick={() => move(post.id, 1)} disabled={position === selectedIds.length - 1 || isPending} className="rounded-md px-2 py-1 text-sm disabled:opacity-35" aria-label={text.down}>↓</button></>}
              <button type="button" onClick={() => togglePost(post.id)} disabled={isPending} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${selected ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100" : "bg-orange-500 text-white"}`}>{selected ? text.remove : text.add}</button>
            </div>;
          })}
        </div>
      )}
      {message && <p role="status" className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>}
      {!unavailable && <button type="button" onClick={savePins} disabled={isPending} className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60">{isPending ? "…" : text.save}</button>}
    </section>
  );
}
