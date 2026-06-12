import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";

type ConversationStatusRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export async function GET(_request: Request, { params }: ConversationStatusRouteProps) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        messageCount: 0,
        latestMessageAt: null,
      },
      {
        status: 401,
      },
    );
  }

  const { id } = await params;

  if (!isObjectId(id)) {
    return NextResponse.json(
      {
        messageCount: 0,
        latestMessageAt: null,
      },
      {
        status: 404,
      },
    );
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
    },
  });

  if (!currentUserProfile) {
    return NextResponse.json(
      {
        messageCount: 0,
        latestMessageAt: null,
      },
      {
        status: 404,
      },
    );
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      participants: {
        some: {
          profileId: currentUserProfile.id,
        },
      },
    },
    select: {
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          createdAt: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      {
        messageCount: 0,
        latestMessageAt: null,
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    messageCount: conversation._count.messages,
    latestMessageAt: conversation.messages[0]?.createdAt.toISOString() ?? null,
  });
}
