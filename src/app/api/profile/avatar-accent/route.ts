import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";
import { normalizeAvatarAccent } from "@/profile-personalization";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rawAccent = body?.avatarAccent;
  if (typeof rawAccent !== "string") return NextResponse.json({ error: "Invalid avatar frame." }, { status: 400 });

  const avatarAccent = normalizeAvatarAccent(rawAccent);
  if (avatarAccent !== rawAccent.toLowerCase()) return NextResponse.json({ error: "Invalid avatar frame." }, { status: 400 });

  await prisma.profile.upsert({
    where: { email: session.user.email },
    update: { avatarAccent },
    create: { email: session.user.email, avatarAccent },
  });
  return NextResponse.json({ avatarAccent });
}
