import { getMobileSession } from "@/mobile-auth";
import { prisma } from "@/db";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getMobileSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: {
      email: session.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      avatar: true,
      subtitle: true,
      bio: true,
    },
  });

  return NextResponse.json(profile);
}

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function PATCH(request: NextRequest) {
  const session = await getMobileSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid profile update." }, { status: 400 });
  const username = text(body.username, 80);
  if (!username || /[\\/\u0000-\u001F\u007F]/.test(username)) {
    return NextResponse.json({ error: "Username can use Unicode characters and emoji, but not slashes or control characters." }, { status: 400 });
  }
  const avatar = text(body.avatar, 2048);
  if (avatar && !/^https:\/\//i.test(avatar)) return NextResponse.json({ error: "Avatar must use a secure URL." }, { status: 400 });
  try {
    const profile = await prisma.profile.update({
      where: { id: session.profileId },
      data: { username, name: text(body.name, 80), subtitle: text(body.subtitle, 160), bio: text(body.bio, 500), avatar: avatar || null },
      select: { id: true, email: true, name: true, username: true, avatar: true, subtitle: true, bio: true },
    });
    return NextResponse.json(profile);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2002") return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    throw error;
  }
}
