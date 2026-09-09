import { getMobileSession } from "@/mobile-auth";
import { prisma } from "@/db";
import { NextResponse, type NextRequest } from "next/server";

type MobileConversationRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

async function getCurrentUserProfile(request: NextRequest) {
  const session = await getMobileSession(request);

  if (!session) {
    return null;
  }

  return prisma.profile.findUnique({
    where: {
      email: session.email,
    },
    select: {
      id: true,
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: MobileConversationRouteProps,
) {
  const { id } = await params;

  if (!isObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentUserProfile = await getCurrentUserProfile(_request);

  if (!currentUserProfile) {
    return NextResponse.json({ messages: [] });
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
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.conversationParticipant.update({
    where: {
      conversationId_profileId: {
        conversationId: conversation.id,
        profileId: currentUserProfile.id,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json({
    messages: conversation.messages.map((message) => ({
      id: message.id,
      body: message.body,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt,
      isOwnMessage: message.senderId === currentUserProfile.id,
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: MobileConversationRouteProps,
) {
  const { id } = await params;

  if (!isObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentUserProfile = await getCurrentUserProfile(request);

  if (!currentUserProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body, imageUrl } = (await request.json()) as { body?: unknown; imageUrl?: unknown };
  const text = typeof body === "string" ? body.trim() : "";
  const image = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;

  if (!text && !image) {
    return NextResponse.json({ error: "A message needs text or an image" }, { status: 400 });
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
      id: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: currentUserProfile.id,
      body: text,
      imageUrl: image,
    },
  });

  await prisma.$transaction([
    prisma.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: now,
      },
    }),
    prisma.conversationParticipant.update({
      where: {
        conversationId_profileId: {
          conversationId: conversation.id,
          profileId: currentUserProfile.id,
        },
      },
      data: {
        lastReadAt: now,
      },
    }),
  ]);

  return NextResponse.json({
    id: message.id,
    body: message.body,
    imageUrl: message.imageUrl,
    createdAt: message.createdAt,
    isOwnMessage: true,
  });
}
