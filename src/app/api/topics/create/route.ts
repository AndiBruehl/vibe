import { auth } from "@/auth";
import { prisma } from "@/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) return new Response("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = (body.name || "").trim();
    const slug = (body.slug || "").trim().toLowerCase();
    const description = (body.description || "").trim();

    if (!name) return new Response("Topic name required", { status: 400 });

    const normalizedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const existing = await prisma.topic.findFirst({
      where: { OR: [{ name }, { slug: normalizedSlug }] },
    });
    if (existing) {
      return new Response(JSON.stringify({ id: existing.id, existing: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        slug: normalizedSlug,
        description: description || null,
      },
      select: { id: true, name: true, slug: true, description: true },
    });

    // revalidate any topic index or discovery pages
    revalidatePath(`/topics`);

    return new Response(JSON.stringify(topic), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("/api/topics/create error:", err);
    const body = {
      error: err?.message || "Unknown error",
      stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
    };
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
