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
