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
      email: true,
    },
  });

  if (!currentUserProfile) {
    return NextResponse.json([]);
  }

  const validPosts = await prisma.post.findMany({ select: { id: true } });
  const validPostIds = validPosts.map((post) => post.id);

  const [follows, likes, comments, participants] = await Promise.all([
    prisma.follow.findMany({
      where: {
        followingId: currentUserProfile.id,
      },
      include: {
        follower: {
          select: {
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
    prisma.postLike.findMany({
      where: {
        authorEmail: {
          not: currentUserProfile.email,
        },
        post: { authorEmail: currentUserProfile.email },
      },
      include: {
        author: {
          select: {
            name: true,
            username: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            image: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
    prisma.comment.findMany({
      where: {
        authorEmail: {
          not: currentUserProfile.email,
        },
        postId: { in: validPostIds },
        OR: [
          { post: { authorEmail: currentUserProfile.email } },
          { parentComment: { authorEmail: currentUserProfile.email } },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            username: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            image: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
    prisma.conversationParticipant.findMany({
      where: { profileId: currentUserProfile.id },
      include: {
        conversation: {
          include: {
            participants: { include: { profile: { select: { name: true, username: true, avatar: true } } } },
            messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { id: true, name: true, username: true, avatar: true } } } },
          },
        },
      },
      take: 20,
    }),
  ]);

  const messages = participants.flatMap((participant) => {
    const latest = participant.conversation.messages[0];
    if (!latest || latest.senderId === currentUserProfile.id || (participant.lastReadAt && latest.createdAt <= participant.lastReadAt)) return [];
    const other = participant.conversation.participants.find(item => item.profileId !== currentUserProfile.id)?.profile;
    return [{ id: `message-${latest.id}`, type: "message" as const, title: `${latest.sender.name || latest.sender.username || other?.name || "Someone"} sent you a message`, body: latest.body, createdAt: latest.createdAt, avatar: latest.sender.avatar || other?.avatar, conversationId: participant.conversationId, conversationTitle: participant.conversation.name || other?.name || other?.username || "Conversation" }];
  });

  const items = [
    ...follows.map((follow) => ({
      id: `follow-${follow.id}`,
      type: "follow",
      title: `${follow.follower.name || follow.follower.username || "Someone"} followed you`,
      body: follow.follower.username ? `@${follow.follower.username}` : "",
      context: "Profile activity",
      createdAt: follow.createdAt,
      avatar: follow.follower.avatar,
    })),
    ...likes.map((like) => ({
      id: `like-${like.id}`,
      type: "like",
      title: `${like.author.name || like.author.username || "Someone"} liked your post`,
      body: like.post.description,
      context: `On your post: ${like.post.description || "Untitled post"}`,
      createdAt: like.createdAt,
      avatar: like.author.avatar,
      image: like.post.image,
      postId: like.post.id,
    })),
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment",
      title: `${comment.author.name || comment.author.username || "Someone"} ${comment.parentCommentId ? "replied to your comment" : "commented on your post"}`,
      body: comment.text,
      context: comment.parentCommentId
        ? "Reply to your comment"
        : `On your post: ${comment.post.description || "Untitled post"}`,
      createdAt: comment.createdAt,
      avatar: comment.author.avatar,
      image: comment.post.image,
      postId: comment.post.id,
    })),
    ...messages,
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return NextResponse.json(items.slice(0, 40));
}
