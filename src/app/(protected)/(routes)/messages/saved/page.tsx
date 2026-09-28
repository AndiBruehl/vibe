import { auth } from "@/auth";
import { prisma } from "@/db";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { notFound } from "next/navigation";
import SavedMessages from "@/app/components/SavedMessages";

export default async function SavedMessagesPage() {
  const session = await auth();
  if (!session?.user?.email) notFound();

  let loadFailed = false;
  let viewer: { id: string; language: string } | null = null;
  try {
    viewer = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true, language: true } });
  } catch {
    loadFailed = true;
  }
  if (!viewer) loadFailed = true;
  const de = viewer?.language === "de";
  const viewerId = viewer?.id ?? "";
  let bookmarks: Awaited<ReturnType<typeof prisma.messageBookmark.findMany>> = [];
  try {
    if (!viewer) throw new Error("Profile unavailable");
    bookmarks = await prisma.messageBookmark.findMany({
      where: { profileId: viewer.id },
      orderBy: { createdAt: "desc" },
      include: {
        message: {
          include: {
            sender: { select: { name: true, username: true } },
            conversation: {
              include: {
                participants: { include: { profile: { select: { id: true, name: true, username: true } } } },
              },
            },
          },
        },
      },
    });
  } catch {
    loadFailed = true;
  }

  const items = bookmarks.flatMap((bookmark) => {
    const message = bookmark.message;
    if (!message || !message.conversation || !message.sender) return [];
    const conversation = message.conversation;
    const other = conversation.participants.find((participant) => participant.profileId !== viewerId)?.profile;
    return [{
      id: message.id,
      conversationId: conversation.id,
      conversationName: conversation.name || other?.name || other?.username || (de ? "Unterhaltung" : "Conversation"),
      senderName: message.sender.name || message.sender.username || "VIBE",
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      hasAttachment: Boolean(message.imageUrl || message.sharedPostId),
    }];
  });

  return <main className="mx-auto w-full max-w-3xl pb-24 md:pb-8"><section className="flex items-center justify-between"><Link href="/messages" className="group flex items-center gap-2 text-slate-800 no-underline hover:text-orange-500 dark:text-slate-200 dark:hover:text-orange-300"><MoveLeft /><span className="opacity-0 transition-opacity group-hover:opacity-100">{de ? "Nachrichten" : "Messages"}</span></Link><h1 className="text-lg font-black text-slate-800 dark:text-white">{de ? "Gespeicherte Nachrichten" : "Saved messages"}</h1><div className="w-10" /></section><SavedMessages items={items} de={de} loadFailed={loadFailed} /></main>;
}
