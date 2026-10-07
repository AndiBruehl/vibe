import { prisma } from "@/db";

export const guestCommentAuthorSelect = {
  username: true,
  name: true,
  avatar: true,
  avatarAccent: true,
  avatarAccentEnd: true,
  avatarAccentDirection: true,
  isAdmin: true,
  isVerified: true,
  profileBadges: true,
  hiddenProfileBadges: true,
} as const;

export function getGuestComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, parentCommentId: null },
    select: {
      id: true,
      text: true,
      createdAt: true,
      author: { select: guestCommentAuthorSelect },
      replies: {
        select: {
          id: true,
          text: true,
          createdAt: true,
          author: { select: guestCommentAuthorSelect },
          replies: { select: { id: true }, take: 0 },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
