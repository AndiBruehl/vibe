import { auth } from "@/auth";
import { prisma } from "@/db";

export type UnreadInteractionStatus = {
  commentCount: number;
  replyCount: number;
  likeCount: number;
  latestUnreadAt: string | null;
};

export async function getUnreadInteractionStatus(
  email?: string,
): Promise<UnreadInteractionStatus> {
  const sessionEmail = email ?? (await auth())?.user?.email;

  if (!sessionEmail) {
    return { commentCount: 0, replyCount: 0, likeCount: 0, latestUnreadAt: null };
  }

  const profile = await prisma.profile.findUnique({
    where: { email: sessionEmail },
    select: { activityReadAt: true },
  });

  if (!profile) {
    return { commentCount: 0, replyCount: 0, likeCount: 0, latestUnreadAt: null };
  }

  const readFilter = profile.activityReadAt
    ? { createdAt: { gt: profile.activityReadAt } }
    : {};

  const [interactions, ownPosts, ownComments] = await Promise.all([
    prisma.comment.findMany({
    where: {
      authorEmail: { not: sessionEmail },
      OR: [
        { post: { authorEmail: sessionEmail } },
        { parentComment: { authorEmail: sessionEmail } },
      ],
      ...readFilter,
    },
    select: {
      createdAt: true,
      parentCommentId: true,
      parentComment: { select: { authorEmail: true } },
    },
    orderBy: { createdAt: "desc" },
    }),
    prisma.post.findMany({ where: { authorEmail: sessionEmail }, select: { id: true } }),
    prisma.comment.findMany({ where: { authorEmail: sessionEmail }, select: { id: true } }),
  ]);

  const [postLikes, commentLikes] = await Promise.all([
    ownPosts.length
      ? prisma.postLike.findMany({
          where: {
            authorEmail: { not: sessionEmail },
            postId: { in: ownPosts.map((post) => post.id) },
            ...readFilter,
          },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        })
      : [],
    ownComments.length
      ? prisma.commentLike.findMany({
          where: {
            authorEmail: { not: sessionEmail },
            commentId: { in: ownComments.map((comment) => comment.id) },
            ...readFilter,
          },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  let commentCount = 0;
  let replyCount = 0;
  const likeCount = postLikes.length + commentLikes.length;

  for (const interaction of interactions) {
    if (interaction.parentCommentId && interaction.parentComment?.authorEmail === sessionEmail) {
      replyCount += 1;
    } else {
      commentCount += 1;
    }
  }

  return {
    commentCount,
    replyCount,
    likeCount,
    latestUnreadAt: [
      interactions[0]?.createdAt,
      postLikes[0]?.createdAt,
      commentLikes[0]?.createdAt,
    ]
      .filter((date): date is Date => Boolean(date))
      .sort((left, right) => right.getTime() - left.getTime())[0]
      ?.toISOString() ?? null,
  };
}

export async function markActivityRead(email?: string): Promise<void> {
  const sessionEmail = email ?? (await auth())?.user?.email;
  if (!sessionEmail) return;

  await prisma.profile.update({
    where: { email: sessionEmail },
    data: { activityReadAt: new Date() },
  });
}
