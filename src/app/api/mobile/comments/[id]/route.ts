import { prisma } from "@/db";
import { getMobileSession } from "@/mobile-auth";
import { NextResponse, type NextRequest } from "next/server";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const session = await getMobileSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { text } = body as { text?: string };

  if (typeof text !== "string" || text.trim() === "") {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (comment.authorEmail !== session.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { text },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const session = await getMobileSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (comment.authorEmail !== session.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // delete the comment and its direct replies
  await prisma.comment.deleteMany({
    where: { OR: [{ id }, { parentCommentId: id }] },
  });

  return NextResponse.json({ ok: true });
}
