import { prisma } from "@/db";

export type RestrictionCapability = "messages" | "comments" | "posts";

export type ActiveRestriction = {
  endsAt: Date;
  blocksMessages: boolean;
  blocksComments: boolean;
  blocksPosts: boolean;
};

export async function getActiveRestriction(profileId: string): Promise<ActiveRestriction | null> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { restrictedUntil: true, restrictionMessages: true, restrictionComments: true, restrictionPosts: true } });
  if (!profile?.restrictedUntil) return null;
  if (profile.restrictedUntil.getTime() <= Date.now()) {
    await prisma.profile.update({ where: { id: profileId }, data: { restrictedUntil: null, restrictionMessages: false, restrictionComments: false, restrictionPosts: false } });
    return null;
  }
  return { endsAt: profile.restrictedUntil, blocksMessages: profile.restrictionMessages, blocksComments: profile.restrictionComments, blocksPosts: profile.restrictionPosts };
}

export async function assertNotRestricted(email: string, capability: RestrictionCapability) {
  const profile = await prisma.profile.findUnique({ where: { email }, select: { id: true } });
  if (!profile) return;
  const restriction = await getActiveRestriction(profile.id);
  const blocked = capability === "messages" ? restriction?.blocksMessages : capability === "comments" ? restriction?.blocksComments : restriction?.blocksPosts;
  if (blocked) throw new Error(`Your ${capability} are temporarily restricted.`);
}
