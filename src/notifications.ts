import { auth } from "@/auth";
import { prisma } from "@/db";

export type UnreadInteractionStatus = {
  commentCount: number;
  replyCount: number;
  likeCount: number;
  mentionCount: number;
  followRequestCount: number;
  adminCount: number;
  latestUnreadAt: string | null;
};

export async function getUnreadInteractionStatus(
  email?: string,
): Promise<UnreadInteractionStatus> {
  const sessionEmail = email ?? (await auth())?.user?.email;

  if (!sessionEmail) {
    return { commentCount: 0, replyCount: 0, likeCount: 0, mentionCount: 0, followRequestCount: 0, adminCount: 0, latestUnreadAt: null };
  }

  const profile = await prisma.profile.findUnique({
    where: { email: sessionEmail },
    select: { id: true, activityReadAt: true, isAdmin: true, notificationLikes: true, notificationComments: true, notificationMentions: true, notificationFollowRequests: true, notificationAdmin: true },
  });

  if (!profile) {
    return { commentCount: 0, replyCount: 0, likeCount: 0, mentionCount: 0, followRequestCount: 0, adminCount: 0, latestUnreadAt: null };
  }

  const readFilter = profile.activityReadAt
    ? { createdAt: { gt: profile.activityReadAt } }
    : {};

  const [interactions, ownPosts, ownComments, mentions, followRequests, adminActivities] = await Promise.all([
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
      id: true,
      createdAt: true,
      parentCommentId: true,
      parentComment: { select: { authorEmail: true } },
    },
    orderBy: { createdAt: "desc" },
    }),
    prisma.post.findMany({ where: { authorEmail: sessionEmail }, select: { id: true } }),
    prisma.comment.findMany({ where: { authorEmail: sessionEmail }, select: { id: true } }),
    prisma.commentMention.findMany({
      where: {
        profileId: profile.id,
        comment: { authorEmail: { not: sessionEmail } },
        ...readFilter,
      },
      select: { commentId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.followRequest.findMany({
      where: { followingId: profile.id, ...readFilter },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    profile.isAdmin ? prisma.adminActivity.findMany({ where: { actorEmail: { not: sessionEmail }, ...readFilter }, select: { createdAt: true }, orderBy: { createdAt: "desc" } }) : [],
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
  const interactionCommentIds = new Set(interactions.map((interaction) => interaction.id));
  const mentionCount = mentions.filter((mention) => !interactionCommentIds.has(mention.commentId)).length;
  const likeCount = postLikes.length + commentLikes.length;

  for (const interaction of interactions) {
    if (interaction.parentCommentId && interaction.parentComment?.authorEmail === sessionEmail) {
      replyCount += 1;
    } else {
      commentCount += 1;
    }
  }

  const visibleCommentCount = profile.notificationComments !== false ? commentCount : 0;
  const visibleReplyCount = profile.notificationComments !== false ? replyCount : 0;
  const visibleLikeCount = profile.notificationLikes !== false ? likeCount : 0;
  const visibleMentionCount = profile.notificationMentions !== false ? mentionCount : 0;
  const visibleFollowRequestCount = profile.notificationFollowRequests !== false ? followRequests.length : 0;
  const visibleAdminCount = profile.notificationAdmin !== false ? adminActivities.length : 0;

  return {
    commentCount: visibleCommentCount,
    replyCount: visibleReplyCount,
    likeCount: visibleLikeCount,
    mentionCount: visibleMentionCount,
    followRequestCount: visibleFollowRequestCount,
    adminCount: visibleAdminCount,
    latestUnreadAt: [
      profile.notificationComments !== false ? interactions[0]?.createdAt : null,
      profile.notificationLikes !== false ? postLikes[0]?.createdAt : null,
      profile.notificationLikes !== false ? commentLikes[0]?.createdAt : null,
      profile.notificationMentions !== false ? mentions[0]?.createdAt : null,
      profile.notificationFollowRequests !== false ? followRequests[0]?.createdAt : null,
      profile.notificationAdmin !== false ? adminActivities[0]?.createdAt : null,
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
