import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";
import { normalizeAvatarAccent, normalizeAvatarFrameDirection } from "@/profile-personalization";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rawAccent = body?.avatarAccent;
  if (typeof rawAccent !== "string") return NextResponse.json({ error: "Invalid avatar frame." }, { status: 400 });

  const avatarAccent = normalizeAvatarAccent(rawAccent);
  if (avatarAccent !== rawAccent.toLowerCase()) return NextResponse.json({ error: "Invalid avatar frame." }, { status: 400 });
  const rawEnd = body?.avatarAccentEnd;
  const avatarAccentEnd = rawEnd == null ? null : typeof rawEnd === "string" && /^#[0-9a-fA-F]{6}$/.test(rawEnd) ? rawEnd.toLowerCase() : null;
  if (rawEnd != null && !avatarAccentEnd) return NextResponse.json({ error: "Invalid avatar frame." }, { status: 400 });
  const avatarAccentDirection = normalizeAvatarFrameDirection(body?.avatarAccentDirection);

  await prisma.profile.upsert({
    where: { email: session.user.email },
    update: { avatarAccent, avatarAccentEnd, avatarAccentDirection },
    create: { email: session.user.email, avatarAccent, avatarAccentEnd, avatarAccentDirection },
  });
  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/profile/[username]", "page");
  return NextResponse.json({ avatarAccent, avatarAccentEnd, avatarAccentDirection });
}
