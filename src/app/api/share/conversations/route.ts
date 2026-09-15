import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ conversations: [] }, { status: 401 });
  const viewer = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!viewer) return NextResponse.json({ conversations: [] });
  const conversations = await prisma.conversation.findMany({ where: { participants: { some: { profileId: viewer.id } } }, include: { participants: { include: { profile: { select: { id: true, name: true, username: true, isSystem: true, systemKind: true } } } } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ conversations: conversations.filter((conversation) => !conversation.participants.some((item) => item.profile.isSystem)).map((conversation) => ({ id: conversation.id, label: conversation.isGroup ? (conversation.name || "Group") : `@${conversation.participants.find((item) => item.profileId !== viewer.id)?.profile.username || conversation.participants.find((item) => item.profileId !== viewer.id)?.profile.name || "Conversation"}` })) });
}
