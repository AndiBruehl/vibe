import { prisma } from "@/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get("slug") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit") || 20), 50) || 20;
    const cursor = searchParams.get("cursor") || undefined;

    if (!slug)
      return new Response(JSON.stringify({ posts: [] }), {
        headers: { "content-type": "application/json" },
      });

    const posts = await prisma.post.findMany({
      where: {
        topics: { some: { topic: { slug } } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit,
      select: {
        id: true,
        description: true,
        image: true,
        createdAt: true,
        likesCount: true,
        author: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
    });

    return new Response(JSON.stringify({ posts }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("/api/topics/feed error:", err);
    const message = err instanceof Error ? err.message : "Unknown";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
