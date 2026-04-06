import { auth } from "@/auth";
import BookmarkButton from "./../components/BookmarkButton";
import LikesInfo from "./../components/LikesInfo";
import { prisma } from "@/db";
import { Follow, Profile } from "@prisma/client";
import { Avatar } from "@radix-ui/themes";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera as CameraIcon, Search, UserPlus } from "lucide-react";

type HomePostsProps = {
  follows: Follow[];
  profiles: Profile[];
};

export default async function HomePosts({ follows, profiles }: HomePostsProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const sessionEmail = session.user.email;

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: sessionEmail,
    },
  });

  const followedEmails = profiles
    .map((profile) => profile.email)
    .filter((email): email is string => Boolean(email));

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { authorEmail: sessionEmail },
        { authorEmail: { in: followedEmails } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const likes = await prisma.postLike.findMany({
    where: {
      authorEmail: sessionEmail,
      postId: {
        in: posts.map((post) => post.id),
      },
    },
  });

  const bookmarks = await prisma.postBookmark.findMany({
    where: {
      authorEmail: sessionEmail,
      postId: {
        in: posts.map((post) => post.id),
      },
    },
  });

  const authorEmails = [...new Set(posts.map((post) => post.authorEmail))];

  const authors = await prisma.profile.findMany({
    where: {
      email: {
        in: authorEmails,
      },
    },
  });

  const followedProfileIds = follows.map((follow) => follow.followingId);

  const suggestedUsers = await prisma.profile.findMany({
    where: {
      AND: [
        {
          email: {
            not: sessionEmail,
          },
        },
        currentUserProfile
          ? {
              id: {
                not: currentUserProfile.id,
                notIn: followedProfileIds,
              },
            }
          : {},
      ],
    },
    take: 5,
  });

  const shouldShowNameHint =
    !currentUserProfile?.name ||
    !currentUserProfile.name.trim() ||
    !currentUserProfile.username ||
    !currentUserProfile.username.trim();

  if (posts.length === 0) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-xl backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Nothing here yet
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Create your first entry or follow people to fill your feed.
            </p>

            {shouldShowNameHint ? (
              <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-100/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                Tip: Update your name and username under{" "}
                <Link
                  href="/settings"
                  className="font-semibold underline underline-offset-2"
                >
                  Settings
                </Link>{" "}
                so other people can find your profile more easily.
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-center gap-4">
              <Link
                href="/create"
                className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full">
                  <div className="absolute inset-0 overflow-hidden rounded-full shadow-md transition-transform duration-200 group-hover:scale-105">
                    <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) transition-opacity duration-300 group-hover:opacity-0" />
                    <div className="absolute inset-0 rounded-full bg-linear-to-tr from-(--ig-red) to-(--ig-orange) opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <CameraIcon className="relative z-10 size-5 text-white transition-transform duration-200 group-hover:scale-90" />
                </div>

                <span className="text-[18px] font-normal text-black transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-white">
                  Create your first entry
                </span>
              </Link>

              <Link
                href="/search"
                className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <Search size={16} />
                Find people to follow
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus
                size={18}
                className="text-slate-700 dark:text-slate-200"
              />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Suggested users
              </h3>
            </div>

            {suggestedUsers.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No suggestions yet. Try using search to discover more profiles.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestedUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={user.username ? `/profile/${user.username}` : "#"}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        radius="full"
                        src={user.avatar || ""}
                        size="3"
                        fallback={(
                          user.username?.[0] ||
                          user.name?.[0] ||
                          "?"
                        ).toUpperCase()}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {user.name || user.username || "Unknown user"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          @{user.username || "no-username"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-xl bg-linear-to-r from-red-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
                      View
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {posts.map((post) => {
        const profile =
          authors.find((author) => author.email === post.authorEmail) || null;

        const sessionLike =
          likes.find((like) => like.postId === post.id) || null;

        const isBookmarked = bookmarks.some(
          (bookmark) => bookmark.postId === post.id,
        );

        return (
          <article
            key={post.id}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-xl"
          >
            <div className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  radius="full"
                  src={profile?.avatar || ""}
                  size="3"
                  fallback={(profile?.username?.[0] || "?").toUpperCase()}
                />

                <div className="min-w-0">
                  <Link
                    className="relative z-20 block truncate text-sm font-semibold text-white transition hover:text-zinc-300"
                    href={
                      profile?.username ? `/profile/${profile.username}` : "#"
                    }
                  >
                    {profile?.name || profile?.username || "Unknown user"}
                  </Link>

                  {profile?.username && (
                    <p className="truncate text-xs text-zinc-400">
                      @{profile.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative z-20 flex items-center gap-2">
                <LikesInfo
                  post={post}
                  showText={false}
                  sessionLike={sessionLike}
                />
                <BookmarkButton
                  postId={post.id}
                  initialBookmarked={isBookmarked}
                />
              </div>
            </div>

            <Link href={`/posts/${post.id}`} className="relative z-0 block">
              <img
                className="block aspect-square w-full object-cover"
                src={post.image}
                alt={post.description || "Post image"}
              />
            </Link>

            <div className="space-y-3 px-4 py-4 sm:px-5">
              <p className="text-sm leading-6 text-zinc-200">
                {post.description}
              </p>

              <div className="text-xs text-zinc-500">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
