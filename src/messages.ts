import { auth } from "@/auth";
import { prisma } from "@/db";

export type UnreadMessageStatus = {
  count: number;
  latestUnreadAt: string | null;
};

const emptyUnreadMessageStatus = (): UnreadMessageStatus => ({ count: 0, latestUnreadAt: null });

export async function getUnreadMessageStatus(
  email?: string,
): Promise<UnreadMessageStatus> {
  const sessionEmail = email ?? (await auth())?.user?.email;

  if (!sessionEmail) {
    return emptyUnreadMessageStatus();
  }

  try {
  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: sessionEmail,
    },
    select: {
      id: true,
      conversations: {
        select: {
          conversationId: true,
          lastReadAt: true,
        },
      },
    },
  });

  if (!currentUserProfile) {
    return emptyUnreadMessageStatus();
  }

  const unreadConversationStatus = await Promise.all(
    currentUserProfile.conversations.map(async (participant) => {
      const where = {
        conversationId: participant.conversationId,
        senderId: { not: currentUserProfile.id },
        ...(participant.lastReadAt
          ? { createdAt: { gt: participant.lastReadAt } }
          : {}),
      };

      const [count, latestMessage] = await Promise.all([
        prisma.message.count({ where }),
        prisma.message.findFirst({
          where,
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);

      return { count, latestMessage };
    }),
  );

  const unreadConversations = unreadConversationStatus.filter(
    ({ count }) => count > 0,
  );

  const latestUnreadAt = unreadConversations.reduce(
    (latest: Date | null, { latestMessage }) =>
      latestMessage && (!latest || latestMessage.createdAt > latest)
        ? latestMessage.createdAt
        : latest,
    null as Date | null,
  );

  return {
    count: unreadConversations.length,
    latestUnreadAt: latestUnreadAt?.toISOString() ?? null,
  };
  } catch {
    // A temporary Atlas/DNS outage must not make every protected page fail.
    // The next client status refresh will recover the badge when the database returns.
    return emptyUnreadMessageStatus();
  }
}

export async function getUnreadConversationCount(email?: string) {
  const status = await getUnreadMessageStatus(email);

  return status.count;
}
