import Link from "next/link";
import { ArrowRight, Globe2, Search, UsersRound } from "lucide-react";
import AdminBadge from "@/app/components/AdminBadge";
import GuestJoinPrompt from "@/app/components/GuestJoinPrompt";
import LocalizedText from "@/app/components/LocalizedText";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import { GuestUnavailable } from "@/app/components/GuestPosts";
import { getProfileDirectory } from "@/profile-directory";
import { profileSortOptions } from "@/profile-directory-order";

export default async function GuestProfilesPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const sort = profileSortOptions.some((option) => option.value === params.sort) ? params.sort! : "newest";
  let profiles;
  try {
    profiles = await getProfileDirectory(q, sort, false, true);
  } catch {
    return <GuestUnavailable />;
  }

  return <main>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <h1 className="flex items-center gap-3 text-2xl font-bold"><UsersRound /><LocalizedText en="Public profiles" de="Öffentliche Profile" /></h1>
      <div className="w-full sm:max-w-md"><GuestJoinPrompt compact /></div>
    </div>
    <form action="/profiles" className="my-6 flex flex-wrap items-end gap-3">
      <label className="min-w-48 flex-1 text-sm font-medium"><LocalizedText en="Search profiles" de="Profile suchen" />
        <span className="mt-2 flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 text-slate-900 focus-within:border-orange-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
          <Search size={16} className="shrink-0 text-slate-500" />
          <input name="q" type="search" maxLength={200} defaultValue={q} placeholder="Name, username or subtitle" className="min-w-0 flex-1 bg-transparent outline-none" />
        </span>
      </label>
      <label className="text-sm font-medium"><LocalizedText en="Sort by" de="Sortieren nach" />
        <select name="sort" defaultValue={sort} className="mt-2 block min-h-11 rounded-xl border border-slate-300 bg-white/80 px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
          {profileSortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <button type="submit" className="min-h-11 rounded-xl bg-rose-600 px-5 font-semibold text-white hover:bg-rose-700"><LocalizedText en="Search" de="Suchen" /></button>
      {q && <Link href={`/profiles?sort=${sort}`} className="inline-flex min-h-11 items-center px-2"><LocalizedText en="Clear search" de="Suche löschen" /></Link>}
    </form>
    <p role="status" className="mb-4 rounded-2xl border border-slate-400/20 bg-white/60 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">{profiles.length} <LocalizedText en={profiles.length === 1 ? "public profile" : "public profiles"} de={profiles.length === 1 ? "öffentliches Profil" : "öffentliche Profile"} />{q ? <> · <LocalizedText en="Search results for" de="Suchergebnisse für" /> <span className="font-semibold text-slate-900 dark:text-white">{q}</span></> : null}</p>
    {profiles.length === 0 ? <div className="rounded-2xl border border-slate-400/20 p-8 text-center">
      {q ? <LocalizedText en="No public profiles match your search." de="Keine öffentlichen Profile passen zu deiner Suche." /> : <LocalizedText en="No public profiles yet." de="Noch keine öffentlichen Profile vorhanden." />}
    </div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {profiles.map((profile) => {
        const displayName = profile.name || profile.username || "Unnamed profile";
        const summary = profile.subtitle || profile.bio;
        const content = <>
          <div className="flex items-start gap-4">
            <ProfileAvatar {...profile} sizeClass="size-16" className="shrink-0 text-xl" />
            <div className="min-w-0 flex-1">
              <h2 className="flex flex-wrap items-center gap-2 break-words font-semibold">{displayName}<AdminBadge isAdmin={profile.isAdmin} isVerified={profile.isVerified} badges={profile.profileBadges} hiddenBadges={profile.hiddenProfileBadges} /></h2>
              {profile.username && <p className="break-words text-sm text-slate-600 dark:text-slate-400">@{profile.username}</p>}
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-200"><Globe2 size={12}/><LocalizedText en="Public profile" de="Öffentliches Profil" /></p>
            </div>
          </div>
          {summary ? <p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">{summary}</p> : <p className="mt-4 text-sm text-slate-500 dark:text-slate-400"><LocalizedText en="No public bio yet." de="Noch keine öffentliche Bio." /></p>}
          {profile.username ? <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-300"><LocalizedText en="Open profile" de="Profil öffnen" /><ArrowRight size={15}/></span> : null}
        </>;
        const style = "block rounded-2xl border border-slate-400/20 bg-white/75 p-5 shadow-sm dark:bg-slate-900";
        return profile.username ? <Link key={profile.id} href={`/profile/${encodeURIComponent(profile.username)}`} className={`${style} transition hover:border-orange-400 hover:shadow-md focus-visible:outline-rose-500`}>{content}</Link> : <article key={profile.id} className={style}>{content}</article>;
      })}
    </div>}
  </main>;
}
