import SortablePosts from "./SortablePosts";
import PostCarousel from "./PostCarousel";
import CommentForm from "./CommentForm";
import { getPostImages } from "@/post-images";
import { auth } from "@/auth";
import BookmarkButton from "./../components/BookmarkButton";
import LikesInfo from "./../components/LikesInfo";
import { prisma } from "@/db";
import { Avatar } from "@radix-ui/themes";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Camera as CameraIcon,
  MessageCircle,
  Search,
  UserPlus,
} from "lucide-react";
import FeedModeSwitch from "./FeedModeSwitch";

type Follow = {
  followingId: string;
};

type Profile = {
  email?: string | null;
};

type HomePostsProps = {
  follows: Follow[];
  profiles: Profile[];
  feedMode: "following" | "for-you";
};

type PostTopicWithTopic = {
  id: string;
  topic: {
    name: string;
    slug: string;
  };
};

export default async function HomePosts({
  follows,
  profiles,
  feedMode,
}: HomePostsProps) {
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

  /*
   * WICHTIG:
   * Kommentare laden absichtlich NICHT mehr ihre author-Relation.
   *
   * Alte Kommentare können auf ein inzwischen nicht mehr vorhandenes
   * Profile zeigen. Würden wir "author" direkt über Prisma includen,
   * könnte dadurch die komplette /home-Seite mit einem 500-Fehler
   * abstürzen.
   *
   * Die Profile der Kommentar-Autoren werden weiter unten separat
   * geladen und bekommen bei Bedarf einen Fallback.
   */
  const posts = await prisma.post.findMany({
    where:
      feedMode === "following"
        ? {
            OR: [
              { authorEmail: sessionEmail },
              { authorEmail: { in: followedEmails } },
            ],
          }
        : undefined,
    include: {
      topics: {
        include: {
          topic: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
      comments: {
        where: {
          parentCommentId: null,
        },
        take: 3,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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

  /*
   * Post-Autoren sammeln.
   * authorEmail kann bei alten/verwaisten Posts null sein.
   */
  const postAuthorEmails = [
    ...new Set(
      posts
        .map((post) => post.authorEmail)
        .filter((email): email is string => Boolean(email)),
    ),
  ];

  /*
   * Kommentar-Autoren separat sammeln.
   * Dadurch müssen wir die problematische Prisma-Relation nicht includen.
   */
  const commentAuthorEmails = [
    ...new Set(
      posts
        .flatMap((post) =>
          post.comments.map((comment) => comment.authorEmail),
        )
        .filter((email): email is string => Boolean(email)),
    ),
  ];

  /*
   * Alle benötigten Profile mit EINER sicheren Abfrage laden.
   */
  const allAuthorEmails = [
    ...new Set([...postAuthorEmails, ...commentAuthorEmails]),
  ];

  const authors =
    allAuthorEmails.length > 0
      ? await prisma.profile.findMany({
          where: {
            email: {
              in: allAuthorEmails,
            },
          },
        })
      : [];

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
          <FeedModeSwitch feedMode={feedMode} />
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-500">
              Nothing here yet
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-500">
              {feedMode === "following"
                ? "Create your first entry or follow people to fill your feed."
                : "There are no posts to discover yet."}
            </p>

            {shouldShowNameHint ? (
              <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-100/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
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

                <span className="text-[18px] font-normal text-slate-900 transition-all duration-200 group-hover:bg-linear-to-tr group-hover:from-(--ig-orange) group-hover:to-(--ig-red) group-hover:bg-clip-text group-hover:text-transparent dark:text-slate-100">
                  Create your first entry
                </span>
              </Link>

              <Link
                href="/search"
                className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <Search size={16} />
                Find people to follow
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus
                size={18}
                className="text-slate-700 dark:text-slate-200"
              />

              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
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
                    href={user.username ? `/profile/${encodeURIComponent(user.username)}` : "#"}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        radius="full"
                        src={user.avatar || undefined}
                        size="3"
                        fallback={(
                          user.username?.[0] ||
                          user.name?.[0] ||
                          "?"
                        ).toUpperCase()}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
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
    <section className="mx-auto w-full max-w-5xl">
      <SortablePosts
        posts={posts.map((post) => ({
          id: post.id,
          description: post.description,
          createdAt: post.createdAt,
        }))}
        headerAfterCount={<FeedModeSwitch feedMode={feedMode} />}
        className="flex w-full flex-col gap-8"
      >
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
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
            >
              <div className="relative z-20 flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-white/10">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    radius="full"
                    src={profile?.avatar || undefined}
                    size="3"
                    fallback={(profile?.username?.[0] || "?").toUpperCase()}
                  />

                  <div className="min-w-0">
                    <Link
                      className="relative z-20 block truncate text-sm font-semibold text-slate-900 transition hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-300"
                      href={
                        profile?.username
                          ? `/profile/${encodeURIComponent(profile.username)}`
                          : "#"
                      }
                    >
                      {profile?.name || profile?.username || "Unknown user"}
                    </Link>

                    {profile?.username && (
                      <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
                <div className="border-b border-slate-200 dark:border-white/10 lg:border-r lg:border-b-0">
                  <PostCarousel
                    images={getPostImages(post)}
                    alt={post.description || "Post image"}
                    href={`/posts/${post.id}`}
                  />

                  <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-5">
                    <div className="flex items-center gap-1">
                      <LikesInfo
                        post={post}
                        showText
                        sessionLike={sessionLike}
                      />

                      <Link
                        href={`/posts/${post.id}#comments`}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-slate-600 transition hover:bg-black/5 hover:text-orange-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-orange-300"
                        aria-label={`View ${post._count.comments} comments`}
                      >
                        <MessageCircle className="size-5" />

                        <span>
                          {post._count.comments}{" "}
                          {post._count.comments === 1
                            ? "comment"
                            : "comments"}
                        </span>
                      </Link>
                    </div>

                    <BookmarkButton
                      postId={post.id}
                      initialBookmarked={isBookmarked}
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col px-4 py-5 sm:px-5 lg:max-h-[36rem]">
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-slate-900 dark:text-slate-200">
                      {post.description}
                    </p>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>

                    {post.topics?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.topics.map(
                          (postTopic: PostTopicWithTopic) => (
                            <Link
                              key={postTopic.id}
                              href={`/topics/${postTopic.topic.slug}`}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 no-underline hover:underline dark:bg-slate-800 dark:text-slate-200"
                            >
                              #{postTopic.topic.name}
                            </Link>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 hidden min-h-0 flex-1 border-t border-slate-200 pt-4 dark:border-white/10 lg:block">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <MessageCircle
                          size={16}
                          className="text-orange-500"
                        />

                        {post._count.comments}{" "}
                        {post._count.comments === 1
                          ? "comment"
                          : "comments"}
                      </h2>

                      <Link
                        href={`/posts/${post.id}`}
                        className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-300"
                      >
                        View all
                      </Link>
                    </div>

                    {post.comments.length ? (
                      <div className="space-y-3 overflow-y-auto pr-1">
                        {post.comments.map((comment) => {
                          const commentAuthor =
                            authors.find(
                              (author) =>
                                author.email === comment.authorEmail,
                            ) || null;

                          return (
                            <div
                              key={comment.id}
                              className="text-sm leading-5 text-slate-700 dark:text-slate-300"
                            >
                              {commentAuthor?.username ? (
                                <Link
                                  href={`/profile/${encodeURIComponent(commentAuthor.username)}`}
                                  className="mr-1 font-semibold text-slate-900 hover:underline dark:text-white"
                                >
                                  {commentAuthor.name ||
                                    commentAuthor.username}
                                </Link>
                              ) : (
                                <span className="mr-1 font-semibold text-slate-900 dark:text-white">
                                  {commentAuthor?.name || "VIBE member"}
                                </span>
                              )}

                              <span className="break-words">
                                {comment.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No comments yet. Be the first to join the conversation.
                      </p>
                    )}

                    <CommentForm postId={post.id} compact />
                  </div>

                  <Link
                    href={`/posts/${post.id}#comments`}
                    className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600 dark:text-slate-300 dark:hover:text-orange-300 lg:hidden"
                  >
                    <MessageCircle size={16} />

                    View {post._count.comments}{" "}
                    {post._count.comments === 1 ? "comment" : "comments"}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </SortablePosts>
    </section>
  );
}
