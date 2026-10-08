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

export const guestAuthorSelect = { username: true, name: true, avatar: true, avatarAccent: true, avatarAccentEnd: true, avatarAccentDirection: true, isAdmin: true, isVerified: true, profileBadges: true, hiddenProfileBadges: true } satisfies Prisma.ProfileSelect;
export const guestPostSelect = { id: true, image: true, images: true, mediaTypes: true, videoPosters: true, description: true, createdAt: true, likesCount: true, locationLabel: true, locationLatitude: true, locationLongitude: true, author: { select: guestAuthorSelect } } satisfies Prisma.PostSelect;

export const guestPostSortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "liked", label: "Most liked" },
] as const;
export type GuestPostSort = (typeof guestPostSortOptions)[number]["value"];

export function normalizeGuestPostSort(value: unknown): GuestPostSort {
  return guestPostSortOptions.some((option) => option.value === value) ? value as GuestPostSort : "newest";
}

export function guestPostOrderBy(sort: GuestPostSort): Prisma.PostOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ createdAt: "asc" }, { id: "asc" }];
  if (sort === "liked") return [{ likesCount: "desc" }, { createdAt: "desc" }, { id: "desc" }];
  return [{ createdAt: "desc" }, { id: "desc" }];
}

export function getGuestPosts(username?: string, page = 1, sort: GuestPostSort = "newest") {
  return prisma.post.findMany({
    where: { ...publicPostWhere, ...(username ? { author: { is: { username, ...publicProfileWhere } } } : {}) },
    select: guestPostSelect, orderBy: guestPostOrderBy(sort), take: 24, skip: (page - 1) * 24,
  });
}
