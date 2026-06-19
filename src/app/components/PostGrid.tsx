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

              {/* topics disabled temporarily */}
            </div>
          </Link>
        ))}
      </Masonry>
    </div>
  );
}
