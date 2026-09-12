"use client";
import { Children, useState, type ReactNode } from "react";
import {
  sortPostIndices,
  type PostSort,
  type SortablePost,
} from "@/post-sort";
import useVibeLanguage from "@/app/components/useVibeLanguage";

export default function SortablePosts({
  posts,
  children,
  className,
  headerAfterCount,
}: {
  posts: SortablePost[];
  children: ReactNode;
  className?: string;
  headerAfterCount?: ReactNode;
}) {
  const [order, setOrder] = useState<PostSort>("newest");
  const de = useVibeLanguage() === "de";
  const options: ReadonlyArray<readonly [PostSort, string]> = de
    ? [["newest", "Neueste zuerst"], ["oldest", "Älteste zuerst"], ["az", "A bis Z"], ["za", "Z bis A"]]
    : [["newest", "Newest to oldest"], ["oldest", "Oldest to newest"], ["az", "A to Z"], ["za", "Z to A"]];
  const items = Children.toArray(children);
  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-slate-800/70 dark:shadow-black/20 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-700/80 dark:text-slate-100">
            {posts.length} {de ? (posts.length === 1 ? "Beitrag" : "Beiträge") : (posts.length === 1 ? "post" : "posts")}
          </span>
          {headerAfterCount}
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="hidden sm:inline">{de ? "Beiträge sortieren" : "Sort posts"}</span>
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value as PostSort)}
            className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {options.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={className}>
        {posts.length
          ? sortPostIndices(posts, order).map((i) => items[i])
          : children}
      </div>
    </div>
  );
}
