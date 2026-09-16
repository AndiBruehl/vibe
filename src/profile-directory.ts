import { prisma } from "@/db";
import { sortProfiles, type PublicProfile } from "@/profile-directory-order";

export async function getProfileDirectory(query = "", sort = "newest", adminsOnly = false) {
  const q = query.trim().slice(0, 200);
  const profiles: PublicProfile[] = await prisma.profile.findMany({
    where: { ...(adminsOnly ? { isAdmin: true } : {}), ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
    ] } : {}) },
    // Only public profile fields are sent to directory clients.
    select: { id: true, name: true, username: true, avatar: true, avatarAccent: true, avatarAccentEnd: true, avatarAccentDirection: true, subtitle: true, bio: true, isAdmin: true, isVerified: true },
  });
  return sortProfiles(profiles, sort);
}
