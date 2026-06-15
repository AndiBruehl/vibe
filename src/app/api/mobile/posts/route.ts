import { prisma } from "@/db";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");

  const posts = await prisma.post.findMany({
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
    orderBy: mode === "browse" ? { likesCount: "desc" } : { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(posts);
}
