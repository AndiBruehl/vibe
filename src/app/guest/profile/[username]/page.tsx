import type { Metadata } from "next";
import { prisma } from "@/db";
import { guestAuthorSelect, publicProfileWhere } from "@/guest-content";
import GuestJoinPrompt from "@/app/components/GuestJoinPrompt";
import GuestPosts, { GuestUnavailable } from "@/app/components/GuestPosts";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import LocalizedText from "@/app/components/LocalizedText";
import AdminBadge from "@/app/components/AdminBadge";
import MentionText from "@/app/components/MentionText";
import ProfileLinks from "@/app/components/ProfileLinks";
import ProfileShoutouts from "@/app/components/ProfileShoutouts";
import ProfileMilestones from "@/app/components/ProfileMilestones";
import { avatarFrameStyle, normalizeProfileHeaderLayout, normalizeProfileHeaderTextColor, profileHeaderBackgroundStyle } from "@/profile-personalization";
import { ArrowLeft, Globe2, Grid3X3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicProfileMetadata } from "@/public-page-metadata";

type GuestProfileProps = { params: Promise<{ username: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: GuestProfileProps): Promise<Metadata> {
  const { username } = await params;
  return publicProfileMetadata(username);
}

function displayCount(count: number | null) {
  return typeof count === "number" ? count.toLocaleString("en") : "Unavailable";
}

export default async function GuestProfile({ params, searchParams }: GuestProfileProps) {
  const { username } = await params;
  let profile;
  try {
    profile = await prisma.profile.findFirst({
      where: { username, ...publicProfileWhere },
      select: {
        id: true,
        email: true,
        ...guestAuthorSelect,
        bio: true,
        subtitle: true,
        isAdmin: true,
        isVerified: true,
        profileBadges: true,
        hiddenProfileBadges: true,
        hiddenMilestoneBadges: true,
        milestoneBadges: true,
        profileAccent: true,
        profileHeaderLayout: true,
        profileHeaderBackgroundMode: true,
        profileHeaderBackgroundImage: true,
        profileHeaderBackgroundColor: true,
        profileHeaderBackgroundEnd: true,
        profileHeaderTextColor: true,
        showProfileLinks: true,
        showProfileShoutouts: true,
        profileLinks: { orderBy: { position: "asc" }, select: { id: true, label: true, url: true } },
        shoutouts: { include: { targetProfile: { select: { username: true, name: true, avatar: true, isPrivate: true } } }, orderBy: { position: "asc" } },
      },
    });
  } catch { return <GuestUnavailable/>; }
  if (!profile) notFound();

  const query = await searchParams;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(query.page) || 1)));
  const profileHeaderLayout = normalizeProfileHeaderLayout(profile.profileHeaderLayout);
  const headerBackgroundStyle = profileHeaderBackgroundStyle(profile.profileHeaderBackgroundMode, profile.profileHeaderBackgroundImage, profile.profileHeaderBackgroundColor, profile.profileHeaderBackgroundEnd);
  const headerTextColor = normalizeProfileHeaderTextColor(profile.profileHeaderTextColor);
  const hasHeaderBackground = Boolean(headerBackgroundStyle);
  const hasLeftAlignedHeaderContent = profileHeaderLayout === "compact" || (profileHeaderLayout === "standard" && hasHeaderBackground);
  const showLinks = profile.showProfileLinks !== false;
  const showShoutouts = profile.showProfileShoutouts !== false;
  const profileLinks = Array.isArray(profile.profileLinks) ? profile.profileLinks : [];
  const publicShoutouts = Array.isArray(profile.shoutouts) ? profile.shoutouts.filter((shoutout) => shoutout.targetProfile?.isPrivate !== true) : [];
  const [postsCount, followersCount, followingCount] = await Promise.all([
    prisma.post.count({ where: { authorEmail: profile.email, isArchived: false } }).catch(() => null),
    prisma.follow.count({ where: { followingId: profile.id } }).catch(() => null),
    prisma.follow.count({ where: { followerId: profile.id } }).catch(() => null),
  ]);

  return <>
    <Link href="/profiles" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-orange-400/40 px-3 text-sm font-bold text-orange-600 transition hover:bg-orange-500/10 dark:text-orange-200"><ArrowLeft size={16}/><LocalizedText en="Back to public profiles" de="Zurück zu öffentlichen Profilen"/></Link>
    <header className={`mb-6 overflow-hidden rounded-2xl border border-slate-400/20 p-6 text-center shadow-lg ${hasHeaderBackground ? "text-white [&_*]:!text-[color:inherit]" : ""} ${profileHeaderLayout === "spotlight" ? "border-2 border-slate-300/80 bg-linear-to-b from-slate-100 to-white dark:border-slate-600 dark:from-slate-800 dark:to-slate-900" : ""}`} style={hasHeaderBackground ? { ...headerBackgroundStyle, color: headerTextColor } : undefined}>
      <div className={`${profileHeaderLayout === "compact" ? "grid grid-cols-[minmax(0,1fr)_6rem] items-start gap-4 text-left sm:grid-cols-[minmax(0,1fr)_9rem] lg:grid-cols-[minmax(0,1fr)_13rem]" : profileHeaderLayout === "spotlight" ? "flex flex-col items-center gap-4" : "flex flex-col items-center gap-3"}`}>
        <div className={`${profileHeaderLayout === "compact" ? "order-2 justify-self-end" : ""}`}>
          <div className={`${profileHeaderLayout === "compact" ? "size-24 sm:size-36 lg:size-52" : profileHeaderLayout === "spotlight" ? "size-40" : "size-28"} rounded-full p-1 shadow-lg shadow-slate-900/20`} style={avatarFrameStyle(profile.avatarAccent, profile.avatarAccentEnd, profile.avatarAccentDirection)}>
            <ProfileAvatar {...profile} sizeClass="size-full"/>
          </div>
        </div>
        <div className={`${profileHeaderLayout === "compact" ? "order-1 min-w-0" : "min-w-0"}`}>
          <h1 className={`${profileHeaderLayout === "spotlight" ? "text-3xl" : profileHeaderLayout === "compact" ? "text-2xl lg:text-3xl" : "text-2xl"} font-bold`}>{profile.name || profile.username}</h1>
          <div className={`mt-1 flex flex-wrap items-center gap-1.5 ${profileHeaderLayout === "compact" ? "justify-start" : "justify-center"}`}><AdminBadge isAdmin={profile.isAdmin} isVerified={profile.isVerified} badges={profile.profileBadges} hiddenBadges={profile.hiddenProfileBadges} showCurated showLabels centered={profileHeaderLayout !== "compact"} /></div>
          <p className="mt-1 opacity-80">@{profile.username}</p>
          <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-100 ${profileHeaderLayout === "compact" ? "" : "mx-auto"}`}><Globe2 size={12}/><LocalizedText en="Public profile" de="Öffentliches Profil" /></p>
          {profile.subtitle && <p className="mt-3"><MentionText text={profile.subtitle}/></p>}
          {profile.bio && <p className={`mt-3 whitespace-pre-wrap break-words ${profileHeaderLayout === "spotlight" ? "mx-auto max-w-md" : ""}`}><MentionText text={profile.bio}/></p>}
          {showLinks && profileLinks.length > 0 && <ProfileLinks links={profileLinks} language="en" centered={hasLeftAlignedHeaderContent ? false : profileHeaderLayout === "spotlight" ? true : "mobile"} accent={profile.profileAccent} />}
          {showShoutouts && publicShoutouts.length > 0 && <ProfileShoutouts shoutouts={publicShoutouts} language="en" centered={hasLeftAlignedHeaderContent ? false : profileHeaderLayout === "spotlight" ? true : "mobile"} />}
          <ProfileMilestones milestones={profile.milestoneBadges} hiddenMilestones={profile.hiddenMilestoneBadges} language="en" centered={hasLeftAlignedHeaderContent ? false : profileHeaderLayout === "spotlight" ? true : "mobile"} />
        </div>
        <div className={`${profileHeaderLayout === "compact" ? "order-3 col-span-2" : ""} grid w-full grid-cols-3 gap-3 border-t border-slate-300/35 pt-5 text-center text-sm dark:border-slate-600/60 ${profileHeaderLayout === "spotlight" ? "max-w-lg rounded-2xl border border-slate-300/40 bg-white/20 px-4 py-3 shadow-sm dark:border-slate-600/50" : profileHeaderLayout === "compact" ? "rounded-xl bg-white/20 px-3 dark:bg-slate-950/20" : ""}`}>
          <div className="min-w-12"><p className="font-semibold">{displayCount(postsCount)}</p><p className="opacity-75">Posts</p></div>
          <div className="min-w-12"><p className="font-semibold">{displayCount(followersCount)}</p><p className="opacity-75">Followers</p></div>
          <div className="min-w-12"><p className="font-semibold">{displayCount(followingCount)}</p><p className="opacity-75">Following</p></div>
        </div>
      </div>
    </header>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="inline-flex items-center gap-2 font-bold"><Grid3X3 size={17}/><LocalizedText en="Public posts" de="Öffentliche Beiträge"/></h2>
      <div className="w-full sm:max-w-md"><GuestJoinPrompt compact /></div>
    </div>
    <GuestPosts username={username} page={page}/>
  </>;
}
