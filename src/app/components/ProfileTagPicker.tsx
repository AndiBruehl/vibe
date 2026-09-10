"use client";

import { useEffect, useState } from "react";

export type TaggedProfile = { id: string; username: string | null; name: string | null; avatar: string | null };

export default function ProfileTagPicker({ initial = [] }: { initial?: TaggedProfile[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaggedProfile[]>([]);
  const [selected, setSelected] = useState<TaggedProfile[]>(initial);

  useEffect(() => {
    const value = query.trim();
    if (!value) { setResults([]); return; }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(value)}`, { cache: "no-store" });
        setResults(response.ok ? await response.json() : []);
      } catch { setResults([]); }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  return <div className="space-y-2">
    <label className="block text-sm font-medium">Tag people</label>
    <div className="flex flex-wrap gap-2">
      {selected.map((profile) => <span key={profile.id} className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-900 dark:bg-orange-500/15 dark:text-orange-200">
        @{profile.username || profile.name || "profile"}
        <button type="button" aria-label={`Remove ${profile.username || profile.name || "profile"}`} onClick={() => setSelected((current) => current.filter((item) => item.id !== profile.id))}>×</button>
      </span>)}
    </div>
    <div className="relative">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search profiles to tag" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-gray-900 dark:text-white" />
      {results.length > 0 && <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {results.filter((profile) => !selected.some((item) => item.id === profile.id)).map((profile) => <button key={profile.id} type="button" onClick={() => { if (selected.length < 10) setSelected((current) => [...current, profile]); setQuery(""); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/10">
          {profile.avatar ? <img src={profile.avatar} alt="" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-slate-200 text-xs dark:bg-slate-700">{(profile.username || profile.name || "?")[0]}</span>}
          <span className="text-sm font-medium">{profile.name || profile.username} <span className="text-slate-500">@{profile.username || "profile"}</span></span>
        </button>)}
      </div>}
    </div>
    <input type="hidden" name="profileTagsSet" value="1" readOnly />
    {selected.map((profile) => <input key={profile.id} type="hidden" name="profileTags" value={profile.id} readOnly />)}
  </div>;
}
