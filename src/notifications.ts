import { auth } from "@/auth";
import { prisma } from "@/db";

export type UnreadInteractionStatus = {
  commentCount: number;
  replyCount: number;
  latestUnreadAt: string | null;
};

export async function getUnreadInteractionStatus(
  email?: string,
): Promise<UnreadInteractionStatus> {
  const sessionEmail = email ?? (await auth())?.user?.email;

  if (!sessionEmail) {
    return { commentCount: 0, replyCount: 0, latestUnreadAt: null };
  }

  const profile = await prisma.profile.findUnique({
    where: { email: sessionEmail },
    select: { activityReadAt: true },
  });

  if (!profile) {
    return { commentCount: 0, replyCount: 0, latestUnreadAt: null };
  }

  const interactions = await prisma.comment.findMany({
    where: {
      authorEmail: { not: sessionEmail },
      OR: [
        { post: { authorEmail: sessionEmail } },
        { parentComment: { authorEmail: sessionEmail } },
      ],
      ...(profile.activityReadAt
        ? { createdAt: { gt: profile.activityReadAt } }
        : {}),
    },
    select: {
      createdAt: true,
      parentCommentId: true,
      parentComment: { select: { authorEmail: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let commentCount = 0;
  let replyCount = 0;

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
    latestUnreadAt: interactions[0]?.createdAt.toISOString() ?? null,
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
