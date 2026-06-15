import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json([], { status: 200 });
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!currentUserProfile) {
    return NextResponse.json([]);
  }

  const [follows, likes, comments] = await Promise.all([
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
        post: {
          authorEmail: currentUserProfile.email,
        },
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
        post: {
          authorEmail: currentUserProfile.email,
        },
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),
  ]);

  const items = [
    ...follows.map((follow) => ({
      id: `follow-${follow.id}`,
      type: "follow",
      title: `${follow.follower.name || follow.follower.username || "Someone"} followed you`,
      body: follow.follower.username ? `@${follow.follower.username}` : "",
      createdAt: follow.createdAt,
      avatar: follow.follower.avatar,
    })),
    ...likes.map((like) => ({
      id: `like-${like.id}`,
      type: "like",
      title: `${like.author.name || like.author.username || "Someone"} liked your post`,
      body: like.post.description,
      createdAt: like.createdAt,
      avatar: like.author.avatar,
      image: like.post.image,
    })),
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment",
      title: `${comment.author.name || comment.author.username || "Someone"} commented`,
      body: comment.text,
      createdAt: comment.createdAt,
      avatar: comment.author.avatar,
      image: comment.post.image,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return NextResponse.json(items.slice(0, 40));
}
