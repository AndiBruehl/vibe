import Link from "next/link";
import { prisma } from "@/db";
import { getPostMediaTypes } from "@/post-images";
import PostImageCount from "./PostImageCount";
import PostThumbnail from "./PostThumbnail";
import PinnedPostsManager from "./PinnedPostsManager";

type Props = { email: string; language: "de" | "en"; canManage?: boolean };

export default async function PinnedProfilePosts({ email, language, canManage = false }: Props) {
  const de = language === "de";
  let pinnedPosts: Array<{ id: string; image: string; images: string[]; mediaTypes: string[]; description: string; createdAt: Date }> = [];
  let unavailable = false;

  try {
    const profile = await prisma.profile.findUnique({ where: { email }, select: { id: true } });
    if (!profile) return null;
    const pinRows = await prisma.profilePinnedPost.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" }, select: { postId: true } });
    const posts = pinRows.length ? await prisma.post.findMany({ where: { id: { in: pinRows.map((pin) => pin.postId) }, authorEmail: email, isArchived: false }, select: { id: true, image: true, images: true, mediaTypes: true, description: true, createdAt: true } }) : [];
    const postById = new Map(posts.map((post) => [post.id, post]));
    // Stale pin records (for example from an older deployment) are ignored safely.
    pinnedPosts = pinRows.map((pin) => postById.get(pin.postId)).filter((post): post is NonNullable<typeof post> => Boolean(post));
  } catch {
    unavailable = true;
  }

  if (!pinnedPosts.length && !canManage) return null;

  return <>
    {pinnedPosts.length > 0 && <section className="mb-5">
      <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">{de ? "Angepinnte Beiträge" : "Pinned posts"}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {pinnedPosts.map((post, index) => <article key={post.id} className={`group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900 ${index === 2 ? "col-span-2 md:col-span-1" : ""}`}>
          <div className="relative aspect-square w-full overflow-hidden"><PostImageCount images={post.images} /><PostThumbnail href={`/posts/${post.id}`} src={post.image} mediaType={getPostMediaTypes(post)[0]} alt={post.description || (de ? "Angepinnter Beitrag" : "Pinned post")} /></div>
          <Link href={`/posts/${post.id}`} className="block p-3"><p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{post.description || (de ? "Ohne Beschreibung" : "No description")}</p></Link>
        </article>)}
      </div>
    </section>}
    {canManage && <PinnedPostsManager posts={pinnedPosts.map((post) => ({ id: post.id, description: post.description, createdAt: post.createdAt }))} language={language} unavailable={unavailable} />}
  </>;
}
