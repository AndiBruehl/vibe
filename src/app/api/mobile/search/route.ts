import { prisma } from "@/db";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json({
      users: [],
      posts: [],
    });
  }

  const [users, posts] = await Promise.all([
    prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { subtitle: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        subtitle: true,
        bio: true,
      },
      take: 20,
    }),
    prisma.post.findMany({
      where: {
        description: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    users,
    posts,
  });
}
