import { prisma } from "@/db";
import { sortProfiles, type PublicProfile } from "@/profile-directory-order";

export async function getProfileDirectory(query = "", sort = "newest") {
  const q = query.trim().slice(0, 200);
  const profiles: PublicProfile[] = await prisma.profile.findMany({
    where: q ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
    ] } : undefined,
    // Only public profile fields are sent to directory clients.
    select: { id: true, name: true, username: true, avatar: true, subtitle: true, bio: true },
  });
  return sortProfiles(profiles, sort);
}
