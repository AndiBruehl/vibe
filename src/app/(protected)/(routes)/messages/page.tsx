import { auth } from "@/auth";
import { prisma } from "@/db";
import { createGroupConversation } from "@/actions";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, MoveLeft } from "lucide-react";
import img1 from "../profile/default.jpg";

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user?.email) {
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

  const conversations = await prisma.conversation.findMany({
    where: {
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
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl pb-24 md:pb-8">
      <section className="flex items-center justify-between">
        <Link
          href="/home"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-400 dark:hover:text-slate-500"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Back to Home
          </span>
        </Link>

        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Messages
        </h1>

        <div className="w-24" />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl bg-white p-6 shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Create a group chat
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Add at least two usernames separated by commas to start a new group.
        </p>
        <form
          action={createGroupConversation}
          className="mt-4 grid gap-3"
        >
          <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Group name</span>
            <input
              name="name"
              required
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="My friends group"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Participant usernames</span>
            <input
              name="participantUsernames"
              required
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="alice, bob, charlie"
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            Create Group
          </button>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white">
              <MessageCircle size={24} />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              No messages yet.
            </p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Open another profile and start a private conversation from there.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (participant) =>
                  participant.profileId !== currentUserProfile.id,
              );
              const currentParticipant = conversation.participants.find(
                (participant) =>
                  participant.profileId === currentUserProfile.id,
              );
              const otherProfile = otherParticipant?.profile;
              const otherParticipants = conversation.participants.filter(
                (participant) => participant.profileId !== currentUserProfile.id,
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
                    .slice(0, 2)
                    .join(", ")
                : otherProfile?.name ||
                  otherProfile?.username ||
                  "Unknown user";
              const conversationSubtitle = conversation.isGroup
                ? `${otherParticipants.length + 1} members`
                : otherProfile?.username
                ? `@${otherProfile.username}`
                : "";
              const latestMessage = conversation.messages[0];
              const isUnread =
                latestMessage &&
                latestMessage.senderId !== currentUserProfile.id &&
                (!currentParticipant?.lastReadAt ||
                  latestMessage.createdAt > currentParticipant.lastReadAt);

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className={`flex items-center gap-4 px-5 py-4 transition ${
                    isUnread
                      ? "bg-red-50/80 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                      : "hover:bg-slate-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div
                    className={`relative size-12 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${
                      isUnread ? "ring-2 ring-red-500 ring-offset-2" : ""
                    } ring-offset-white dark:ring-offset-gray-800`}
                  >
                    <Image
                      src={otherProfile?.avatar || img1.src}
                      alt={otherProfile?.name || "User avatar"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`truncate text-slate-800 dark:text-slate-100 ${
                          isUnread ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {conversationTitle}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {isUnread ? (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                            New
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-400">
                          {latestMessage
                            ? new Date(
                                latestMessage.createdAt,
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {conversationSubtitle}
                    </p>
                    <p
                      className={`truncate text-sm ${
                        isUnread
                          ? "font-semibold text-slate-900 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {latestMessage?.body || "Start the conversation."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
