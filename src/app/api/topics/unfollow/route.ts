import { auth } from "@/auth";
import { prisma } from "@/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) return new Response("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const topicId = body.topicId as string | undefined;
    const slug = (body.slug as string | undefined)?.trim();

    if (!topicId && !slug)
      return new Response("topicId or slug required", { status: 400 });

    const profile = await prisma.profile.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!profile) return new Response("Profile not found", { status: 404 });

    const topic = topicId
      ? await prisma.topic.findUnique({ where: { id: topicId } })
      : await prisma.topic.findFirst({ where: { slug } });

    if (!topic) return new Response("Topic not found", { status: 404 });

    await prisma.topicFollow.deleteMany({
      where: { profileId: profile.id, topicId: topic.id },
    });

    revalidatePath(`/topics/${topic.slug}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("/api/topics/unfollow error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
