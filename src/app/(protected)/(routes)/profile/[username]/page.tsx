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
import { avatarFrameStyle, normalizeProfileHeaderLayout } from "@/profile-personalization";

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
  const profileHeaderLayout = normalizeProfileHeaderLayout(profile.profileHeaderLayout);

  return (
    <>
      <section className="flex flex-row items-center justify-between"><BackNavigationLink language={de ? "de" : "en"} /></section>

      <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <section className={`overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900 ${profileHeaderLayout === "spotlight" ? "border-2 border-slate-300/90 bg-linear-to-b from-slate-100 to-white shadow-xl dark:border-slate-600 dark:from-slate-800 dark:to-slate-900" : ""}`}>
          <div className={`grid gap-5 p-5 text-center sm:p-6 lg:items-start lg:p-8 lg:text-left ${profileHeaderLayout === "compact" ? "grid-cols-[minmax(0,1fr)_5.5rem] text-left lg:grid-cols-[minmax(0,1fr)_5.5rem]" : profileHeaderLayout === "spotlight" ? "grid-cols-1 gap-7 p-6 lg:grid-cols-1 lg:text-center" : "lg:grid-cols-[7rem_minmax(0,1fr)_auto]"}`}>
            <div className={`flex justify-center lg:block ${profileHeaderLayout === "compact" ? "order-2 self-center justify-self-end lg:order-2 lg:self-center lg:justify-self-end" : profileHeaderLayout === "spotlight" ? "order-2 justify-self-center lg:order-1 lg:justify-self-center" : ""}`}>
              <div className={`${profileHeaderLayout === "compact" ? "size-24 lg:size-28" : profileHeaderLayout === "spotlight" ? "size-40 lg:size-40" : "size-24 lg:size-28"} rounded-full p-1 shadow-lg shadow-slate-900/20`} style={avatarFrameStyle(profile.avatarAccent, profile.avatarAccentEnd, profile.avatarAccentDirection)}><div className="size-full overflow-hidden rounded-full bg-gray-300">
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
              </div></div>
            </div>

              <div className={`min-w-0 ${profileHeaderLayout === "compact" ? "order-1 lg:order-1" : profileHeaderLayout === "spotlight" ? "order-3 text-center lg:order-2 lg:text-center" : ""}`}>
                <h1 className={`${profileHeaderLayout === "spotlight" ? "text-3xl" : "text-2xl"} font-bold text-slate-900 dark:text-white`}>
                  <span className={`inline-flex items-center justify-center gap-2 ${profileHeaderLayout === "spotlight" ? "lg:justify-center" : "lg:justify-start"}`}>{profile.name || "Unknown"}<AdminBadge isAdmin={profile.isAdmin} /><VibeTeamBadge isSystem={profile.isSystem} /></span>
                </h1>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  @{profile.username}
                </p>

                {profile.subtitle && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300"><MentionText text={profile.subtitle} /></p>
                )}

                {profile.bio && (
                  <p className={`mx-auto mt-2 max-w-md whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 ${profileHeaderLayout === "spotlight" ? "lg:mx-auto" : "lg:mx-0"}`}><MentionText text={profile.bio} /></p>
                )}

                {profile.profileLinks.length > 0 && (
                  <ProfileLinks links={profile.profileLinks} language={de ? "de" : "en"} centered={profileHeaderLayout === "spotlight" ? true : "mobile"} accent={profile.profileAccent} />
                )}
                {profile.shoutouts.length > 0 && <ProfileShoutouts shoutouts={profile.shoutouts} language={de ? "de" : "en"} centered={profileHeaderLayout === "spotlight" ? true : "mobile"} />}

                {isOwnProfile && profile.isAdmin && <Link href="/admin" className="mx-auto mt-4 inline-flex w-fit rounded-xl border border-orange-400/60 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-500/10 lg:mx-0">{de ? "Adminbereich" : "Admin area"}</Link>}

                {isSystemProfile && <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{isSupportProfile ? (de ? "Offizieller VIBE-Support · Deine Anfrage wird als Ticket an das Admin-Team weitergeleitet." : "Official VIBE support · Your request is forwarded to the admin team as a ticket.") : (de ? "Offizieller VIBE-Systemaccount · Nachrichten können nicht beantwortet werden." : "Official VIBE system account · Messages cannot be replied to.")}</p>}{isSupportProfile && <Link href="/support" className="mx-auto mt-4 inline-flex rounded-xl bg-linear-to-r from-cyan-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-500/20 transition hover:brightness-110 lg:mx-0">{de ? "Support kontaktieren" : "Contact support"}</Link>}{!isOwnProfile && !isBlocked && !isSystemProfile && <div className="mt-3 flex justify-center lg:block"><ReportButton targetType="profile" targetId={profile.id} targetUrl={`/profile/${encodeURIComponent(profile.username ?? "")}`} /></div>}

                {canDeleteProfile && <div className="mt-3 flex justify-center lg:block"><DeleteProfileButton profileId={profile.id} de={de} /></div>}

                {/* 🔥 FOLLOW BUTTON HIER */}
                {!isOwnProfile && !isSystemProfile && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
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

            <div className={`grid w-full grid-cols-3 gap-3 border-t border-slate-200 pt-5 text-center text-sm dark:border-slate-700 lg:w-auto lg:self-start lg:border-0 lg:pt-2 ${profileHeaderLayout === "compact" ? "order-3 col-span-2 rounded-xl bg-slate-50 px-3 dark:bg-slate-900/25 lg:col-span-2 lg:mt-1 lg:w-full lg:border-t lg:pt-4" : profileHeaderLayout === "spotlight" ? "order-1 rounded-2xl border border-slate-200 bg-white/65 px-4 py-3 shadow-sm dark:border-slate-600 dark:bg-slate-950/30 lg:order-3 lg:mt-1 lg:w-full lg:max-w-lg lg:justify-self-center lg:border lg:pt-4" : ""}`}>
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
