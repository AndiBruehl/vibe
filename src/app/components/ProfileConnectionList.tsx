"use client";

import { toggleFollow } from "@/actions";
import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import useVibeLanguage from "./useVibeLanguage";

type ConnectionProfile = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  isFollowing: boolean;
  isSelf: boolean;
};

export default function ProfileConnectionList({
  profiles,
  title,
}: {
  profiles: ConnectionProfile[];
  title: "Followers" | "Following";
}) {
  const de = useVibeLanguage() === "de";
  const [query, setQuery] = useState("");
  const visibleProfiles = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return profiles;
    return profiles.filter((profile) =>
      [profile.name, profile.username].some((value) =>
        value?.toLocaleLowerCase().includes(search),
      ),
    );
  }, [profiles, query]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-white/10 dark:bg-slate-800 dark:shadow-black/20">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{de ? (title === "Followers" ? "Follower" : "Folgt") : title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {profiles.length} {de ? (profiles.length === 1 ? "Profil" : "Profile") : (profiles.length === 1 ? "profile" : "profiles")}
        </p>
        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={de ? "Profile suchen..." : "Search profiles..."}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
      </div>

      {visibleProfiles.length ? (
        <ul className="divide-y divide-slate-100 dark:divide-white/10">
          {visibleProfiles.map((profile) => (
            <li key={profile.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
              <Link
                href={profile.username ? `/profile/${encodeURIComponent(profile.username)}` : "#"}
                className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="size-full object-cover" />
                ) : (
                  <UserRound className="size-5 text-slate-400" />
                )}
              </Link>

              <Link
                href={profile.username ? `/profile/${encodeURIComponent(profile.username)}` : "#"}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {profile.name || profile.username || (de ? "VIBE-Mitglied" : "VIBE member")}
                </p>
                {profile.username ? (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{profile.username}</p>
                ) : null}
              </Link>

              {!profile.isSelf ? (
                <form action={toggleFollow}>
                  <input type="hidden" name="targetProfileId" value={profile.id} />
                  <input type="hidden" name="targetUsername" value={profile.username || ""} />
                  <button
                    type="submit"
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      profile.isFollowing
                        ? "border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        : "bg-linear-to-r from-(--ig-orange) to-(--ig-red) text-white shadow-sm hover:brightness-105"
                    }`}
                  >
                    {profile.isFollowing ? (de ? "Folge ich" : "Following") : (de ? "Folgen" : "Follow")}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          {de ? "Keine Profile passen zu deiner Suche." : "No profiles match your search."}
        </div>
      )}
    </section>
  );
}
