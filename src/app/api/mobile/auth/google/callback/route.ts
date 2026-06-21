import { auth } from "@/auth";
import { createMobileToken } from "@/mobile-auth";
import { prisma } from "@/db";
import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

function getRedirectUri(request: NextRequest) {
  const redirectUri = request.nextUrl.searchParams.get("redirectUri");

  if (
    redirectUri?.startsWith("vibe://") ||
    redirectUri?.startsWith("com.vibe.social:/")
  ) {
    return redirectUri;
  }

  return "vibe://auth";
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
      select: { id: true },
      where: { username },
    });

    if (!existingProfile) {
      return username;
    }
  }

  return `${baseUsername.slice(0, 17)}_${crypto.randomUUID().slice(0, 12)}`;
}

export async function GET(request: NextRequest) {
  const redirectUrl = new URL(getRedirectUri(request));
  const session = await auth();
  const user = session?.user;
  const email = user?.email;

  if (!email) {
    redirectUrl.searchParams.set("error", "Google sign-in was cancelled.");
    return NextResponse.redirect(redirectUrl);
  }

  const existingProfile = await prisma.profile.findUnique({
    select: { id: true },
    where: { email },
  });
  const profile = existingProfile
    ? await prisma.profile.update({
        data: {
          avatar: user.image,
          name: user.name,
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
        where: { email },
      })
    : await prisma.profile.create({
        data: {
          avatar: user.image,
          email,
          name: user.name,
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

  redirectUrl.searchParams.set(
    "token",
    createMobileToken({ email: profile.email, profileId: profile.id }),
  );

  return NextResponse.redirect(redirectUrl);
}
