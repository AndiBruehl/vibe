import { prisma } from "@/db";

export const VIBE_TEAM_EMAIL = "team@vibe.social";
export const VIBE_TEAM_USERNAME = "VibeTeam";
export const VIBE_SUPPORT_EMAIL = "support@vibe.social";
export const VIBE_SUPPORT_USERNAME = "SupportVibe";

export function isVibeTeamEmail(email?: string | null) {
  return email === VIBE_TEAM_EMAIL;
}

export function isVibeSupportEmail(email?: string | null) {
  return email === VIBE_SUPPORT_EMAIL;
}

export async function ensureVibeTeamProfile() {
  return prisma.profile.upsert({
    where: { email: VIBE_TEAM_EMAIL },
    update: { name: "VibeTeam", username: VIBE_TEAM_USERNAME, avatar: "/logo.svg", isSystem: true, systemKind: "vibeteam" },
    create: {
      email: VIBE_TEAM_EMAIL,
      name: "VibeTeam",
      username: VIBE_TEAM_USERNAME,
      avatar: "/logo.svg",
      subtitle: "Official VIBE support",
      language: "en",
      isSystem: true,
      systemKind: "vibeteam",
    },
    select: { id: true, email: true, username: true, name: true },
  });
}

export async function ensureVibeSupportProfile() {
  return prisma.profile.upsert({
    where: { email: VIBE_SUPPORT_EMAIL },
    update: { name: "Support@Vibe", username: VIBE_SUPPORT_USERNAME, avatar: "/logo.svg", isSystem: true, systemKind: "support" },
    create: { email: VIBE_SUPPORT_EMAIL, name: "Support@Vibe", username: VIBE_SUPPORT_USERNAME, avatar: "/logo.svg", subtitle: "Official VIBE support", language: "en", isSystem: true, systemKind: "support" },
    select: { id: true, email: true, username: true, name: true },
  });
}

export async function ensureVibeSystemProfiles() {
  await Promise.all([ensureVibeTeamProfile(), ensureVibeSupportProfile()]);
}


export async function sendWelcomeMessage(profile: { id: string; email: string; language: string }) {
  const team = await ensureVibeTeamProfile();
  const directKey = [team.id, profile.id].sort().join(":");
  const conversation = await prisma.conversation.upsert({
    where: { directKey },
    update: {},
    create: { directKey, participants: { create: [{ profileId: team.id }, { profileId: profile.id }] } },
    select: { id: true },
  });
  const de = profile.language === "de";
  const body = de
    ? `Willkommen bei VIBE! Schön, dass du hier bist. Wir wünschen dir viel Freude beim Entdecken, Teilen und Vernetzen.

Wenn du Fragen hast, findest du Hilfe bei Support@Vibe.

— VibeTeam`
    : `Welcome to VIBE! We are happy you are here and hope you enjoy discovering, sharing, and connecting.

If you have questions, Support@Vibe is here to help.

— VibeTeam`;
  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: conversation.id, senderId: team.id, body } }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: now } }),
    prisma.conversationParticipant.update({ where: { conversationId_profileId: { conversationId: conversation.id, profileId: team.id } }, data: { lastReadAt: now } }),
  ]);
}


export async function claimWelcomeAndSend(profile: { id: string; email: string; language: string; isSystem?: boolean | null }) {
  if (profile.isSystem) return false;
  const claim = await prisma.profile.updateMany({ where: { id: profile.id, welcomeSentAt: null }, data: { welcomeSentAt: new Date() } });
  if (claim.count !== 1) return false;
  try {
    await sendWelcomeMessage(profile);
    return true;
  } catch (error) {
    await prisma.profile.update({ where: { id: profile.id }, data: { welcomeSentAt: null } });
    throw error;
  }
}
