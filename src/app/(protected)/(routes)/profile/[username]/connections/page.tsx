import { auth } from "@/auth";
import ProfileConnectionList from "@/app/components/ProfileConnectionList";
import { prisma } from "@/db";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ProfileConnectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ list?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) notFound();

  const { username: routeUsername } = await params;
  const { list } = await searchParams;
  let username = routeUsername;
  try {
    username = decodeURIComponent(routeUsername);
  } catch {
    // Keep the route segment if it cannot be decoded.
  }

  const profile = await prisma.profile.findUnique({ where: { username } });
  if (!profile) notFound();

  const viewer = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!viewer) notFound();

  const title = list === "following" ? "Following" : "Followers";
  const connections =
    title === "Followers"
      ? await prisma.follow.findMany({
          where: { followingId: profile.id },
          select: { followerId: true },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.follow.findMany({
          where: { followerId: profile.id },
          select: { followingId: true },
          orderBy: { createdAt: "desc" },
        });

  const connectionIds = connections.map((connection) =>
    "followerId" in connection ? connection.followerId : connection.followingId,
  );
  const profiles = connectionIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: connectionIds } },
        select: { id: true, name: true, username: true, avatar: true },
      })
    : [];
  const profilesById = new Map(profiles.map((connection) => [connection.id, connection]));
  // Preserve follow creation order and ignore stale follows whose profile was deleted.
  const connectionProfiles = connectionIds.flatMap((id) => {
    const connection = profilesById.get(id);
    return connection ? [connection] : [];
  });
  const viewerFollows = connectionIds.length
    ? await prisma.follow.findMany({
        where: { followerId: viewer.id, followingId: { in: connectionIds } },
        select: { followingId: true },
      })
    : [];
  const followedIds = new Set(viewerFollows.map((follow) => follow.followingId));

  return (
    <main className="mx-auto w-full max-w-2xl pb-24 md:pb-8">
      <Link
        href={`/profile/${encodeURIComponent(profile.username || username)}`}
        className="group mb-6 inline-flex items-center gap-2 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
      >
        <MoveLeft className="size-5" />
        <span className="opacity-0 transition-opacity group-hover:opacity-100">Back to profile</span>
      </Link>
      <ProfileConnectionList
        title={title}
        profiles={connectionProfiles.map((connection) => ({
          id: connection.id,
          name: connection.name,
          username: connection.username,
          avatar: connection.avatar,
          isFollowing: followedIds.has(connection.id),
          isSelf: connection.id === viewer.id,
        }))}
      />
    </main>
  );
}
