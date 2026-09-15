"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useVibeLanguage from "@/app/components/useVibeLanguage";

type SearchInputProps = {
  initialQuery: string;
  initialScope: SearchScope;
};

export const searchScopes = ["all", "profiles", "posts", "tags", "admins"] as const;
export type SearchScope = (typeof searchScopes)[number];

export default function SearchInput({ initialQuery, initialScope }: SearchInputProps) {
  const de = useVibeLanguage() === "de";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, router, pathname, searchParams]);

  function selectScope(scope: SearchScope) {
    const params = new URLSearchParams(searchParams.toString());
    if (scope === "all") {
      params.delete("scope");
    } else {
      params.set("scope", scope);
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  const labels: Record<SearchScope, string> = {
    all: de ? "Alles" : "All",
    profiles: de ? "Profile" : "Profiles",
    posts: de ? "Beiträge" : "Posts",
    tags: de ? "Tags" : "Tags",
    admins: de ? "Admins" : "Admins",
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={de ? "Profile, Beiträge und Tags suchen..." : "Search profiles, posts, and tags..."}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-12 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-gray-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
        />
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="flex flex-wrap gap-2" aria-label={de ? "Suchfilter" : "Search filters"}>
        {searchScopes.map((scope) => {
          const active = initialScope === scope;
          return (
            <button
              key={scope}
              type="button"
              onClick={() => selectScope(scope)}
              aria-pressed={active}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md shadow-orange-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
            >
              {labels[scope]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
