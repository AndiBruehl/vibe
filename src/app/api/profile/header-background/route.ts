import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";
import { normalizeProfileAccent, normalizeProfileHeaderBackgroundImage, normalizeProfileHeaderBackgroundMode, normalizeProfileHeaderTextColor } from "@/profile-personalization";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const profileHeaderBackgroundMode = normalizeProfileHeaderBackgroundMode(body?.profileHeaderBackgroundMode);
  if (body?.profileHeaderBackgroundMode !== profileHeaderBackgroundMode) return NextResponse.json({ error: "Invalid header background mode." }, { status: 400 });
  const profileHeaderBackgroundImage = normalizeProfileHeaderBackgroundImage(body?.profileHeaderBackgroundImage);
  if (body?.profileHeaderBackgroundImage && !profileHeaderBackgroundImage) return NextResponse.json({ error: "Invalid header background image." }, { status: 400 });
  const profileHeaderBackgroundColor = normalizeProfileAccent(body?.profileHeaderBackgroundColor);
  const profileHeaderTextColor = normalizeProfileHeaderTextColor(body?.profileHeaderTextColor);
  const profileHeaderBackgroundEnd = typeof body?.profileHeaderBackgroundEnd === "string" && /^#[0-9a-fA-F]{6}$/.test(body.profileHeaderBackgroundEnd) ? body.profileHeaderBackgroundEnd.toLowerCase() : null;
  await prisma.profile.upsert({ where: { email: session.user.email }, update: { profileHeaderBackgroundMode, profileHeaderBackgroundImage, profileHeaderBackgroundColor, profileHeaderBackgroundEnd, profileHeaderTextColor }, create: { email: session.user.email, profileHeaderBackgroundMode, profileHeaderBackgroundImage, profileHeaderBackgroundColor, profileHeaderBackgroundEnd, profileHeaderTextColor } });
  revalidatePath("/profile"); revalidatePath("/settings"); revalidatePath("/profile/[username]", "page");
  return NextResponse.json({ profileHeaderBackgroundMode, profileHeaderBackgroundImage, profileHeaderBackgroundColor, profileHeaderBackgroundEnd, profileHeaderTextColor });
}
