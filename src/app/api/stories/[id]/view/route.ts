import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const story = await prisma.story.findFirst({
    where: { id, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.storyView.upsert({
    where: { storyId_viewerEmail: { storyId: id, viewerEmail: session.user.email } },
    update: { viewedAt: new Date() },
    create: { storyId: id, viewerEmail: session.user.email },
  });
  return NextResponse.json({ ok: true });
}
