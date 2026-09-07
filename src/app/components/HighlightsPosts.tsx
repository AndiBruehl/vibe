import PostImageCount from "@/app/components/PostImageCount";
import SortablePosts from "./SortablePosts";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";

export default async function HighlightsPosts() {
  const posts = await prisma.post.findMany({
    orderBy: [
      {
        likesCount: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
        <p className="text-slate-600 dark:text-slate-300">No highlights yet.</p>
      </div>
    );
  }

  return (
    <SortablePosts posts={posts.map((post) => ({ id: post.id, description: post.description, createdAt: post.createdAt }))} className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="group block overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"
        >
          <article>
            <div className="relative aspect-square w-full overflow-hidden">
              <PostImageCount images={post.images}/>
              <Image
                src={post.image}
                alt={post.description || "Highlight post image"}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                unoptimized
              />
            </div>

            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                {post.description || "No description"}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{post.likesCount} likes</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </SortablePosts>
  );
}
