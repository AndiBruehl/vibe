import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";
import {
  DEFAULT_AVATAR_ACCENT,
  DEFAULT_PROFILE_ACCENT,
  DEFAULT_PROFILE_HEADER_BACKGROUND_COLOR,
  normalizeAvatarAccent,
  normalizeAvatarFrameDirection,
  normalizeProfileAccent,
  normalizeProfileHeaderBackgroundImage,
  normalizeProfileHeaderBackgroundMode,
  normalizeProfileHeaderLayout,
  normalizeProfileHeaderTextColor,
} from "@/profile-personalization";

const MAX_PRESETS = 6;

function revalidateAppearance() {
  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/profile/[username]", "page");
}

function presetData(body: Record<string, unknown>) {
  const avatarAccent = normalizeAvatarAccent(body.avatarAccent);
  const avatarAccentEnd = typeof body.avatarAccentEnd === "string" && /^#[0-9a-fA-F]{6}$/.test(body.avatarAccentEnd)
    ? body.avatarAccentEnd.toLowerCase()
    : null;
  const profileHeaderBackgroundImage = normalizeProfileHeaderBackgroundImage(body.profileHeaderBackgroundImage);
  const profileHeaderBackgroundEnd = typeof body.profileHeaderBackgroundEnd === "string" && /^#[0-9a-fA-F]{6}$/.test(body.profileHeaderBackgroundEnd)
    ? body.profileHeaderBackgroundEnd.toLowerCase()
    : null;

  return {
    avatarAccent,
    avatarAccentEnd,
    avatarAccentDirection: normalizeAvatarFrameDirection(body.avatarAccentDirection),
    profileAccent: normalizeProfileAccent(body.profileAccent),
    profileHeaderLayout: normalizeProfileHeaderLayout(body.profileHeaderLayout),
    profileHeaderBackgroundMode: normalizeProfileHeaderBackgroundMode(body.profileHeaderBackgroundMode),
    profileHeaderBackgroundImage,
    profileHeaderBackgroundColor: normalizeProfileAccent(body.profileHeaderBackgroundColor),
    profileHeaderBackgroundEnd,
    profileHeaderTextColor: normalizeProfileHeaderTextColor(body.profileHeaderTextColor),
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.name !== "string") {
    return NextResponse.json({ error: "A preset name is required." }, { status: 400 });
  }

  const name = body.name.trim().replace(/\s+/g, " ").slice(0, 32);
  if (!name) return NextResponse.json({ error: "A preset name is required." }, { status: 400 });

  const profile = await prisma.profile.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email },
    select: { id: true },
  });
  const existing = await prisma.profileAppearancePreset.findUnique({
    where: { profileId_name: { profileId: profile.id, name } },
    select: { id: true },
  });
  if (!existing) {
    const count = await prisma.profileAppearancePreset.count({ where: { profileId: profile.id } });
    if (count >= MAX_PRESETS) return NextResponse.json({ error: `You can save up to ${MAX_PRESETS} looks.` }, { status: 400 });
  }

  const preset = await prisma.profileAppearancePreset.upsert({
    where: { profileId_name: { profileId: profile.id, name } },
    update: presetData(body),
    create: { profileId: profile.id, name, ...presetData(body) },
  });
  revalidatePath("/settings");
  return NextResponse.json({ preset });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const profile = await prisma.profile.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email },
    select: { id: true },
  });

  const data = body.action === "reset"
    ? {
        avatarAccent: DEFAULT_AVATAR_ACCENT,
        avatarAccentEnd: null,
        avatarAccentDirection: "to-bottom-right",
        profileAccent: DEFAULT_PROFILE_ACCENT,
        profileHeaderLayout: "standard",
        profileHeaderBackgroundMode: "none",
        profileHeaderBackgroundImage: null,
        profileHeaderBackgroundColor: DEFAULT_PROFILE_HEADER_BACKGROUND_COLOR,
        profileHeaderBackgroundEnd: null,
        profileHeaderTextColor: "#ffffff",
      }
    : null;

  if (!data) {
    if (typeof body.presetId !== "string") return NextResponse.json({ error: "Invalid preset." }, { status: 400 });
    const preset = await prisma.profileAppearancePreset.findFirst({ where: { id: body.presetId, profileId: profile.id } });
    if (!preset) return NextResponse.json({ error: "Preset not found." }, { status: 404 });
    await prisma.profile.update({ where: { id: profile.id }, data: {
      avatarAccent: preset.avatarAccent, avatarAccentEnd: preset.avatarAccentEnd, avatarAccentDirection: preset.avatarAccentDirection,
      profileAccent: preset.profileAccent, profileHeaderLayout: preset.profileHeaderLayout,
      profileHeaderBackgroundMode: preset.profileHeaderBackgroundMode, profileHeaderBackgroundImage: preset.profileHeaderBackgroundImage,
      profileHeaderBackgroundColor: preset.profileHeaderBackgroundColor, profileHeaderBackgroundEnd: preset.profileHeaderBackgroundEnd,
      profileHeaderTextColor: preset.profileHeaderTextColor,
    } });
    revalidateAppearance();
    return NextResponse.json({ applied: preset });
  }

  await prisma.profile.update({ where: { id: profile.id }, data });
  revalidateAppearance();
  return NextResponse.json({ reset: true, appearance: data });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const presetId = new URL(request.url).searchParams.get("id");
  if (!presetId) return NextResponse.json({ error: "Invalid preset." }, { status: 400 });
  const profile = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  await prisma.profileAppearancePreset.deleteMany({ where: { id: presetId, profileId: profile.id } });
  revalidatePath("/settings");
  return NextResponse.json({ deleted: true });
}
