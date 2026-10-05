import { prisma } from "@/db";
import { guestAuthorSelect, publicProfileWhere } from "@/guest-content";
import GuestPosts, { GuestUnavailable } from "@/app/components/GuestPosts";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import LocalizedText from "@/app/components/LocalizedText";
import AdminBadge from "@/app/components/AdminBadge";
import MentionText from "@/app/components/MentionText";
import { avatarFrameStyle, normalizeProfileHeaderLayout, normalizeProfileHeaderTextColor, profileHeaderBackgroundStyle } from "@/profile-personalization";
import { notFound } from "next/navigation";

export default async function GuestProfile({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ page?: string }> }) {
  const { username } = await params;
  let profile;
  try {
    profile = await prisma.profile.findFirst({
      where: { username, ...publicProfileWhere },
      select: {
        ...guestAuthorSelect,
        bio: true,
        subtitle: true,
        isAdmin: true,
        isVerified: true,
        profileBadges: true,
        hiddenProfileBadges: true,
        profileAccent: true,
        profileHeaderLayout: true,
        profileHeaderBackgroundMode: true,
        profileHeaderBackgroundImage: true,
        profileHeaderBackgroundColor: true,
        profileHeaderBackgroundEnd: true,
        profileHeaderTextColor: true,
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

  return <>
    <header className={`mb-6 overflow-hidden rounded-2xl border border-slate-400/20 p-6 text-center shadow-lg ${hasHeaderBackground ? "text-white [&_*]:!text-[color:inherit]" : ""} ${profileHeaderLayout === "spotlight" ? "border-2 border-slate-300/80 bg-linear-to-b from-slate-100 to-white dark:border-slate-600 dark:from-slate-800 dark:to-slate-900" : ""}`} style={hasHeaderBackground ? { ...headerBackgroundStyle, color: headerTextColor } : undefined}>
      <div className={`${profileHeaderLayout === "compact" ? "grid grid-cols-[minmax(0,1fr)_6rem] items-start gap-4 text-left sm:grid-cols-[minmax(0,1fr)_9rem]" : profileHeaderLayout === "spotlight" ? "flex flex-col items-center gap-4" : "flex flex-col items-center gap-3"}`}>
        <div className={`${profileHeaderLayout === "compact" ? "order-2 justify-self-end" : ""}`}>
          <div className={`${profileHeaderLayout === "compact" ? "size-24 sm:size-36" : "size-28"} rounded-full p-1 shadow-lg shadow-slate-900/20`} style={avatarFrameStyle(profile.avatarAccent, profile.avatarAccentEnd, profile.avatarAccentDirection)}>
            <ProfileAvatar {...profile} sizeClass="size-full"/>
          </div>
        </div>
        <div className={`${profileHeaderLayout === "compact" ? "order-1 min-w-0" : "min-w-0"}`}>
          <h1 className={`${profileHeaderLayout === "spotlight" ? "text-3xl" : "text-2xl"} font-bold`}>{profile.name || profile.username}</h1>
          <div className={`mt-1 flex flex-wrap items-center gap-1.5 ${profileHeaderLayout === "compact" ? "justify-start" : "justify-center"}`}><AdminBadge isAdmin={profile.isAdmin} isVerified={profile.isVerified} badges={profile.profileBadges} hiddenBadges={profile.hiddenProfileBadges} showCurated showLabels centered={profileHeaderLayout !== "compact"} /></div>
          <p className="mt-1 opacity-80">@{profile.username}</p>
          {profile.subtitle && <p className="mt-3"><MentionText text={profile.subtitle}/></p>}
          {profile.bio && <p className={`mt-3 whitespace-pre-wrap break-words ${profileHeaderLayout === "spotlight" ? "mx-auto max-w-md" : ""}`}><MentionText text={profile.bio}/></p>}
        </div>
      </div>
    </header>
    <h2 className="mb-4 font-bold"><LocalizedText en="Public posts" de="Öffentliche Beiträge"/></h2>
    <GuestPosts username={username} page={page}/>
  </>;
}
