import { createMobileToken } from "@/mobile-auth";
import { prisma } from "@/db";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { NextResponse, type NextRequest } from "next/server";

const googleClient = new OAuth2Client();

function getAudiences() {
  return [
    process.env.AUTH_GOOGLE_ID,
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  ].filter(Boolean) as string[];
}

function createUsername(email: string) {
  return (
    email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9_.]/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24) || "vibe_user"
  );
}

async function createUniqueUsername(email: string) {
  const baseUsername = createUsername(email);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : `_${attempt + 1}`;
    const username = `${baseUsername.slice(0, 30 - suffix.length)}${suffix}`;
    const existingProfile = await prisma.profile.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existingProfile) {
      return username;
    }
  }

  return `${baseUsername.slice(0, 17)}_${crypto.randomUUID().slice(0, 12)}`;
}

export async function POST(request: NextRequest) {
  const { idToken } = (await request.json().catch(() => ({}))) as {
    idToken?: string;
  };

  if (!idToken) {
    return NextResponse.json({ error: "Missing Google ID token." }, { status: 400 });
  }

  const audiences = getAudiences();

  if (audiences.length === 0) {
    return NextResponse.json(
      { error: "Google OAuth client ID is not configured." },
      { status: 500 },
    );
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      audience: audiences,
      idToken,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email || payload.email_verified === false) {
      return NextResponse.json({ error: "Google account is not verified." }, { status: 401 });
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { email },
      select: { id: true },
    });

    const profile = existingProfile
      ? await prisma.profile.update({
          where: { email },
          data: {
            avatar: payload.picture,
            name: payload.name,
          },
          select: {
            avatar: true,
            bio: true,
            email: true,
            id: true,
            name: true,
            subtitle: true,
            username: true,
          },
        })
      : await prisma.profile.create({
          data: {
            avatar: payload.picture,
            email,
            name: payload.name,
            username: await createUniqueUsername(email),
          },
          select: {
            avatar: true,
            bio: true,
            email: true,
            id: true,
            name: true,
            subtitle: true,
            username: true,
          },
        });

    return NextResponse.json({
      profile,
      token: createMobileToken({ email: profile.email, profileId: profile.id }),
    });
  } catch (error) {
    console.error("Mobile Google login failed:", error);

    return NextResponse.json({ error: "Google login failed." }, { status: 401 });
  }
}
