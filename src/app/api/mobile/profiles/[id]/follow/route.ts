import { prisma } from "@/db";
import { getMobileSession } from "@/mobile-auth";
import { NextResponse, type NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (id === session.profileId) return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (typeof body?.following !== "boolean") return NextResponse.json({ error: "Following must be a boolean." }, { status: 400 });
  const target = await prisma.profile.findUnique({ where: { id }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const where = { followerId_followingId: { followerId: session.profileId, followingId: id } };
  if (body.following) {
    await prisma.follow.upsert({ where, create: { followerId: session.profileId, followingId: id }, update: {} });
  } else {
    await prisma.follow.deleteMany({ where: { followerId: session.profileId, followingId: id } });
  }
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: id } }),
    prisma.follow.count({ where: { followerId: id } }),
  ]);
  return NextResponse.json({ following: body.following, followers, followingCount: following });
}
