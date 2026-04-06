import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";

export default async function BookmarkPosts({ email }: { email: string }) {
  const bookmarks = await prisma.postBookmark.findMany({
    where: {
      authorEmail: email,
    },
    include: {
      post: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
        <p className="text-gray-600 dark:text-gray-300">
          No bookmarked posts yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {bookmarks.map(({ post }) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="group block overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"
        >
          <article>
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.description || "Bookmarked post image"}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                unoptimized
              />
            </div>

            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-200">
                {post.description || "No description"}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{post.likesCount} likes</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
