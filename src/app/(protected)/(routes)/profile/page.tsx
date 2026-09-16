import { auth } from "@/auth";
import { Check, CircleHelp, MoveLeft, Settings, Shield } from "lucide-react";
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
import ProfileLinks from "@/app/components/ProfileLinks";
import FollowRequests from "@/app/components/FollowRequests";
import ArchivedPosts from "@/app/components/ArchivedPosts";
import AdminBadge from "@/app/components/AdminBadge";
import { isVibeAdminEmail } from "@/admin";
import ProfileShoutouts from "@/app/components/ProfileShoutouts";
import { avatarFrameStyle, normalizeProfileAccent, normalizeProfileHeaderLayout, normalizeProfileHeaderTextColor, profileHeaderBackgroundStyle } from "@/profile-personalization";

type ProfilePageProps = {
  searchParams: Promise<{
    tab?: string;
    collection?: string;
    archived?: string;
    restored?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    notFound();
  }

  const { tab, collection, archived, restored } = await searchParams;

  const activeTab =
    tab === "bookmarks" || tab === "highlights" || tab === "topics" || tab === "archive"
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
    update: isVibeAdminEmail(session.user.email) ? { isAdmin: true } : {},
    create: {
      email: session.user.email,
      username: generatedUsername,
      name: session.user.name || null,
      isAdmin: isVibeAdminEmail(session.user.email),
    },
  });

  const [postsCount, followersCount, followingCount] = await Promise.all([
    prisma.post.count({ where: { authorEmail: session.user.email, isArchived: false } }),
    prisma.follow.count({ where: { followingId: profile.id } }),
    prisma.follow.count({ where: { followerId: profile.id } }),
  ]);
  const [profileLinks, shoutouts] = await Promise.all([
    prisma.profileLink.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } }),
    prisma.profileShoutout.findMany({ where: { profileId: profile.id }, include: { targetProfile: { select: { username: true, name: true, avatar: true } } }, orderBy: { position: "asc" } }),
  ]);
  const de = profile.language === "de";
  const profileAccent = normalizeProfileAccent(profile.profileAccent);
  const profileHeaderLayout = normalizeProfileHeaderLayout(profile.profileHeaderLayout);
  const headerBackgroundStyle = profileHeaderBackgroundStyle(profile.profileHeaderBackgroundMode, profile.profileHeaderBackgroundImage, profile.profileHeaderBackgroundColor, profile.profileHeaderBackgroundEnd);
  const headerTextColor = normalizeProfileHeaderTextColor(profile.profileHeaderTextColor);
  const avatarSize = profileHeaderLayout === "compact" ? "7.25rem" : profileHeaderLayout === "spotlight" ? "9rem" : "8rem";
  const avatarInnerSize = profileHeaderLayout === "compact" ? "6.75rem" : profileHeaderLayout === "spotlight" ? "8.5rem" : "7.5rem";
  const avatarImageSize = profileHeaderLayout === "compact" ? "6.25rem" : profileHeaderLayout === "spotlight" ? "8rem" : "7rem";

  return (
    <main className={`mx-auto w-full max-w-5xl ${profileHeaderLayout === "spotlight" ? "rounded-3xl border border-slate-200 bg-slate-50/60 px-4 py-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/25 sm:px-7" : ""}`}>
      <section className="relative flex items-center justify-between">
        <Link
          href="/home"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-400 dark:hover:text-slate-500"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {de ? "Zurück zur Startseite" : "Back to Home"}
          </span>
        </Link>

        <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
          {profile.username || "user"}
          <div className="inline-flex size-5 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white">
            <Check size={16} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <Link
            href="/settings"
            className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-400 dark:hover:text-slate-500"
          >
            <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {de ? "Einstellungen" : "Settings"}
            </span>
            <Settings />
          </Link>
        </div>
      </section>

      <div className={`${profileHeaderLayout === "compact" ? "mx-auto mt-6 flex max-w-3xl flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-left sm:flex-row-reverse sm:items-start dark:border-slate-700/80 dark:bg-slate-800/30" : profileHeaderLayout === "spotlight" ? "mx-auto mt-6 max-w-4xl rounded-3xl border border-slate-200 bg-white/60 p-6 text-center shadow-lg shadow-slate-900/5 dark:border-slate-700/80 dark:bg-slate-900/25 dark:shadow-black/15" : "mx-auto mt-6 max-w-4xl rounded-3xl p-5 text-center"} ${headerBackgroundStyle ? "text-white [&_*]:!text-[color:inherit]" : ""}`} style={headerBackgroundStyle ? { ...headerBackgroundStyle, color: headerTextColor } : undefined}>
      <section className={`flex justify-center ${profileHeaderLayout === "compact" ? "mt-0 shrink-0 justify-start" : profileHeaderLayout === "spotlight" ? "mt-0 mb-2" : "mt-6"}`}>
        <div className="flex items-center justify-center rounded-full" style={{ ...avatarFrameStyle(profile.avatarAccent, profile.avatarAccentEnd, profile.avatarAccentDirection), width: avatarSize, height: avatarSize }}>
          <div className="flex items-center justify-center rounded-full bg-white dark:bg-slate-900" style={{ width: avatarInnerSize, height: avatarInnerSize }}>
            <div className="relative aspect-square overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: avatarImageSize, height: avatarImageSize }}>
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

      <section className={`mx-0 text-left ${profileHeaderLayout === "compact" ? "mt-0 max-w-2xl" : profileHeaderLayout === "spotlight" ? "mt-2 max-w-4xl" : "mt-5 max-w-3xl"}`}>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          <span className={`inline-flex items-center gap-2 ${profileHeaderLayout === "compact" ? "justify-start" : "justify-center"}`}>{profile.name || (de ? "Nutzer" : "User")}<AdminBadge isAdmin={profile.isAdmin} /></span>
        </h1>

        <p className="my-1 text-slate-600 dark:text-slate-300">
          {profile.subtitle || ""}
        </p>

        <p className="text-slate-700 dark:text-slate-300">
          {profile.bio || ""}
        </p>
        <Link
          href="/support"
          className={`${profileHeaderLayout === "compact" ? "mx-0" : "mx-auto"} mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-cyan-50/70 px-4 py-2 text-sm font-bold text-cyan-800 no-underline transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-100 dark:border-cyan-400/40 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20`}
        >
          <CircleHelp size={16} aria-hidden="true" />
          {de ? "Hilfe & Support" : "Help & support"}
        </Link>
        {profile.isAdmin ? <div className={`mt-4 flex flex-col ${profileHeaderLayout === "compact" ? "items-start" : "items-center"}`}> <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-orange-600 no-underline transition hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-500/10"
          >
            <Shield size={16} />
            {de ? "Adminbereich" : "Admin area"}
          </Link></div> : null}
        {profileLinks.length > 0 && (
          <div className="mt-4"><ProfileLinks links={profileLinks} language={de ? "de" : "en"} centered={profileHeaderLayout !== "compact"} accent={profileAccent} /></div>
        )}
        {shoutouts.length > 0 && <ProfileShoutouts shoutouts={shoutouts} language={de ? "de" : "en"} centered={profileHeaderLayout !== "compact"} />}
      </section>
      </div>

      <section className="mt-5 flex justify-center gap-10 text-center text-sm">
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

      <section className="mt-5">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link
            className={
              activeTab === "posts"
                ? "font-bold underline text-(--ig-red)"
                : "font-medium text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }
            href="/profile?tab=posts"
            style={activeTab === "posts" ? { color: profileAccent, textDecorationColor: profileAccent } : undefined}
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
            style={activeTab === "highlights" ? { color: profileAccent, textDecorationColor: profileAccent } : undefined}
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
            style={activeTab === "bookmarks" ? { color: profileAccent, textDecorationColor: profileAccent } : undefined}
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
            style={activeTab === "topics" ? { color: profileAccent, textDecorationColor: profileAccent } : undefined}
          >
            {de ? "Themen" : "Topics"}
          </Link>

          <Link
            className={activeTab === "archive" ? "font-bold underline text-(--ig-red)" : "font-medium text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}
            href="/profile?tab=archive"
            style={activeTab === "archive" ? { color: profileAccent, textDecorationColor: profileAccent } : undefined}
          >
            {de ? "Archiv" : "Archive"}
          </Link>
        </div>
      </section>

      {profile.isPrivate ? <FollowRequests profileId={profile.id} language={de ? "de" : "en"} /> : null}

      {archived === "1" && <div role="status" className="mt-4 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800 dark:border-orange-400/40 dark:bg-orange-400/10 dark:text-orange-200">{de ? "Der Beitrag wurde archiviert und ist nur noch für dich sichtbar." : "The post was archived and is now visible only to you."}</div>}
      {restored === "1" && <div role="status" className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200">{de ? "Der Beitrag ist wieder auf deinem Profil sichtbar." : "The post is visible on your profile again."}</div>}

      <section className="mt-4">
        <Suspense fallback={de ? "Beiträge werden geladen..." : "Loading posts..."}>
          {activeTab === "posts" ? (
            <ProfilePosts email={session.user.email} />
          ) : activeTab === "bookmarks" ? (
            <BookmarkPosts email={session.user.email} collectionId={collection} language={de ? "de" : "en"} />
          ) : activeTab === "highlights" ? (
            <HighlightsPosts />
          ) : activeTab === "archive" ? (
            <ArchivedPosts email={session.user.email} language={de ? "de" : "en"} />
          ) : (
            <ProfileTopics email={session.user.email} />
          )}
        </Suspense>
      </section>
    </main>
  );
}
