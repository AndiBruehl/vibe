import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { Grid3X3, Bookmark, Lock } from "lucide-react";
import ProfilePosts from "@/app/components/ProfilePosts";
import BookmarkPosts from "@/app/components/BookmarkPosts";
import MentionText from "@/app/components/MentionText";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import ProfileLinks from "@/app/components/ProfileLinks";
import ProfileActionControls from "@/app/components/ProfileActionControls";
import ReportButton from "@/app/components/ReportButton";
import AdminBadge from "@/app/components/AdminBadge";
import VibeTeamBadge from "@/app/components/VibeTeamBadge";
import { isProtectedAdmin, isSuperAdmin } from "@/admin";
import DeleteProfileButton from "@/app/components/DeleteProfileButton";
import ProfileShoutouts from "@/app/components/ProfileShoutouts";
import { normalizeAvatarAccent } from "@/profile-personalization";

type ProfileByUsernamePageProps = {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    tab?: string;
    collection?: string;
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
  const { tab, collection } = await searchParams;

  const [profile, viewerProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { username }, include: { profileLinks: { orderBy: { position: "asc" } }, shoutouts: { include: { targetProfile: { select: { username: true, name: true, avatar: true } } }, orderBy: { position: "asc" } } } }),
    viewerEmail
      ? prisma.profile.findUnique({ where: { email: viewerEmail }, select: { id: true, language: true, isAdmin: true } })
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
  const avatarAccent = normalizeAvatarAccent(profile.avatarAccent);
  const isOwnProfile = viewerEmail === profile.email;
  const isSystemProfile = profile.isSystem;
  const isSupportProfile = profile.systemKind === "support";
  const canDeleteProfile = !isOwnProfile && !isSystemProfile && isSuperAdmin(viewerEmail) && !isProtectedAdmin(profile.email);
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

  let followState: "following" | "requested" | "none" = "none";
  let isBlocked = false;
  let blockedByViewer = false;

  if (!isOwnProfile && viewerProfile?.id) {
    const [existingFollow, existingRequest, viewerBlock, profileBlock] = await Promise.all([
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerProfile.id, followingId: profile.id } },
        select: { id: true },
      }),
      prisma.followRequest.findUnique({
        where: { followerId_followingId: { followerId: viewerProfile.id, followingId: profile.id } },
        select: { id: true },
      }),
      prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: viewerProfile.id, blockedId: profile.id } }, select: { id: true } }),
      prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: profile.id, blockedId: viewerProfile.id } }, select: { id: true } }),
    ]);
    blockedByViewer = Boolean(viewerBlock);
    isBlocked = blockedByViewer || Boolean(profileBlock);
    followState = existingFollow ? "following" : existingRequest ? "requested" : "none";
  }
  const canViewPosts = !isBlocked && (!profile.isPrivate || isOwnProfile || followState === "following");

  return (
    <>
      <section className="flex flex-row items-center justify-between"><BackNavigationLink language={de ? "de" : "en"} /></section>

      <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
          <div className="grid gap-5 p-5 text-center sm:p-6 md:grid-cols-[7rem_minmax(0,1fr)_auto] md:items-start md:p-8 md:text-left">
            <div className="flex justify-center md:block">
              <div className="size-24 overflow-hidden rounded-full border-4 bg-gray-300 md:size-28" style={{ borderColor: avatarAccent }}>
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
            </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  <span className="inline-flex items-center justify-center gap-2 md:justify-start">{profile.name || "Unknown"}<AdminBadge isAdmin={profile.isAdmin} /><VibeTeamBadge isSystem={profile.isSystem} /></span>
                </h1>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  @{profile.username}
                </p>

                {profile.subtitle && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300"><MentionText text={profile.subtitle} /></p>
                )}

                {profile.bio && (
                  <p className="mx-auto mt-2 max-w-md whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 md:mx-0"><MentionText text={profile.bio} /></p>
                )}

                {profile.profileLinks.length > 0 && (
                  <ProfileLinks links={profile.profileLinks} language={de ? "de" : "en"} centered="mobile" />
                )}
                {profile.shoutouts.length > 0 && <ProfileShoutouts shoutouts={profile.shoutouts} language={de ? "de" : "en"} centered="mobile" />}

                {isOwnProfile && profile.isAdmin && <Link href="/admin" className="mx-auto mt-4 inline-flex w-fit rounded-xl border border-orange-400/60 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-500/10 md:mx-0">{de ? "Adminbereich" : "Admin area"}</Link>}

                {isSystemProfile && <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{isSupportProfile ? (de ? "Offizieller VIBE-Support · Deine Anfrage wird als Ticket an das Admin-Team weitergeleitet." : "Official VIBE support · Your request is forwarded to the admin team as a ticket.") : (de ? "Offizieller VIBE-Systemaccount · Nachrichten können nicht beantwortet werden." : "Official VIBE system account · Messages cannot be replied to.")}</p>}{isSupportProfile && <Link href="/support" className="mx-auto mt-4 inline-flex rounded-xl bg-linear-to-r from-cyan-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-500/20 transition hover:brightness-110 md:mx-0">{de ? "Support kontaktieren" : "Contact support"}</Link>}{!isOwnProfile && !isBlocked && !isSystemProfile && <div className="mt-3 flex justify-center md:block"><ReportButton targetType="profile" targetId={profile.id} targetUrl={`/profile/${encodeURIComponent(profile.username ?? "")}`} /></div>}

                {canDeleteProfile && <div className="mt-3 flex justify-center md:block"><DeleteProfileButton profileId={profile.id} de={de} /></div>}

                {/* 🔥 FOLLOW BUTTON HIER */}
                {!isOwnProfile && !isSystemProfile && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                    <ProfileActionControls
                      targetProfileId={profile.id}
                      targetUsername={profile.username || ""}
                      returnTo={`/profile/${encodeURIComponent(profile.username)}`}
                      followState={followState}
                      blockedByViewer={blockedByViewer}
                      blockedByOther={isBlocked && !blockedByViewer}
                      language={de ? "de" : "en"}
                    />
                  </div>
                )}
              </div>

            <div className="grid w-full grid-cols-3 gap-3 border-t border-slate-200 pt-5 text-center text-sm dark:border-slate-700 md:w-auto md:self-start md:border-0 md:pt-2">
              <div className="min-w-12">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {postsCount}
                </p>
                <p className="text-slate-500 dark:text-slate-400">Posts</p>
              </div>
              <Link
                href={`/profile/${encodeURIComponent(profile.username ?? "")}/connections?list=followers`}
                className="min-w-12 transition hover:opacity-70"
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  {followersCount}
                </p>
                <p className="text-slate-500 dark:text-slate-400">Followers</p>
              </Link>
              <Link
                href={`/profile/${encodeURIComponent(profile.username ?? "")}/connections?list=following`}
                className="min-w-12 transition hover:opacity-70"
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  {followingCount}
                </p>
                <p className="text-slate-500 dark:text-slate-400">{de ? "Folgt" : "Following"}</p>
              </Link>
            </div>
          </div>

          {canViewPosts ? <div className="border-t border-gray-200 dark:border-gray-700">
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
          </div> : null}
        </section>

        <section className="mt-6">
          {!canViewPosts ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <Lock className="mx-auto text-orange-500" size={28} />
              <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{isBlocked ? (de ? "Beiträge sind nicht verfügbar" : "Posts are not available") : (de ? "Dieses Profil ist privat" : "This account is private")}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{isBlocked ? (de ? "Zwischen euch besteht eine Blockierung." : "There is a block between these profiles.") : (de ? "Folge diesem Profil, um seine Beiträge zu sehen." : "Follow this account to see its posts.")}</p>
            </div>
          ) : activeTab === "bookmarks" && isOwnProfile ? (
            <BookmarkPosts email={profile.email} collectionId={collection} language={de ? "de" : "en"} />
          ) : (
            <ProfilePosts email={profile.email} />
          )}
        </section>
      </main>
    </>
  );
}
