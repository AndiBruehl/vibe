import { auth } from "@/auth";
import BookmarkButton from "./../components/BookmarkButton";
import LikesInfo from "./../components/LikesInfo";
import { prisma } from "@/db";
import { Follow, Profile } from "@prisma/client";
import { Avatar } from "@radix-ui/themes";
import Link from "next/link";
import { redirect } from "next/navigation";

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

                  {profile?.username ? (
                    <p className="truncate text-xs text-zinc-400">
                      @{profile.username}
                    </p>
                  ) : null}
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
