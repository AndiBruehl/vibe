import { auth } from "@/auth";
import { isSuperAdmin } from "@/admin";
import { prisma } from "@/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import LikeButton from "@/app/components/LikeButton";
import BookmarkButton from "@/app/components/BookmarkButton";
import CommentForm from "@/app/components/CommentForm";
import PostComments from "@/app/components/PostComments";
import PostCarousel from "@/app/components/PostCarousel";
import PostComposer from "@/app/components/PostComposer";
import { getPostImages, getPostMediaTypes } from "@/post-images";
import { deletePost, editPost, togglePostArchive } from "@/actions";
import LocalizedText from "@/app/components/LocalizedText";
import MentionText from "@/app/components/MentionText";
import ReportButton from "@/app/components/ReportButton";
import SharePostButton from "@/app/components/SharePostButton";
import AdminBadge from "@/app/components/AdminBadge";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import ProfilePostPinButton from "@/app/components/ProfilePostPinButton";


export default async function SinglePostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ image?: string }>;
}) {
  const session = await auth();
  const viewerEmail = session?.user?.email ?? null;

  const { id } = await params;
  const { image } = await searchParams;
  const initialImage = Number.isInteger(Number(image)) ? Math.max(0, Number(image) - 1) : 0;

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
      revisions: {
        orderBy: { createdAt: "desc" },
        select: { id: true, description: true, createdAt: true },
      },
    },
  });

  if (!post) {
    notFound();
  }

  if (post.isArchived && viewerEmail !== post.authorEmail) notFound();

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
  const viewer = viewerEmail
    ? await prisma.profile.findUnique({ where: { email: viewerEmail }, select: { id: true, language: true, isAdmin: true } })
    : null;
  const de = viewer?.language === "de";
  const blockingRelation = author && viewer && author.email !== viewerEmail
    ? await prisma.block.findFirst({
        where: { OR: [{ blockerId: viewer.id, blockedId: author.id }, { blockerId: author.id, blockedId: viewer.id }] },
        select: { blockerId: true },
      })
    : null;

  if (blockingRelation) {
    const blockedByAuthor = blockingRelation.blockerId === author?.id;
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center p-4">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{blockedByAuthor ? (de ? "Dieser Nutzer hat dich blockiert" : "This user blocked you") : (de ? "Du hast diesen Nutzer blockiert" : "You blocked this user")}</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{de ? "Hier gibt es nichts zu sehen." : "There is nothing to see here."}</p>
          <Link href="/home" className="mt-5 inline-flex rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2.5 text-sm font-semibold text-white">{de ? "ZUR STARTSEITE" : "BACK TO HOME"}</Link>
        </section>
      </main>
    );
  }

  if (author?.isPrivate && viewerEmail !== author.email) {
    const canView = viewer ? await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewer.id, followingId: author.id } }, select: { id: true } }) : null;
    if (!canView) {
      return (
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center p-4">
          <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{de ? "Dieser Beitrag ist privat" : "This post is private"}</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{de ? "Folge dem Profil, um diesen Beitrag zu sehen." : "Follow this profile to view this post."}</p>
            {author.username && <Link href={`/profile/${encodeURIComponent(author.username)}`} className="mt-5 inline-flex rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2.5 text-sm font-semibold text-white">{de ? "ZUM PROFIL" : "VIEW PROFILE"}</Link>}
          </section>
        </main>
      );
    }
  }

  const isLikedByViewer =
    viewerEmail && Array.isArray(post.likes) ? post.likes.length > 0 : false;

  const isBookmarkedByViewer =
    viewerEmail && Array.isArray(post.bookmarks)
      ? post.bookmarks.length > 0
      : false;

  const isOwner = viewerEmail === post.authorEmail;
  const isAdmin = viewer?.isAdmin === true && isSuperAdmin(viewerEmail);
  const existingPin = isOwner && viewer
    ? await prisma.profilePinnedPost.findUnique({ where: { profileId_postId: { profileId: viewer.id, postId: post.id } }, select: { id: true } })
    : null;

  return (
    <>
      <section className="flex flex-row items-center justify-between">
        <Link
          href="/profile"
          className="group flex items-center gap-2 text-slate-900 no-underline hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
        >
          <MoveLeft className="shrink-0" />
          <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <LocalizedText en="Back to Profile" de="Zurück zum Profil" />
          </span>
        </Link>
      </section>

      <main className="mx-auto w-full max-w-6xl p-3 sm:p-5 xl:p-8">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] xl:items-start xl:gap-6">
          <div className="self-start xl:sticky xl:top-8">
            <article className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <div className="w-full">
                <PostCarousel
                  images={getPostImages(post)}
                  mediaTypes={getPostMediaTypes(post)}
                  videoPosters={post.videoPosters}
                  alt={post.description || "Post image"}
                  initialIndex={initialImage}
                  postId={post.id}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5">
                <LikeButton
                  postId={post.id}
                  initialLiked={!!isLikedByViewer}
                  initialLikes={post.likesCount}
                  showText
                />

                <SharePostButton postId={post.id} de={de} />

                {isOwner && <ProfilePostPinButton postId={post.id} initialPinned={Boolean(existingPin)} language={de ? "de" : "en"} />}

                <BookmarkButton
                  postId={post.id}
                  initialBookmarked={!!isBookmarkedByViewer}
                />
              </div>
              {!isOwner && <div className="flex justify-end px-4 pt-2 sm:px-5"><ReportButton targetType="post" targetId={post.id} targetUrl={`/posts/${post.id}`} /></div>}

              {post.likesCount > 0 && <div className="px-4 pt-2 sm:px-5">
                <Link href={`/posts/${post.id}/likes`} className="text-sm font-medium text-slate-600 hover:text-orange-600 hover:underline dark:text-slate-300 dark:hover:text-orange-300">
                  {post.likesCount} <LocalizedText en={post.likesCount === 1 ? "like" : "likes"} de="Likes" />
                </Link>
              </div>}

              <div className="space-y-4 p-4 sm:p-5 md:p-6">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  <LocalizedText en="Post" de="Beitrag" />
                </h1>

                <p className="text-slate-700 dark:text-slate-200">
                  <MentionText text={post.description} />
                </p>
                {post.editedAt ? <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>{de ? "Bearbeitet" : "Edited"}</span>
                  {post.revisions.length ? <details className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                    <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">{de ? `Bearbeitungsverlauf (${post.revisions.length})` : `Edit history (${post.revisions.length})`}</summary>
                    <ol className="mt-3 space-y-3 border-l border-slate-200 pl-3 dark:border-slate-700">
                      {post.revisions.map((revision) => <li key={revision.id}><time dateTime={revision.createdAt.toISOString()} className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">{revision.createdAt.toLocaleString(de ? "de-DE" : "en-US")}</time><p className="mt-1 whitespace-pre-wrap text-sm font-normal text-slate-700 dark:text-slate-200"><MentionText text={revision.description} /></p></li>)}
                    </ol>
                  </details> : null}
                </div> : null}

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
                  <span><LocalizedText en="With" de="Mit" /></span>
                  {taggedProfiles.map((profile) => profile.username ? <Link key={profile.id} href={`/profile/${encodeURIComponent(profile.username)}`} className="rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-800 hover:underline dark:bg-orange-500/15 dark:text-orange-200">@{profile.username}</Link> : null)}
                </div>}

                {isOwner ? (
                  <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-900 dark:shadow-gray-950">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Manage post
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <SharePostButton postId={post.id} de={de} />
                        <form action={deletePost} className="m-0">
                          <input type="hidden" name="postId" value={post.id} />
                          <button
                          type="submit"
                          className="rounded-full border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900"
                        >
                          <LocalizedText en="Delete" de="Löschen" />
                          </button>
                        </form>
                      </div>
                    </div>
                    <form action={togglePostArchive} className="mb-4">
                      <input type="hidden" name="postId" value={post.id} />
                      <input type="hidden" name="archive" value={post.isArchived ? "false" : "true"} />
                      <button type="submit" className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                        <LocalizedText en={post.isArchived ? "Restore from archive" : "Archive post"} de={post.isArchived ? "Aus Archiv wiederherstellen" : "Beitrag archivieren"} />
                      </button>
                    </form>

                    <PostComposer key={post.updatedAt.toISOString()} action={editPost} postId={post.id} initialImages={getPostImages(post)} initialMediaTypes={getPostMediaTypes(post)} initialVideoPosters={post.videoPosters} description={post.description} topics={topics.map((t) => t.name)} taggedProfiles={taggedProfiles}/>

                  </section>
                ) : isAdmin ? (
                  <section className="rounded-2xl border border-red-300/60 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-200"><LocalizedText en="Admin moderation" de="Admin-Moderation" /></p>
                    <form action={deletePost} className="mt-3">
                      <input type="hidden" name="postId" value={post.id} />
                      <button type="submit" className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white"><LocalizedText en="Delete post and images" de="Beitrag und Bilder löschen" /></button>
                    </form>
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
              <article className="flex min-h-28 flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4 shadow-md shadow-gray-200 transition hover:shadow-lg sm:px-5 dark:bg-gray-800 dark:shadow-gray-900">
                <div className="flex items-center gap-3">
                  <ProfileAvatar {...author} alt={author?.name || "author"} sizeClass="size-12" />

                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      <span className="inline-flex items-center gap-2">{author?.name || "Unknown"}<AdminBadge isAdmin={author?.isAdmin} isVerified={author?.isVerified} badges={author?.profileBadges} hiddenBadges={author?.hiddenProfileBadges} /></span>
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
                <LocalizedText en="Comments" de="Kommentare" />
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


