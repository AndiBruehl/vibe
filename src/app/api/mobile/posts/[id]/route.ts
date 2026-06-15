import { prisma } from "@/db";
import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

type MobilePostRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export async function GET(_request: NextRequest, { params }: MobilePostRouteProps) {
  const { id } = await params;

  if (!isObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          avatar: true,
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(request: NextRequest, { params }: MobilePostRouteProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.authorEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data: any = {};
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.image === "string") data.image = body.image;

  const updated = await prisma.post.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: MobilePostRouteProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.authorEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // remove related records then the post
  await prisma.postLike.deleteMany({ where: { postId: id } });
  await prisma.postBookmark.deleteMany({ where: { postId: id } });
  await prisma.comment.deleteMany({ where: { postId: id } });
  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

