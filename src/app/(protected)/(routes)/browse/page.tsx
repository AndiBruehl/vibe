import PostImageCount from "@/app/components/PostImageCount";
import SortablePosts from "@/app/components/SortablePosts";
import { prisma } from "@/db";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import LocalizedText from "@/app/components/LocalizedText";
import ProgressiveImage from "@/app/components/ProgressiveImage";
import ProfileAvatar from "@/app/components/ProfileAvatar";

export default async function BrowsePage() {
  const posts = await prisma.post.findMany({
    where: { isArchived: false },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: {
        select: {
          username: true,
          name: true,
          avatar: true,
          avatarAccent: true,
          avatarAccentEnd: true,
          avatarAccentDirection: true,
        },
      },
    },
  });

  return (
    <main className="pb-24 md:pb-8">
      <section className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="justify-self-start"><Link
          href="/home"
          className="group inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-slate-800 no-underline transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <MoveLeft />
          <span className="hidden opacity-0 transition-opacity duration-200 sm:inline group-hover:opacity-100">
            <LocalizedText en="Back to Home" de="Zurück zur Startseite" />
          </span>
        </Link></div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          <LocalizedText en="Browse" de="Entdecken" />
        </h1>
        <Link href="/profiles" className="justify-self-end inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"><LocalizedText en="Profiles" de="Profile" /></Link>
      </section>

      <section className="mt-6">
        {posts.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
            <p className="text-slate-700 dark:text-slate-300">
              <LocalizedText en="No posts available." de="Keine Beiträge verfügbar." />
            </p>
          </div>
        ) : (
          <SortablePosts posts={posts.map((post) => ({ id: post.id, description: post.description, createdAt: post.createdAt }))} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <PostImageCount images={post.images}/>
              <ProgressiveImage src={post.image} alt={post.description || "Post image"} lockAspectRatio="1 / 1" containerClassName="size-full" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
                </div>

                <div className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <ProfileAvatar {...post.author} alt={post.author?.name || "Author avatar"} sizeClass="size-8" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {post.author?.name || "Unknown"}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        @{post.author?.username || "user"}
                      </p>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{post.description || <LocalizedText en="No description" de="Keine Beschreibung" />}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{post.likesCount} <LocalizedText en="likes" de="Likes" /></span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </SortablePosts>
        )}
      </section>
    </main>
  );
}
