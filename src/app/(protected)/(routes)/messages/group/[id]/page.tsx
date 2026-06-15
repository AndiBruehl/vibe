import { auth } from "@/auth";
import { prisma } from "@/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import GroupSettings from "@/app/(protected)/(routes)/messages/GroupSettings";

type GroupPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export default async function GroupPage({ params }: GroupPageProps) {
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
    select: { id: true },
  });

  if (!currentUserProfile) {
    notFound();
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      isGroup: true,
      participants: {
        some: {
          profileId: currentUserProfile.id,
        },
      },
    },
    include: {
      participants: {
        include: { profile: true },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col pb-24 md:pb-4">
      <section className="flex items-center justify-between border-b border-slate-200 bg-white pb-4 dark:border-slate-700 dark:bg-transparent">
        <Link
          href={`/messages/${conversation.id}`}
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-400 dark:hover:text-slate-500"
        >
          ← Back
        </Link>
        <div className="min-w-0 text-right">
          <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {conversation.name || "Group"}
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {conversation.participants.length} members
          </p>
        </div>
      </section>

      <section className="mt-6">
        <GroupSettings
          conversationId={conversation.id}
          initialName={conversation.name}
          participants={conversation.participants.map((p) => p.profile)}
          currentUserId={currentUserProfile.id}
        />
      </section>
    </main>
  );
}
