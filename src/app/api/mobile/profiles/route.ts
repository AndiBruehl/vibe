import { getProfileDirectory } from "@/profile-directory";
import { getMobileSession } from "@/mobile-auth";
import { prisma } from "@/db";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const profiles = await getProfileDirectory(
    request.nextUrl.searchParams.get("q") || "",
    request.nextUrl.searchParams.get("sort") || "newest",
  );
  const session = await getMobileSession(request);
  const viewer = session ? await prisma.profile.findUnique({ where: { id: session.profileId }, select: { id: true } }) : null;
  const follows = viewer ? await prisma.follow.findMany({
    where: { followerId: viewer.id, followingId: { in: profiles.map(profile => profile.id) } },
    select: { followingId: true },
  }) : [];
  const following = new Set(follows.map(follow => follow.followingId));
  return NextResponse.json(profiles.map(profile => ({ ...profile, isFollowing: following.has(profile.id), isSelf: profile.id === viewer?.id })));
}
