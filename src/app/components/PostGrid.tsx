"use client";

import Link from "next/link";
import Masonry from "react-masonry-css";

const breakpointColumnsObj = {
  default: 4,
  860: 3,
  500: 2,
};

export default function PostGrid({ posts }: { posts: any[] }) {
  return (
    <div className=" max-w-7xl mx-auto">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-4"
        columnClassName="pl-4"
      >
        {posts.map((post) => (
          <Link href={`/posts/${post.id}`} key={post.id} className="block">
            <div className="relative mb-4">
              <img src={post.image} className="w-full rounded-lg" />

              {post.topics?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.topics.map((t: any) => (
                    <Link
                      key={t.id}
                      href={`/topics/${t.slug}`}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 no-underline hover:underline"
                    >
                      #{t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </Masonry>
    </div>
  );
}
