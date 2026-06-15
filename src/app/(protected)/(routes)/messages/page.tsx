import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, MoveLeft } from "lucide-react";
import img1 from "../profile/default.jpg";
import MessagesToast from "./MessagesToast";
import ConversationListItem from "./ConversationListItem";

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
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl pb-24 md:pb-8">
      <MessagesToast />
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
            {conversations.map((conversation: any) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserProfile.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
