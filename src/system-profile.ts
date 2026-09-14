import { prisma } from "@/db";

export const VIBE_TEAM_EMAIL = "team@vibe.social";
export const VIBE_TEAM_USERNAME = "VibeTeam";

export function isVibeTeamEmail(email?: string | null) {
  return email === VIBE_TEAM_EMAIL;
}

export async function ensureVibeTeamProfile() {
  return prisma.profile.upsert({
    where: { email: VIBE_TEAM_EMAIL },
    update: { name: "VibeTeam", username: VIBE_TEAM_USERNAME, avatar: "/logo.svg", isSystem: true },
    create: {
      email: VIBE_TEAM_EMAIL,
      name: "VibeTeam",
      username: VIBE_TEAM_USERNAME,
      avatar: "/logo.svg",
      subtitle: "Official VIBE support",
      language: "en",
      isSystem: true,
    },
    select: { id: true, email: true, username: true, name: true },
  });
}
