"use client";

import { Heart, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type ProfileResult = { id: string; username: string | null; name: string | null; avatar: string | null };
type Shoutout = { id: string; label: string; targetProfile: ProfileResult };
type Draft = { id: string; label: string; target: ProfileResult | null; query: string; results: ProfileResult[] };

export default function ShoutoutEditor({ shoutouts, language }: { shoutouts: Shoutout[]; language: "en" | "de" }) {
  const de = language === "de";
  const copy = (en: string, german: string) => de ? german : en;
  const [drafts, setDrafts] = useState<Draft[]>(shoutouts.map((shoutout) => ({ id: shoutout.id, label: shoutout.label, target: shoutout.targetProfile, query: "", results: [] })));

  useEffect(() => {
    const tasks = drafts.map(async (draft) => {
      if (draft.target || draft.query.trim().length < 1) return;
      const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(draft.query)}&prefix=0`, { cache: "no-store" });
      const results = response.ok ? await response.json() as ProfileResult[] : [];
      setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, results } : item));
    });
    void Promise.all(tasks);
  }, [drafts.map((draft) => `${draft.id}:${draft.query}:${draft.target?.id ?? ""}`).join("|")]);

  const update = (id: string, change: Partial<Draft>) => setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...change } : draft));

  return (
    <details className="group mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-800/30" open={drafts.length > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 marker:content-none dark:text-slate-200">
        <span className="flex items-center gap-2"><Heart size={16} className="text-pink-500" />{copy("Shoutouts", "Shoutouts")}</span>
        <span className="text-xs font-medium text-slate-500 group-open:hidden dark:text-slate-400">{drafts.length ? `${drafts.length}/5` : copy("Optional", "Optional")}</span>
        <span className="hidden text-xs font-medium text-slate-500 group-open:inline dark:text-slate-400">{copy("Hide", "Schließen")}</span>
      </summary>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700/80">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{copy("Celebrate people on your profile, such as “My bestie” or “My love”.", "Zeige Menschen auf deinem Profil, etwa als „Meine beste Freundin“ oder „Meine Liebe“.")}</p>
        </div>
        <button type="button" disabled={drafts.length >= 5} onClick={() => setDrafts((items) => [...items, { id: crypto.randomUUID(), label: "", target: null, query: "", results: [] }])} className="inline-flex items-center gap-1.5 rounded-lg border border-pink-300 px-3 py-2 text-xs font-semibold text-pink-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-pink-400/60 dark:text-pink-300 dark:hover:bg-pink-400/10"><Plus size={15} /> {copy("Add shoutout", "Shoutout hinzufügen")}</button>
      </div>
      {drafts.length > 0 && <div className="mt-4 space-y-3">
        {drafts.map((draft) => <div key={draft.id} className="grid gap-2 sm:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_auto]">
          <input name="shoutoutLabel" value={draft.label} maxLength={80} onChange={(event) => update(draft.id, { label: event.target.value })} placeholder={copy("e.g. My bestie", "z. B. Meine beste Freundin")} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-400 dark:focus:ring-pink-500/15" />
          <div className="relative"><input type="hidden" name="shoutoutProfileId" value={draft.target?.id ?? ""} />
            <div className="flex items-center rounded-xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950/50">
              <Search size={16} className="ml-3 shrink-0 text-slate-400" />
              <input value={draft.target ? `@${draft.target.username}` : draft.query} onChange={(event) => update(draft.id, { target: null, query: event.target.value, results: [] })} placeholder={copy("Find a profile", "Profil suchen")} className="w-full bg-transparent px-2 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500" />
            </div>
            {!draft.target && draft.results.length > 0 && <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{draft.results.map((profile) => <button key={profile.id} type="button" onClick={() => update(draft.id, { target: profile, query: "", results: [] })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-pink-50 dark:hover:bg-slate-800"><span className="grid size-7 overflow-hidden rounded-full bg-slate-200 text-xs dark:bg-slate-700">{profile.avatar && <img src={profile.avatar} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{profile.name || profile.username} <span className="font-normal text-slate-500">@{profile.username}</span></span></button>)}</div>}
          </div>
          <button type="button" onClick={() => setDrafts((items) => items.filter((item) => item.id !== draft.id))} className="inline-grid size-10 place-items-center self-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300" aria-label={copy("Remove shoutout", "Shoutout entfernen")}><Trash2 size={17} /></button>
        </div>)}
      </div>}
    </details>
  );
}
