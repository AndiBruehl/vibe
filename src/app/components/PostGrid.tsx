"use client";

import Link from "next/link";
import Masonry from "react-masonry-css";

const breakpointColumnsObj = {
  default: 4,
  860: 3,
  500: 2,
};

type GridPost = {
  id: string;
  image: string;
  description?: string | null;
  topics?: {
    id: string;
    topic: {
      name: string;
      slug: string;
    };
  }[];
};

export default function PostGrid({ posts }: { posts: GridPost[] }) {
  return (
    <div className=" max-w-7xl mx-auto">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-4"
        columnClassName="pl-4"
      >
        {posts.map((post) => {
          const topics = post.topics ?? [];

          return (
            <Link href={`/posts/${post.id}`} key={post.id} className="block">
              <div className="relative mb-4">
                <img
                  src={post.image}
                  alt={post.description || "Post image"}
                  className="w-full rounded-lg"
                />

                {topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topics.map((postTopic) => (
                      <Link
                        key={postTopic.id}
                        href={`/topics/${postTopic.topic.slug}`}
                        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 no-underline hover:underline"
                      >
                        #{postTopic.topic.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </Masonry>
    </div>
  );
}
