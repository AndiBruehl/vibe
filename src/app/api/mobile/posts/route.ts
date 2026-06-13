import { prisma } from "@/db";
import { getMobileSession } from "@/mobile-auth";
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

export async function POST(request: NextRequest) {
  const session = await getMobileSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { description, image } = (await request.json().catch(() => ({}))) as {
    description?: unknown;
    image?: unknown;
  };
  const imageValue = typeof image === "string" ? image.trim() : "";
  const descriptionValue =
    typeof description === "string" ? description.trim() : "";

  if (!imageValue) {
    return NextResponse.json({ error: "Image is required." }, { status: 400 });
  }

  if (!descriptionValue) {
    return NextResponse.json(
      { error: "Description is required." },
      { status: 400 },
    );
  }

  const post = await prisma.post.create({
    data: {
      authorEmail: session.email,
      description: descriptionValue,
      image: imageValue,
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
