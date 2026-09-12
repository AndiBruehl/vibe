import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { MoveLeft, Grid3X3, Bookmark } from "lucide-react";
import ProfilePosts from "@/app/components/ProfilePosts";
import BookmarkPosts from "@/app/components/BookmarkPosts";
import FollowButton from "@/app/components/FollowButton";
import MessageButton from "@/app/components/MessageButton";
import MentionText from "@/app/components/MentionText";
import BackNavigationLink from "@/app/components/BackNavigationLink";

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

  const { username: routeUsername } = await params;
  let username = routeUsername;

  try {
    username = decodeURIComponent(routeUsername);
  } catch {
    // Next.js normally decodes route segments. Keep the original value for malformed URLs.
  }
  const { tab } = await searchParams;

  const [profile, viewerProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { username } }),
    viewerEmail
      ? prisma.profile.findUnique({ where: { email: viewerEmail }, select: { language: true } })
      : null,
  ]);

  if (!profile) {
    const de = viewerProfile?.language === "de";
    return (
      <>
        <section className="flex flex-row items-center justify-between">
          <BackNavigationLink language={de ? "de" : "en"} />
        </section>
        <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center p-4 md:p-8">
          <section className="w-full rounded-2xl bg-white p-8 text-center shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{de ? "Profil nicht gefunden" : "Profile not found"}</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{de ? "Entschuldigung, es wurde kein Nutzer mit diesem Handle gefunden." : "Sorry, no user with that handle found."}</p>
            <p className="mt-2 font-semibold text-slate-900 dark:text-white">@{username}</p>
          </section>
        </main>
      </>
    );
  }

  const de = viewerProfile?.language === "de";
  const isOwnProfile = viewerEmail === profile.email;
  const activeTab = isOwnProfile && tab === "bookmarks" ? "bookmarks" : "posts";

  const [postsCount, followersCount, followingCount] = await Promise.all([
    prisma.post.count({
      where: {
        authorEmail: profile.email,
      },
    }),
    prisma.follow.count({ where: { followingId: profile.id } }),
    prisma.follow.count({ where: { followerId: profile.id } }),
  ]);

  let isFollowing = false;

  if (!isOwnProfile && viewerEmail) {
    const viewerProfile = await prisma.profile.findUnique({
      where: {
        email: viewerEmail,
      },
      select: {
        id: true,
      },
    });

    if (viewerProfile) {
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerProfile.id,
            followingId: profile.id,
          },
        },
        select: {
          id: true,
        },
      });

      isFollowing = !!existingFollow;
    }
  }

  return (
    <>
      <section className="flex flex-row items-center justify-between">
        <Link
          href="/home"
          className="group flex items-center gap-2 text-slate-900 no-underline hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
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
            {/* LEFT SIDE */}
            <div className="flex items-start gap-4">
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

              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {profile.name || "Unknown"}
                </h1>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  @{profile.username}
                </p>

                {profile.subtitle && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300"><MentionText text={profile.subtitle} /></p>
                )}

                {profile.bio && (
                  <p className="mt-2 max-w-md whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200"><MentionText text={profile.bio} /></p>
                )}

                {/* 🔥 FOLLOW BUTTON HIER */}
                {!isOwnProfile && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <FollowButton
                      targetProfileId={profile.id}
                      targetUsername={profile.username || ""}
                      isFollowing={isFollowing}
                    />
                    <MessageButton targetProfileId={profile.id} />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE (STATS) */}
            <div className="flex gap-6 text-sm">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {postsCount}
                </p>
                <p className="text-slate-500 dark:text-slate-400">Posts</p>
              </div>
              <Link
                href={`/profile/${encodeURIComponent(profile.username ?? "")}/connections?list=followers`}
                className="transition hover:opacity-70"
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  {followersCount}
                </p>
                <p className="text-slate-500 dark:text-slate-400">Followers</p>
              </Link>
              <Link
                href={`/profile/${encodeURIComponent(profile.username ?? "")}/connections?list=following`}
                className="transition hover:opacity-70"
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  {followingCount}
                </p>
                <p className="text-slate-500 dark:text-slate-400">{de ? "Folgt" : "Following"}</p>
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="flex">
              <Link
                href={`/profile/${encodeURIComponent(profile.username ?? "")}`}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition ${
                  activeTab === "posts"
                    ? "border-b-2 border-black text-slate-900 dark:border-white dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Grid3X3 size={16} />
                Posts
              </Link>

              {isOwnProfile ? (
                <Link
                  href={`/profile/${encodeURIComponent(profile.username)}?tab=bookmarks`}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition ${
                    activeTab === "bookmarks"
                      ? "border-b-2 border-black text-slate-900 dark:border-white dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
            <BookmarkPosts email={profile.email} />
          ) : (
            <ProfilePosts email={profile.email} />
          )}
        </section>
      </main>
    </>
  );
}
