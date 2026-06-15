/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, Heart, MessageCircle, MoveLeft, UserPlus } from "lucide-react";
import img1 from "../profile/default.jpg";

type ActivityItem = {
  id: string;
  type: "follow" | "like" | "comment" | "message";
  title: string;
  body: string;
  href: string;
  createdAt: Date;
  avatar?: string | null;
  image?: string | null;
};

function formatActivityDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const className = "size-4";
  if (type === "follow") return <UserPlus className={className} />;
  if (type === "like") return <Heart className={className} />;
  if (type === "message") return <MessageCircle className={className} />;
  return <Bell className={className} />;
}

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.email) notFound();

  const currentUserProfile = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!currentUserProfile) notFound();

  const [follows, postLikes, comments, conversations] = await Promise.all([
    // Safe Follows
    prisma.follow
      .findMany({
        where: { followingId: currentUserProfile.id },
        include: {
          follower: {
            select: { name: true, username: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
      .catch(() => []), // fallback if error

    // Safe Post Likes
    prisma.postLike
      .findMany({
        where: {
          authorEmail: { not: currentUserProfile.email },
          post: { authorEmail: currentUserProfile.email },
        },
        include: {
          author: { select: { name: true, username: true, avatar: true } },
          post: { select: { id: true, image: true, description: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
      .catch(() => []),

    // Safe Comments
    prisma.comment
      .findMany({
        where: {
          authorEmail: { not: currentUserProfile.email },
          post: { authorEmail: currentUserProfile.email },
        },
        include: {
          author: { select: { name: true, username: true, avatar: true } },
          post: { select: { id: true, image: true, description: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
      .catch(() => []),

    // Safe Conversations
    prisma.conversation
      .findMany({
        where: {
          participants: { some: { profileId: currentUserProfile.id } },
        },
        include: {
          participants: {
            include: {
              profile: {
                select: { id: true, name: true, username: true, avatar: true },
              },
            },
          },
          messages: {
            where: { senderId: { not: currentUserProfile.id } },
            include: {
              sender: { select: { name: true, username: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 15,
      })
      .catch(() => []),
  ]);

  const items: ActivityItem[] = [
    // Safe Follows
    ...follows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((f: any) => f.follower) // ← Safety
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((follow: any) => ({
        id: `follow-${follow.id}`,
        type: "follow" as const,
        title: `${follow.follower.name || follow.follower.username || "Someone"} followed you`,
        body: follow.follower.username ? `@${follow.follower.username}` : "",
        href: follow.follower.username
          ? `/profile/${follow.follower.username}`
          : "/profile",
        createdAt: follow.createdAt,
        avatar: follow.follower.avatar,
      })),

    // Safe Likes
    ...postLikes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((l: any) => l.author)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((like: any) => ({
        id: `like-${like.id}`,
        type: "like" as const,
        title: `${like.author.name || like.author.username || "Someone"} liked your post`,
        body: like.post.description || "View post",
        href: `/posts/${like.post.id}`,
        createdAt: like.createdAt,
        avatar: like.author.avatar,
        image: like.post.image,
      })),

    // Safe Comments
    ...comments
      .filter((c: any) => c.author)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((comment: any) => ({
        id: `comment-${comment.id}`,
        type: "comment" as const,
        title: `${comment.author.name || comment.author.username || "Someone"} commented on your post`,
        body: comment.text,
        href: `/posts/${comment.post.id}`,
        createdAt: comment.createdAt,
        avatar: comment.author.avatar,
        image: comment.post.image,
      })),

    // Safe Messages
    ...conversations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((conv: any) => conv.messages.length > 0)
      .map((conversation: any) => {
        const message = conversation.messages[0];
        const otherParticipant = conversation.participants.find(
          (p: any) => p.profileId !== currentUserProfile.id,
        );
        const profile = message.sender || otherParticipant?.profile;

        return {
          id: `message-${message.id}`,
          type: "message" as const,
          title: `${profile?.name || profile?.username || "Someone"} sent you a message`,
          body: message.body,
          href: `/messages/${conversation.id}`,
          createdAt: message.createdAt,
          avatar: profile?.avatar,
        };
      }),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 40);

  return (
    <main className="mx-auto w-full max-w-3xl pb-24 md:pb-8">
      <section className="flex items-center justify-between">
        <Link
          href="/home"
          className="group flex items-center gap-2 text-slate-800 no-underline hover:text-slate-600 dark:text-slate-200 dark:hover:text-slate-500"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            Back to Home
          </span>
        </Link>

        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Activity
        </h1>
        <div className="w-24" />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-red-500 text-white">
              <Bell size={24} />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              No activity yet.
            </p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Likes, comments, follows, and messages will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-gray-700"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <Image
                    src={item.avatar || img1.src}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                      <ActivityIcon type={item.type} />
                    </span>
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {item.body}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatActivityDate(item.createdAt)}
                  </p>
                </div>

                {item.image && (
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-slate-200 dark:bg-slate-700">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
