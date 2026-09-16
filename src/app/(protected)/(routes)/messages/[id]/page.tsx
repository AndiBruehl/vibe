import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoveLeft } from "lucide-react";
import img1 from "../../profile/default.jpg";
import ConversationLiveRefresh from "@/app/components/ConversationLiveRefresh";
import ConversationAutoScroll from "@/app/components/ConversationAutoScroll";
import LocalTime from "@/app/components/LocalTime";
import MentionText from "@/app/components/MentionText";
import MessageComposer from "@/app/components/MessageComposer";
import MessageReactionPicker from "@/app/components/MessageReactionPicker";
import VibeTeamBadge from "@/app/components/VibeTeamBadge";
import ProgressiveImage from "@/app/components/ProgressiveImage";
import ProfileAvatar from "@/app/components/ProfileAvatar";

import { isObjectId } from "@/object-id";
type ConversationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    notFound();
  }

  const { id } = await params;

  if (!isObjectId(id)) {
    notFound();
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      language: true,
    },
  });

  if (!currentUserProfile) {
    notFound();
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      participants: {
        some: {
          profileId: currentUserProfile.id,
        },
      },
    },
    include: {
      participants: {
        include: {
          profile: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              avatarAccent: true,
              avatarAccentEnd: true,
              avatarAccentDirection: true,
              isSystem: true,
              systemKind: true,
            },
          },
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              avatarAccent: true,
              avatarAccentEnd: true,
              avatarAccentDirection: true,
              isSystem: true,
              systemKind: true,
            },
          },
          sharedPost: {
            include: {
              author: { select: { name: true, username: true, avatar: true } },
            },
          },
          reactions: { select: { emoji: true, profileId: true } },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  const de = currentUserProfile.language === "de";

  const otherParticipant = conversation.participants.find(
    (participant: any) => participant.profileId !== currentUserProfile.id,
  );
  const otherProfile = otherParticipant?.profile;
  const currentParticipant = conversation.participants.find(
    (participant: any) => participant.profileId === currentUserProfile.id,
  );
  const hasUnreadMessages = conversation.messages.some(
    (message: any) =>
      message.senderId !== currentUserProfile.id &&
      (!currentParticipant?.lastReadAt ||
        message.createdAt > currentParticipant.lastReadAt),
  );

  if (hasUnreadMessages) {
    await prisma.conversationParticipant.update({
      where: {
        conversationId_profileId: {
          conversationId: conversation.id,
          profileId: currentUserProfile.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  const latestMessage = conversation.messages.at(-1);
  const isGroup =
    Boolean(conversation.isGroup) ||
    (conversation.participants && conversation.participants.length > 2) ||
    Boolean(conversation.name);
  const blockingRelation = !isGroup && otherProfile
    ? await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: currentUserProfile.id, blockedId: otherProfile.id },
            { blockerId: otherProfile.id, blockedId: currentUserProfile.id },
          ],
        },
        select: { blockerId: true },
      })
    : null;
  const conversationIsBlocked = Boolean(blockingRelation);
  const conversationIsSystemNoReply = conversation.participants.some((participant: any) => participant.profile.isSystem && participant.profile.systemKind !== "support");
  const blockedByOther = blockingRelation?.blockerId === otherProfile?.id;

  return (
    <main className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-3xl flex-col md:h-[calc(100dvh-2rem)]">
      <ConversationLiveRefresh
        conversationId={conversation.id}
        initialLatestMessageAt={latestMessage?.createdAt.toISOString() ?? null}
        initialMessageCount={conversation.messages.length}
      />

      <section className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 pb-4 pt-1 sm:px-6 dark:border-slate-700 dark:bg-transparent">
        <Link
          href="/messages"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-400 dark:hover:text-slate-500"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Inbox
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          {isGroup ? (
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <Image
                src={img1.src}
                alt={conversation.name || "Group avatar"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : otherProfile?.username ? (
            <Link href={`/profile/${encodeURIComponent(otherProfile.username)}`} className="block">
              <ProfileAvatar {...otherProfile} alt={otherProfile.name || "User avatar"} sizeClass="size-10" />
            </Link>
          ) : (
            <ProfileAvatar {...otherProfile} alt={otherProfile?.name || "User avatar"} sizeClass="size-10" />
          )}
          <div className="min-w-0 text-right">
            {isGroup ? (
              <Link
                href={`/messages/group/${conversation.id}`}
                className="truncate font-semibold text-slate-800 dark:text-slate-100 no-underline hover:underline"
              >
                {conversation.name ||
                  conversation.participants
                    .map(
                      (p: any) =>
                        p.profile?.name ||
                        p.profile?.username ||
                        "Unknown user",
                    )
                    .slice(0, 3)
                    .join(", ")}
              </Link>
            ) : otherProfile?.username ? (
              <Link
                href={`/profile/${encodeURIComponent(otherProfile.username)}`}
                className="truncate font-semibold text-slate-800 dark:text-slate-100 no-underline hover:underline"
              >
                <span className="inline-flex items-center gap-1">{otherProfile?.name || otherProfile?.username || "Unknown user"}<VibeTeamBadge isSystem={otherProfile?.isSystem} /></span>
              </Link>
            ) : (
              <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                {otherProfile?.name || otherProfile?.username || "Unknown user"}
              </p>
            )}

            {conversation.isGroup ? (
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {conversation.participants.length} members
              </p>
            ) : otherProfile?.username ? (
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                @{otherProfile.username}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="conversation-messages min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
        {conversation.messages.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
            <p className="text-slate-700 dark:text-slate-300">
              This conversation is empty.
            </p>
          </div>
        ) : (
          conversation.messages.map((message: any) => {
            const isOwnMessage = message.senderId === currentUserProfile.id;
            const wasSeen = Boolean(
              isOwnMessage &&
              !isGroup &&
              otherParticipant?.lastReadAt &&
              new Date(otherParticipant.lastReadAt).getTime() >= new Date(message.createdAt).getTime(),
            );

            return (
              <article
                key={message.id}
                className={`flex flex-col ${
                  isOwnMessage ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                    isOwnMessage
                      ? "bg-linear-to-r from-red-500 to-yellow-500 text-white"
                      : "bg-white text-slate-800 dark:bg-gray-800 dark:text-slate-100"
                  }`}
                >
                  {!isOwnMessage && conversation.isGroup ? (
                    <div className="mb-1">
                      {message.sender?.username ? (
                        <Link
                          href={`/profile/${encodeURIComponent(message.sender.username)}`}
                          className="text-sm font-semibold text-slate-800 dark:text-slate-100 no-underline hover:underline"
                        >
                          {message.sender?.name || message.sender?.username}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {message.sender?.name ||
                            message.sender?.username ||
                            "Someone"}
                        </span>
                      )}
                    </div>
                  ) : null}
                  {!message.sharedPost ? <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                    <MentionText text={message.body} linkClassName={isOwnMessage ? "font-semibold text-white underline decoration-white/60 underline-offset-2" : undefined} />
                  </p> : null}
                  {message.sharedPost ? <p className={`mb-2 text-sm font-semibold ${isOwnMessage ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>{isOwnMessage ? (de ? "Du hast einen Beitrag geteilt" : "You shared a post") : (de ? `${message.sender?.name || message.sender?.username || "Jemand"} hat einen Beitrag geteilt` : `${message.sender?.name || message.sender?.username || "Someone"} shared a post`)}</p> : null}
                  {message.sharedPost ? <Link href={`/posts/${message.sharedPost.id}`} className={`block overflow-hidden rounded-xl no-underline ${isOwnMessage ? "bg-white/15 text-white" : "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100"}`}>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-700"><ProgressiveImage src={message.sharedPost.image} alt={de ? "Geteilter Beitrag" : "Shared post"} lockAspectRatio="16 / 9" containerClassName="size-full" className="object-cover" /></div>
                    <div className="p-3"><p className={`text-xs font-bold uppercase tracking-wide ${isOwnMessage ? "text-white/75" : "text-slate-500"}`}>{de ? "Geteilter Beitrag" : "Shared post"}</p><p className="mt-1 truncate text-sm font-semibold">{message.sharedPost.author?.name || message.sharedPost.author?.username || "VIBE"}</p><p className={`mt-1 line-clamp-2 text-sm ${isOwnMessage ? "text-white/90" : "text-slate-600 dark:text-slate-300"}`}>{message.sharedPost.description || (de ? "Beitrag auf VIBE ansehen" : "View this post on VIBE")}</p></div>
                  </Link> : null}
                  {message.imageUrl ? (
                    <Image
                      src={message.imageUrl}
                      alt="Image attachment"
                      width={520}
                      height={520}
                      className="mt-2 max-h-96 w-auto max-w-full rounded-xl object-contain"
                      unoptimized
                    />
                  ) : null}
                  <MessageReactionPicker
                    messageId={message.id}
                    currentProfileId={currentUserProfile.id}
                    reactions={message.reactions}
                  />
                  <p
                    className={`mt-1 text-right text-[11px] ${
                      isOwnMessage ? "text-white/75" : "text-slate-400"
                    }`}
                  >
                    <LocalTime
                      iso={message.createdAt}
                      options={{ hour: "2-digit", minute: "2-digit" }}
                    />
                  </p>
                </div>
                {isOwnMessage && !isGroup && (
                  <p className={`mt-1 pr-1 text-right text-[11px] font-semibold ${wasSeen ? "text-slate-400 dark:text-slate-500" : "text-slate-400/80 dark:text-slate-500"}`}>
                    {wasSeen ? (de ? "Gesehen" : "Read") : (de ? "Ungelesen" : "Unread")}
                  </p>
                )}
              </article>
            );
          })
        )}
        <ConversationAutoScroll latestMessageId={latestMessage?.id} />
      </section>

      <div className="shrink-0 px-4 pt-3 sm:px-6">
        <MessageComposer conversationId={conversation.id} blocked={conversationIsBlocked} blockedByOther={blockedByOther} systemNoReply={conversationIsSystemNoReply} />
      </div>
    </main>
  );
}
