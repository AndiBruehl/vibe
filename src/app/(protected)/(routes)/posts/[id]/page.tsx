import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import LikeButton from "@/app/components/LikeButton";
import BookmarkButton from "@/app/components/BookmarkButton";
import CommentForm from "@/app/components/CommentForm";
import PostComments from "@/app/components/PostComments";
import PostCarousel from "@/app/components/PostCarousel";
import PostComposer from "@/app/components/PostComposer";
import { getPostImages } from "@/post-images";
import { deletePost, editPost } from "@/actions";


export default async function SinglePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const viewerEmail = session?.user?.email ?? null;

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      likes: viewerEmail
        ? {
            where: {
              authorEmail: viewerEmail,
            },
            select: {
              id: true,
            },
          }
        : false,
      bookmarks: viewerEmail
        ? {
            where: {
              authorEmail: viewerEmail,
            },
            select: {
              id: true,
            },
          }
        : false,
    },
  });

  if (!post) {
    notFound();
  }

  // load topics for this post
  const postWithTopics = await prisma.post.findUnique({
    where: { id },
    include: { topics: { include: { topic: true } } },
  });

  const topics = postWithTopics?.topics?.map((pt) => pt.topic) ?? [];

  const tagRows = await prisma.postProfileTag.findMany({ where: { postId: id }, select: { profileId: true } });
  const taggedProfiles = tagRows.length ? await prisma.profile.findMany({ where: { id: { in: tagRows.map((tag) => tag.profileId) } }, select: { id: true, username: true, name: true, avatar: true } }) : [];

  const author = await prisma.profile.findUnique({
    where: { email: post.authorEmail },
  });

  const isLikedByViewer =
    viewerEmail && Array.isArray(post.likes) ? post.likes.length > 0 : false;

  const isBookmarkedByViewer =
    viewerEmail && Array.isArray(post.bookmarks)
      ? post.bookmarks.length > 0
      : false;

  const isOwner = viewerEmail === post.authorEmail;

  return (
    <>
      <section className="flex flex-row items-center justify-between">
        <Link
          href="/profile"
          className="group flex items-center gap-2 text-slate-900 no-underline hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
        >
          <MoveLeft className="shrink-0" />
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Back to Profile
          </span>
        </Link>
      </section>

      <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          <div className="self-start md:sticky md:top-8">
            <article className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <div className="w-full">
                <PostCarousel
                  images={getPostImages(post)}
                  alt={post.description || "Post image"}
                />
              </div>

              <div className="flex items-center justify-between px-5 pt-4">
                <LikeButton
                  postId={post.id}
                  initialLiked={!!isLikedByViewer}
                  initialLikes={post.likesCount}
                  showText
                />

                <BookmarkButton
                  postId={post.id}
                  initialBookmarked={!!isBookmarkedByViewer}
                />
              </div>

              <div className="space-y-4 p-5 md:p-6">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Post
                </h1>

                <p className="text-slate-700 dark:text-slate-200">
                  {post.description}
                </p>

                {topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topics.map((t) => (
                      <Link
                        key={t.id}
                        href={`/topics/${t.slug}`}
                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 no-underline hover:underline"
                      >
                        #{t.name}
                      </Link>
                    ))}
                  </div>
                )}

                {taggedProfiles.length > 0 && <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span>With</span>
                  {taggedProfiles.map((profile) => profile.username ? <Link key={profile.id} href={`/profile/${encodeURIComponent(profile.username)}`} className="rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-800 hover:underline dark:bg-orange-500/15 dark:text-orange-200">@{profile.username}</Link> : null)}
                </div>}

                {isOwner ? (
                  <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-900 dark:shadow-gray-950">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Manage post
                      </p>
                      <form action={deletePost} className="m-0">
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900"
                        >
                          Delete
                        </button>
                      </form>
                    </div>

                    <PostComposer key={post.updatedAt.toISOString()} action={editPost} postId={post.id} initialImages={getPostImages(post)} description={post.description} topics={topics.map((t) => t.name)} taggedProfiles={taggedProfiles}/>

                  </section>
                ) : null}
              </div>
            </article>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href={author?.username ? `/profile/${encodeURIComponent(author.username)}` : "#"}
              className="group"
            >
              <article className="flex h-28 items-center justify-between rounded-2xl bg-white px-5 shadow-md shadow-gray-200 transition hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900">
                <div className="flex items-center gap-3">
                  <div className="size-12 overflow-hidden rounded-full bg-gray-300">
                    {author?.avatar ? (
                      <Image
                        src={author.avatar}
                        alt={author.name || "author"}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {author?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      @{author?.username || "user"}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </article>
            </Link>

            <section id="comments" className="rounded-2xl bg-white p-5 shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                Comments
              </h2>

              <CommentForm postId={post.id} />

              <div className="mt-6">
                <PostComments postId={post.id} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
