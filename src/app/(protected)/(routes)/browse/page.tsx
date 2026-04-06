import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { MoveLeft } from "lucide-react";

export default async function BrowsePage() {
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: {
        select: {
          username: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return (
    <main className="pb-24 md:pb-8">
      <section className="flex items-center justify-between">
        <Link
          href="/home"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-400 dark:hover:text-slate-500"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Back to Home
          </span>
        </Link>

        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Browse
        </h1>

        <div className="w-24" />
      </section>

      <section className="mt-6">
        {posts.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
            <p className="text-slate-700 dark:text-slate-300">
              No posts available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <Image
                    src={post.image}
                    alt={post.description || "Post image"}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    unoptimized
                  />
                </div>

                <div className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative size-8 overflow-hidden rounded-full bg-slate-300 dark:bg-slate-600">
                      {post.author?.avatar ? (
                        <Image
                          src={post.author.avatar}
                          alt={post.author.name || "Author avatar"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {post.author?.name || "Unknown"}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        @{post.author?.username || "user"}
                      </p>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-300">
                    {post.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{post.likesCount} likes</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
