import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoveLeft, Grid3X3, Bookmark } from "lucide-react";
import ProfilePosts from "@/app/components/ProfilePosts";
import BookmarkPosts from "@/app/components/BookmarkPosts";

type ProfileByUsernamePageProps = {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function ProfileByUsernamePage({
  params,
  searchParams,
}: ProfileByUsernamePageProps) {
  const session = await auth();
  const viewerEmail = session?.user?.email ?? null;

  const { username } = await params;
  const { tab } = await searchParams;

  const profile = await prisma.profile.findUnique({
    where: {
      username,
    },
  });

  if (!profile) {
    notFound();
  }

  const isOwnProfile = viewerEmail === profile.email;
  const activeTab = isOwnProfile && tab === "bookmarks" ? "bookmarks" : "posts";

  const postsCount = await prisma.post.count({
    where: {
      authorEmail: profile.email,
    },
  });

  return (
    <>
      <section className="flex flex-row items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 text-black no-underline hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
        >
          <MoveLeft className="shrink-0" />
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Back
          </span>
        </Link>
      </section>

      <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="size-24 overflow-hidden rounded-full bg-gray-300 md:size-28">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name || profile.username || "Profile"}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : null}
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.name || "Unknown"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{profile.username}
                </p>

                {profile.subtitle ? (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {profile.subtitle}
                  </p>
                ) : null}

                {profile.bio ? (
                  <p className="mt-2 max-w-2xl text-sm text-gray-700 dark:text-gray-200">
                    {profile.bio}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {postsCount}
                </p>
                <p className="text-gray-500 dark:text-gray-400">Posts</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="flex">
              <Link
                href={`/profile/${profile.username}`}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition ${
                  activeTab === "posts"
                    ? "border-b-2 border-black text-black dark:border-white dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Grid3X3 size={16} />
                Posts
              </Link>

              {isOwnProfile ? (
                <Link
                  href={`/profile/${profile.username}?tab=bookmarks`}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition ${
                    activeTab === "bookmarks"
                      ? "border-b-2 border-black text-black dark:border-white dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <Bookmark size={16} />
                  Bookmarks
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-6">
          {activeTab === "bookmarks" && isOwnProfile ? (
            <BookmarkPosts />
          ) : (
            <ProfilePosts email={profile.email} />
          )}
        </section>
      </main>
    </>
  );
}
