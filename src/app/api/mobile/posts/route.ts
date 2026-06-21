import { prisma } from "@/db";
import { getMobileSession } from "@/mobile-auth";
import { NextResponse, type NextRequest } from "next/server";

function normalizeTopic(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseTopics(value: unknown) {
  if (typeof value !== "string") {
    return [];
  }

  const uniqueTopics = new Map<string, string>();

  for (const topic of value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    const slug = normalizeTopic(topic);

    if (slug && !uniqueTopics.has(slug)) {
      uniqueTopics.set(slug, topic);
    }
  }

  return Array.from(uniqueTopics.entries()).slice(0, 5);
}

async function linkTopics(postId: string, topicsValue: unknown) {
  const topics = parseTopics(topicsValue);

  for (const [slug, name] of topics) {
    const topic = await prisma.topic.upsert({
      create: { name, slug },
      update: {},
      where: { slug },
    });

    await prisma.postTopic
      .create({
        data: {
          postId,
          topicId: topic.id,
        },
      })
      .catch(() => null);
  }
}

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

export async function POST(request: NextRequest) {
  const session = await getMobileSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    description?: unknown;
    image?: unknown;
    topics?: unknown;
  };
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (!image) {
    return NextResponse.json({ error: "Image is missing." }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      authorEmail: session.email,
      description,
      image,
    },
    include: {
      author: {
        select: {
          avatar: true,
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  await linkTopics(post.id, body.topics);

  return NextResponse.json(post, { status: 201 });
}
