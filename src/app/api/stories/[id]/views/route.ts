import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const story = await prisma.story.findFirst({
    where: { id, authorEmail: session.user.email },
    select: { id: true },
  });
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const views = await prisma.storyView.findMany({
    where: { storyId: id },
    select: { viewerEmail: true, viewedAt: true },
    orderBy: { viewedAt: "desc" },
  });
  const viewerEmails = [...new Set(views.map((view) => view.viewerEmail))];
  const profiles = viewerEmails.length ? await prisma.profile.findMany({
    where: { email: { in: viewerEmails } },
    select: { email: true, username: true, name: true, avatar: true },
  }) : [];
  const profileByEmail = new Map<string, { username: string | null; name: string | null; avatar: string | null }>(
    profiles.map((profile) => [profile.email, profile]),
  );

  return NextResponse.json({
    viewers: views.map((view) => {
      const profile = profileByEmail.get(view.viewerEmail);
      return {
        email: view.viewerEmail,
        viewedAt: view.viewedAt.toISOString(),
        username: profile?.username ?? null,
        name: profile?.name ?? null,
        avatar: profile?.avatar ?? null,
      };
    }),
  });
}
