import { auth } from "@/auth";
import { Check, MoveLeft, Settings } from "lucide-react";
import Link from "next/link";
import img1 from "./default.jpg";
import { prisma } from "@/db";
import ProfilePosts from "@/app/components/ProfilePosts";
import BookmarkPosts from "@/app/components/BookmarkPosts";
import HighlightsPosts from "@/app/components/HighlightsPosts";
import ProfileTopics from "@/app/components/ProfileTopics";
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { randomUUID } from "crypto";

type ProfilePageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    notFound();
  }

  const { tab } = await searchParams;

  const activeTab =
    tab === "bookmarks" || tab === "highlights" || tab === "topics"
      ? tab
      : "posts";

  // Aus der E-Mail einen einfachen Basisnamen erzeugen.
  // Beispiel:
  // andreas@example.com -> andreas-a1b2c3d4
  const emailBase =
    session.user.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 20) || "user";

  const generatedUsername = `${emailBase}-${randomUUID().slice(0, 8)}`;

  const profile = await prisma.profile.upsert({
    where: {
      email: session.user.email,
    },
    update: {},
    create: {
      email: session.user.email,
      username: generatedUsername,
      name: session.user.name || null,
    },
  });

  const [postsCount, followersCount, followingCount] = await Promise.all([
    prisma.post.count({ where: { authorEmail: session.user.email } }),
    prisma.follow.count({ where: { followingId: profile.id } }),
    prisma.follow.count({ where: { followerId: profile.id } }),
  ]);
  const de = profile.language === "de";

  return (
    <main>
      <section className="flex items-center justify-between">
        <Link
          href="/home"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-400 dark:hover:text-slate-500"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {de ? "Zurück zur Startseite" : "Back to Home"}
          </span>
        </Link>

        <div className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
          {profile.username || "user"}
          <div className="inline-flex size-5 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white">
            <Check size={16} />
          </div>
        </div>

        <Link
          href="/settings"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-400 dark:hover:text-slate-500"
        >
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {de ? "Einstellungen" : "Settings"}
          </span>
          <Settings />
        </Link>
      </section>

      <section className="mt-8 flex justify-center">
        <div className="flex size-44 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red)">
          <div className="flex size-42 items-center justify-center rounded-full bg-white dark:bg-slate-900">
            <div className="relative size-40 aspect-square overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <Image
                src={profile.avatar || img1.src}
                alt="Avatar"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 text-center">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {profile.name || (de ? "Nutzer" : "User")}
        </h1>

        <p className="my-1 text-slate-600 dark:text-slate-300">
          {profile.subtitle || ""}
        </p>

        <p className="text-slate-700 dark:text-slate-300">
          {profile.bio || ""}
        </p>
      </section>

      <section className="mt-6 flex justify-center gap-8 text-center text-sm">
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{postsCount}</p>
          <p className="text-slate-500 dark:text-slate-400">{de ? "Beiträge" : "Posts"}</p>
        </div>
        <Link
          href={`/profile/${encodeURIComponent(profile.username ?? "")}/connections?list=followers`}
          className="transition hover:opacity-70"
        >
          <p className="font-bold text-slate-900 dark:text-white">{followersCount}</p>
          <p className="text-slate-500 dark:text-slate-400">{de ? "Follower" : "Followers"}</p>
        </Link>
        <Link
          href={`/profile/${encodeURIComponent(profile.username ?? "")}/connections?list=following`}
          className="transition hover:opacity-70"
        >
          <p className="font-bold text-slate-900 dark:text-white">{followingCount}</p>
          <p className="text-slate-500 dark:text-slate-400">{de ? "Folgt" : "Following"}</p>
        </Link>
      </section>

      <section className="mt-4">
        <div className="flex justify-center gap-6">
          <Link
            className={
              activeTab === "posts"
                ? "font-bold underline text-(--ig-red)"
                : "font-medium text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }
            href="/profile?tab=posts"
          >
            {de ? "Beiträge" : "Posts"}
          </Link>

          <Link
            className={
              activeTab === "highlights"
                ? "font-bold underline text-(--ig-red)"
                : "font-medium text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }
            href="/profile?tab=highlights"
          >
            Highlights
          </Link>

          <Link
            className={
              activeTab === "bookmarks"
                ? "font-bold underline text-(--ig-red)"
                : "font-medium text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }
            href="/profile?tab=bookmarks"
          >
            {de ? "Gespeichert" : "Bookmarks"}
          </Link>

          <Link
            className={
              activeTab === "topics"
                ? "font-bold underline text-(--ig-red)"
                : "font-medium text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }
            href="/profile?tab=topics"
          >
            {de ? "Themen" : "Topics"}
          </Link>
        </div>
      </section>

      <section className="mt-4">
        <Suspense fallback={de ? "Beiträge werden geladen..." : "Loading posts..."}>
          {activeTab === "posts" ? (
            <ProfilePosts email={session.user.email} />
          ) : activeTab === "bookmarks" ? (
            <BookmarkPosts email={session.user.email} />
          ) : activeTab === "highlights" ? (
            <HighlightsPosts />
          ) : (
            <ProfileTopics email={session.user.email} />
          )}
        </Suspense>
      </section>
    </main>
  );
}
