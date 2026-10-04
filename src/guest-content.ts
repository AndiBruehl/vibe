import { prisma } from "@/db";
import type { Prisma } from ".prisma/client";

// Fail closed for legacy records without explicit visibility flags and orphan posts.
export const publicProfileWhere = { isPrivate: false } satisfies Prisma.ProfileWhereInput;
export const publicPostWhere = {
  AND: [
    { isArchived: false },
    { author: { is: publicProfileWhere } },
  ],
} satisfies Prisma.PostWhereInput;

export const guestAuthorSelect = { username: true, name: true, avatar: true, avatarAccent: true, avatarAccentEnd: true, avatarAccentDirection: true } satisfies Prisma.ProfileSelect;
export const guestPostSelect = { id: true, image: true, images: true, mediaTypes: true, videoPosters: true, description: true, createdAt: true, author: { select: guestAuthorSelect } } satisfies Prisma.PostSelect;

export function getGuestPosts(username?: string, page = 1) {
  return prisma.post.findMany({
    where: { ...publicPostWhere, ...(username ? { author: { is: { username, ...publicProfileWhere } } } : {}) },
    select: guestPostSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 24, skip: (page - 1) * 24,
  });
}
