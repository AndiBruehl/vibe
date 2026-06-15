import { sendMessage } from "@/actions";
import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoveLeft, Send } from "lucide-react";
import img1 from "../../profile/default.jpg";
import ConversationLiveRefresh from "@/app/components/ConversationLiveRefresh";
import ConversationAutoScroll from "@/app/components/ConversationAutoScroll";

type ConversationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

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
            },
          },
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

  const otherParticipants = conversation.participants.filter(
    (participant) => participant.profileId !== currentUserProfile.id,
  );
  const otherParticipant = otherParticipants[0];
  const otherProfile = otherParticipant?.profile;
  const currentParticipant = conversation.participants.find(
    (participant) => participant.profileId === currentUserProfile.id,
  );
  const conversationTitle = conversation.isGroup
    ? conversation.name ||
      otherParticipants
        .map(
          (participant) =>
            participant.profile?.name ||
            participant.profile?.username ||
            "Unknown user",
        )
        .slice(0, 3)
        .join(", ")
    : otherProfile?.name || otherProfile?.username || "Unknown user";
  const conversationSubtitle = conversation.isGroup
    ? `${conversation.participants.length} members`
    : otherProfile?.username
      ? `@${otherProfile.username}`
      : "";
  const hasUnreadMessages = conversation.messages.some(
    (message) =>
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

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col pb-24 md:pb-4">
      <ConversationLiveRefresh
        conversationId={conversation.id}
        initialLatestMessageAt={latestMessage?.createdAt.toISOString() ?? null}
        initialMessageCount={conversation.messages.length}
      />

      <section className="flex items-center justify-between border-b border-slate-200 bg-white pb-4 dark:border-slate-700 dark:bg-transparent">
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
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <Image
              src={otherProfile?.avatar || img1.src}
              alt={conversationTitle || "Conversation avatar"}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 text-right">
            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
              {conversationTitle}
            </p>
            {conversationSubtitle ? (
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {conversationSubtitle}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="flex-1 space-y-3 overflow-y-auto py-6">
        {conversation.messages.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
            <p className="text-slate-700 dark:text-slate-300">
              This conversation is empty.
            </p>
          </div>
        ) : (
          conversation.messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserProfile.id;

            return (
              <article
                key={message.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                    isOwnMessage
                      ? "bg-linear-to-r from-red-500 to-yellow-500 text-white"
                      : "bg-white text-slate-800 dark:bg-gray-800 dark:text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                    {message.body}
                  </p>
                  <p
                    className={`mt-1 text-right text-[11px] ${
                      isOwnMessage ? "text-white/75" : "text-slate-400"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </article>
            );
          })
        )}
        <ConversationAutoScroll latestMessageId={latestMessage?.id} />
      </section>

      <form
        action={sendMessage}
        className="sticky bottom-20 flex items-end gap-3 rounded-2xl bg-white p-3 shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900 md:bottom-4"
      >
        <input type="hidden" name="conversationId" value={conversation.id} />
        <textarea
          name="body"
          rows={1}
          placeholder="Message"
          className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100"
          required
        />
        <button
          type="submit"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white transition hover:scale-105"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </main>
  );
}
