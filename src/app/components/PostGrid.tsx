"use client";

import { Post } from "@prisma/client";
import Link from "next/link";
import Masonry from "react-masonry-css";

const breakpointColumnsObj = {
  default: 4,
  860: 3,
  500: 2,
};

export default function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className=" max-w-7xl mx-auto">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-4"
        columnClassName="pl-4"
      >
        {posts.map((post) => (
          <Link href={`/posts/${post.id}`} key={post.id}>
            <img
              key={post.id}
              src={post.image}
              className="w-full mb-4 rounded-lg"
            />
          </Link>
        ))}
      </Masonry>
    </div>
  );
}
