import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link"; // Re-enable topic chips

export default async function ProfilePosts({ email }: { email: string }) {
  const posts = await prisma.post.findMany({
    where: {
      authorEmail: email,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: { topics: { include: { topic: true } } },
  });

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
        <p className="text-gray-600 dark:text-gray-300">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {posts.map((post) => (
        <article
          key={post.id}
          className="group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"
        >
          <Link href={`/posts/${post.id}`} className="block">
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.description || "Post image"}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </div>

            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-200">
                {post.description || "No description"}
              </p>
            </div>
          </Link>

          <div className="space-y-2 px-3 pb-3">
            {post.topics?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.topics.map((postTopic) => (
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

            <Link href={`/posts/${post.id}`} className="block">
              <div className="flex items-center justify-between text-xs text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <span>{post.likesCount} likes</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
