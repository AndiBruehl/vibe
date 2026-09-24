import Link from "next/link";
import { prisma } from "@/db";
import { getPostMediaTypes } from "@/post-images";
import PostImageCount from "./PostImageCount";
import PostThumbnail from "./PostThumbnail";
import ProfilePinOrderButtons from "./ProfilePinOrderButtons";

type Props = { email: string; language: "de" | "en"; canManage?: boolean };

export default async function PinnedProfilePosts({ email, language, canManage = false }: Props) {
  const de = language === "de";
  let pinnedPosts: Array<{ id: string; image: string; images: string[]; mediaTypes: string[]; videoPosters: string[]; description: string; createdAt: Date; position: number }> = [];

  try {
    const profile = await prisma.profile.findUnique({ where: { email }, select: { id: true } });
    if (!profile) return null;
    const pinRows = await prisma.profilePinnedPost.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" }, select: { postId: true, position: true } });
    const posts = pinRows.length ? await prisma.post.findMany({ where: { id: { in: pinRows.map((pin) => pin.postId) }, authorEmail: email, isArchived: false }, select: { id: true, image: true, images: true, mediaTypes: true, videoPosters: true, description: true, createdAt: true } }) : [];
    const postById = new Map(posts.map((post) => [post.id, post]));
    // Stale pin records (for example from an older deployment) are ignored safely.
    pinnedPosts = pinRows.flatMap((pin) => {
      const post = postById.get(pin.postId);
      return post ? [{ ...post, position: pin.position }] : [];
    });
  } catch { /* Keep the normal profile feed available if pinned-post data is unavailable. */ }

  if (!pinnedPosts.length && !canManage) return null;

  return <>
    {pinnedPosts.length > 0 && <section className="mb-5">
      <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">{de ? "Angepinnte Beiträge" : "Pinned posts"}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {pinnedPosts.map((post, index) => <article key={post.id} className={`group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900 ${index === 2 ? "col-span-2 md:col-span-1" : ""}`}>
          <div className="relative aspect-square w-full overflow-hidden"><PostImageCount images={post.images} /><PostThumbnail href={`/posts/${post.id}`} src={post.image} mediaType={getPostMediaTypes(post)[0]} poster={post.videoPosters?.[0]} alt={post.description || (de ? "Angepinnter Beitrag" : "Pinned post")} />{canManage && <ProfilePinOrderButtons postId={post.id} position={post.position} total={pinnedPosts.length} language={language} />}</div>
          <Link href={`/posts/${post.id}`} className="block p-3"><p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{post.description || (de ? "Ohne Beschreibung" : "No description")}</p></Link>
        </article>)}
      </div>
    </section>}
  </>;
}
