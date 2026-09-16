import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";
import { normalizeAvatarAccent, normalizeAvatarFrameDirection } from "@/profile-personalization";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const startColor = normalizeAvatarAccent(body?.startColor);
  const endColor = typeof body?.endColor === "string" && /^#[0-9a-fA-F]{6}$/.test(body.endColor) ? body.endColor.toLowerCase() : null;
  if (!endColor || startColor.startsWith("gradient-")) return NextResponse.json({ error: "Invalid gradient." }, { status: 400 });
  const profile = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const count = await prisma.profileFramePreset.count({ where: { profileId: profile.id } });
  if (count >= 3) return NextResponse.json({ error: "Maximum of three saved gradients." }, { status: 400 });
  const preset = await prisma.profileFramePreset.create({ data: { profileId: profile.id, startColor, endColor, direction: normalizeAvatarFrameDirection(body?.direction), position: count } });
  return NextResponse.json({ preset });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Invalid preset" }, { status: 400 });
  const profile = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
  await prisma.profileFramePreset.deleteMany({ where: { id, profileId: profile?.id } });
  return NextResponse.json({ ok: true });
}
