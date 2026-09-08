import { prisma } from "@/db";
import { getMobileSession } from "@/mobile-auth";
import type { NextRequest } from "next/server";

export async function withViewerLikes<T extends { id: string }>(request: NextRequest, posts: T[]) {
  const session = await getMobileSession(request);
  const likes = session ? await prisma.postLike.findMany({
    where: { authorEmail: session.email, postId: { in: posts.map(post => post.id) } },
    select: { postId: true },
  }) : [];
  const ids = new Set(likes.map(like => like.postId));
  return posts.map(post => ({ ...post, liked: ids.has(post.id) }));
}
