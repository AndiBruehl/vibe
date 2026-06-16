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

    const where: any = {
      topics: { some: { topic: { slug } } },
    };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
  } catch (err: any) {
    console.error("/api/topics/feed error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
