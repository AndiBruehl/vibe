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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
        <label className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
          Sort posts
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value as PostSort)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-gray-800 dark:text-slate-100"
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
