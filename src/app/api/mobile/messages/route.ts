import { getMobileSession } from "@/mobile-auth";
import { prisma } from "@/db";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getMobileSession(request);

  if (!session) {
    return NextResponse.json([], { status: 200 });
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: session.email,
    },
    select: {
      id: true,
    },
  });

  if (!currentUserProfile) {
    return NextResponse.json([]);
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          profileId: currentUserProfile.id,
        },
      },
    },
    include: {
      participants: {
        include: {
          profile: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(
    conversations.map((conversation) => {
      const currentParticipant = conversation.participants.find(
        (participant) => participant.profileId === currentUserProfile.id,
      );
      const otherParticipant = conversation.participants.find(
        (participant) => participant.profileId !== currentUserProfile.id,
      );
      const latestMessage = conversation.messages[0];
      const unread =
        latestMessage &&
        latestMessage.senderId !== currentUserProfile.id &&
        (!currentParticipant?.lastReadAt ||
          latestMessage.createdAt > currentParticipant.lastReadAt);

      return {
        id: conversation.id,
        title:
          otherParticipant?.profile.name ||
          otherParticipant?.profile.username ||
          "Unknown user",
        avatar: otherParticipant?.profile.avatar,
        latestMessage: latestMessage?.body,
        updatedAt: conversation.updatedAt,
        unread: !!unread,
      };
    }),
  );
}
