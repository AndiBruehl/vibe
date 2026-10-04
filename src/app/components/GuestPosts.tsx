import Link from "next/link";
import { getGuestPosts } from "@/guest-content";
import PostThumbnail from "./PostThumbnail";
import ProfileAvatar from "./ProfileAvatar";
import LocalizedText from "./LocalizedText";
import { getPostMediaTypes } from "@/post-images";

export function GuestUnavailable() {
  return <div role="status" className="rounded-2xl border border-slate-400/30 p-6"><LocalizedText en="Public content is temporarily unavailable. Please try again shortly." de="Öffentliche Inhalte sind gerade nicht erreichbar. Bitte versuche es gleich erneut."/><Link href="/home" className="mt-4 block font-bold text-orange-500"><LocalizedText en="Back to public posts" de="Zurück zu öffentlichen Beiträgen"/></Link></div>;
}

export default async function GuestPosts({ username, page = 1 }: { username?: string; page?: number }) {
  let posts;
  try { posts = await getGuestPosts(username, page); } catch { return <GuestUnavailable/>; }
  const base = username ? `/profile/${encodeURIComponent(username)}` : "/home";
  return <>
    {!posts.length && <p className="py-8"><LocalizedText en="No public posts here yet." de="Hier gibt es noch keine öffentlichen Beiträge."/></p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <article key={post.id} className="overflow-hidden rounded-2xl border border-slate-400/20 bg-white dark:bg-slate-900">
      {post.author?.username && <Link href={`/profile/${encodeURIComponent(post.author.username)}`} className="flex items-center gap-3 p-3"><ProfileAvatar {...post.author} sizeClass="size-10"/><span className="min-w-0 break-words font-bold">{post.author.name || post.author.username}</span></Link>}
      <PostThumbnail href={`/posts/${post.id}`} src={post.images[0] || post.image} mediaType={getPostMediaTypes(post)[0]} poster={post.videoPosters[0]} alt={post.description || "VIBE"} className="aspect-square overflow-hidden"/>
      <p className="line-clamp-3 whitespace-pre-wrap break-words p-3 text-sm">{post.description}</p>
    </article>)}</div>
    <div className="mt-5 flex justify-between gap-4">{page > 1 && <Link href={`${base}?page=${page - 1}`}><LocalizedText en="Previous" de="Zurück"/></Link>}{posts.length === 24 && page < 1000 && <Link href={`${base}?page=${page + 1}`}><LocalizedText en="Next" de="Weiter"/></Link>}</div>
  </>;
}
