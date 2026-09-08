import { prisma } from "@/db";
import { getMobileSession } from "@/mobile-auth";
import { NextResponse, type NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (typeof body?.liked !== "boolean") return NextResponse.json({ error: "Liked must be a boolean." }, { status: 400 });
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const saved = await prisma.$transaction(async tx => {
    const where = { postId_authorEmail: { postId: id, authorEmail: session.email } };
    const existing = await tx.postLike.findUnique({ where });
    if (body.liked && !existing) {
      await tx.postLike.create({ data: { postId: id, authorEmail: session.email } });
      await tx.post.update({ where: { id }, data: { likesCount: { increment: 1 } } });
    } else if (!body.liked && existing) {
      await tx.postLike.delete({ where });
      await tx.post.update({ where: { id }, data: { likesCount: { decrement: 1 } } });
    }
    return tx.post.findUniqueOrThrow({ where: { id }, select: { likesCount: true } });
  });
  return NextResponse.json({ liked: body.liked, likes: saved.likesCount });
}
