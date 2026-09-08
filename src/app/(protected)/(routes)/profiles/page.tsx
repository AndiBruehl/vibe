import { getProfileDirectory } from "@/profile-directory";
import { profileSortOptions } from "@/profile-directory-order";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users } from "lucide-react";

export default async function ProfilesPage({ searchParams }: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const sort = profileSortOptions.some(option => option.value === params.sort) ? params.sort! : "newest";
  const profiles = await getProfileDirectory(q, sort);
  return <main className="pb-24 md:pb-8">
    <Link href="/browse" className="inline-flex min-h-11 items-center gap-2 text-slate-700 dark:text-slate-300"><ArrowLeft size={20} />Back to Browse</Link>
    <h1 className="mt-4 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white"><Users />Profiles</h1>
    <p className="mt-2 text-slate-600 dark:text-slate-400">Find people and discover their vibes.</p>
    <form action="/profiles" className="my-6 flex flex-wrap items-end gap-3">
      <label className="min-w-48 flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">Search profiles
        <input name="q" type="search" maxLength={200} defaultValue={q} placeholder="Name, username or subtitle"
          className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white/80 px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
      </label>
      <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Sort by
        <select name="sort" defaultValue={sort} className="mt-2 block min-h-11 rounded-xl border border-slate-300 bg-white/80 px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
          {profileSortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <button type="submit" className="min-h-11 rounded-xl bg-rose-600 px-5 font-semibold text-white hover:bg-rose-700">Search</button>
      {q && <Link href={`/profiles?sort=${sort}`} className="inline-flex min-h-11 items-center px-2 text-slate-700 dark:text-slate-300">Clear search</Link>}
    </form>
    <p role="status" className="mb-4 text-sm text-slate-600 dark:text-slate-400">{profiles.length} {profiles.length === 1 ? "profile" : "profiles"}{q ? " found" : ""}</p>
    {profiles.length === 0 ? <div className="rounded-2xl bg-white/70 p-8 text-center text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {q ? "No profiles match your search. Try another name or username." : "No profiles yet."}
    </div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {profiles.map(profile => {
        const content = <>
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xl text-slate-600 dark:bg-slate-700 dark:text-slate-200">
            {profile.avatar ? <Image src={profile.avatar} alt="" fill sizes="64px" unoptimized className="object-cover" /> : (profile.name || profile.username || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="break-words font-semibold text-slate-900 dark:text-white">{profile.name || profile.username || "Unnamed profile"}</h2>
            {profile.username && <p className="break-words text-sm text-slate-600 dark:text-slate-400">@{profile.username}</p>}
            {profile.subtitle && <p className="mt-2 line-clamp-3 text-sm text-slate-700 dark:text-slate-300">{profile.subtitle}</p>}
          </div>
        </>;
        const style = "flex gap-4 rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800";
        return profile.username ? <Link key={profile.id} href={`/profile/${encodeURIComponent(profile.username)}`} className={`${style} transition hover:border-rose-400 focus-visible:outline-rose-500`}>{content}</Link>
          : <article key={profile.id} className={style}>{content}</article>;
      })}
    </div>}
  </main>;
}
