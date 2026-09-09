"use client";
import { Children, useState, type ReactNode } from "react";
import {
  POST_SORT_OPTIONS,
  sortPostIndices,
  type PostSort,
  type SortablePost,
} from "@/post-sort";

export default function SortablePosts({
  posts,
  children,
  className,
}: {
  posts: SortablePost[];
  children: ReactNode;
  className?: string;
}) {
  const [order, setOrder] = useState<PostSort>("newest");
  const items = Children.toArray(children);
  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-slate-800/70 dark:shadow-black/20 sm:px-5">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-700/80 dark:text-slate-100">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="hidden sm:inline">Sort posts</span>
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value as PostSort)}
            className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {POST_SORT_OPTIONS.map(([value, label]) => (
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
