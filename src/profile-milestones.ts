import { prisma } from "@/db";
import { isProfileMilestone, type ProfileMilestone } from "@/profile-milestone-data";

function objectIdDate(id: string) { return /^[a-f\d]{24}$/i.test(id) ? new Date(parseInt(id.slice(0, 8), 16) * 1000) : new Date(); }

export async function syncProfileMilestones(email: string) {
  const profile = await prisma.profile.findUnique({ where: { email }, select: { id: true, milestoneBadges: true } });
  if (!profile) return [];
  const [posts, stories, likes] = await Promise.all([
    prisma.post.count({ where: { authorEmail: email } }),
    prisma.story.count({ where: { authorEmail: email } }),
    prisma.post.aggregate({ where: { authorEmail: email }, _sum: { likesCount: true } }),
  ]);
  const achieved: ProfileMilestone[] = [];
  if (posts >= 1) achieved.push("first-post");
  if (stories >= 1) achieved.push("first-story");
  if ((likes._sum.likesCount ?? 0) >= 100) achieved.push("hundred-likes");
  if (Date.now() - objectIdDate(profile.id).getTime() >= 365.25 * 24 * 60 * 60 * 1000) achieved.push("one-year");
  const existing = Array.isArray(profile.milestoneBadges) ? profile.milestoneBadges.filter(isProfileMilestone) : [];
  const next = [...new Set([...existing, ...achieved])];
  if (next.length !== existing.length) await prisma.profile.update({ where: { email }, data: { milestoneBadges: next } });
  return next;
}
