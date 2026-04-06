import { auth } from "@/auth";
import { Check, MoveLeft, Settings } from "lucide-react";
import Link from "next/link";
import img1 from "./default.jpg";
import { prisma } from "@/db";
import ProfilePosts from "@/app/components/ProfilePosts";
import BookmarkPosts from "@/app/components/BookmarkPosts";
import HighlightsPosts from "@/app/components/HighlightsPosts";
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";

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

  const activeTab = tab === "bookmarks" || tab === "highlights" ? tab : "posts";

  const profile = await prisma.profile.findFirstOrThrow({
    where: {
      email: session.user.email,
    },
  });

  return (
    <main>
      <section className="flex items-center justify-between">
        <Link
          href="/home"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-200 dark:hover:text-slate-300"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Back to Home
          </span>
        </Link>

        <div className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
          {profile.username}
          <div className="inline-flex size-5 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white">
            <Check size={16} />
          </div>
        </div>

        <Link
          href="/settings"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-200 dark:hover:text-slate-300"
        >
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Settings
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
          {profile.name}
        </h1>
        <p className="my-1 text-slate-600 dark:text-slate-300">
          {profile.subtitle}
        </p>
        <p className="text-slate-700 dark:text-slate-300">{profile.bio}</p>
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
            Posts
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
            Bookmarks
          </Link>
        </div>
      </section>

      <section className="mt-4">
        <Suspense fallback="Loading posts...">
          {activeTab === "posts" ? (
            <ProfilePosts email={session.user.email} />
          ) : activeTab === "bookmarks" ? (
            <BookmarkPosts email={session.user.email} />
          ) : (
            <HighlightsPosts />
          )}
        </Suspense>
      </section>
    </main>
  );
}
