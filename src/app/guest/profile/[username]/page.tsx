import { prisma } from "@/db";
import { guestAuthorSelect, publicProfileWhere } from "@/guest-content";
import GuestPosts, { GuestUnavailable } from "@/app/components/GuestPosts";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import LocalizedText from "@/app/components/LocalizedText";
import { notFound } from "next/navigation";

export default async function GuestProfile({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ page?: string }> }) {
  const { username } = await params;
  let profile;
  try { profile = await prisma.profile.findFirst({ where: { username, ...publicProfileWhere }, select: { ...guestAuthorSelect, bio: true, subtitle: true } }); } catch { return <GuestUnavailable/>; }
  if (!profile) notFound();
  const query = await searchParams;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(query.page) || 1)));
  return <><header className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-slate-400/20 p-6 text-center">
    <ProfileAvatar {...profile} sizeClass="size-24"/>
    <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1><p>@{profile.username}</p>
    {profile.subtitle && <p>{profile.subtitle}</p>}{profile.bio && <p className="whitespace-pre-wrap break-words">{profile.bio}</p>}
  </header><h2 className="mb-4 font-bold"><LocalizedText en="Public posts" de="Öffentliche Beiträge"/></h2><GuestPosts username={username} page={page}/></>;
}
