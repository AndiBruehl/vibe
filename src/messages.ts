import { auth } from "@/auth";
import { prisma } from "@/db";

export type UnreadMessageStatus = {
  count: number;
  latestUnreadAt: string | null;
};

export async function getUnreadMessageStatus(
  email?: string,
): Promise<UnreadMessageStatus> {
  const sessionEmail = email ?? (await auth())?.user?.email;

  if (!sessionEmail) {
    return {
      count: 0,
      latestUnreadAt: null,
    };
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: sessionEmail,
    },
    select: {
      id: true,
      conversations: {
        select: {
          lastReadAt: true,
          conversation: {
            select: {
              messages: {
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
                select: {
                  senderId: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!currentUserProfile) {
    return {
      count: 0,
      latestUnreadAt: null,
    };
  }

  const unreadLatestMessages = currentUserProfile.conversations
    .map((participant) => {
      const latestMessage = participant.conversation.messages[0];

      if (
        !latestMessage ||
        latestMessage.senderId === currentUserProfile.id ||
        (participant.lastReadAt &&
          latestMessage.createdAt <= participant.lastReadAt)
      ) {
        return null;
      }

      return latestMessage;
    })
    .filter((message) => message !== null);

  const latestUnreadAt = unreadLatestMessages.reduce<Date | null>(
    (latest, message) =>
      !latest || message.createdAt > latest ? message.createdAt : latest,
    null,
  );

  return {
    count: unreadLatestMessages.length,
    latestUnreadAt: latestUnreadAt?.toISOString() ?? null,
  };
}

export async function getUnreadConversationCount(email?: string) {
  const status = await getUnreadMessageStatus(email);

  return status.count;
}
