import { prisma } from "@/db";

export const VIBE_ADMIN_EMAILS = [
  "violett.ai.2025@gmail.com",
  "anna.lpunkt2003@gmail.com",
] as const;

export function isVibeAdminEmail(email?: string | null) {
  return typeof email === "string" && VIBE_ADMIN_EMAILS.includes(email as (typeof VIBE_ADMIN_EMAILS)[number]);
}

export async function isVibeAdmin(email?: string | null) {
  if (!isVibeAdminEmail(email)) return false;
  const profile = await prisma.profile.findUnique({
    where: { email },
    select: { isAdmin: true },
  });
  return profile?.isAdmin === true;
}
