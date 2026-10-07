import Link from "next/link";
import { CalendarDays, Heart, MapPin } from "lucide-react";
import { getGuestPosts } from "@/guest-content";
import { getPostImages, getPostMediaTypes } from "@/post-images";
import AdminBadge from "./AdminBadge";
import PostThumbnail from "./PostThumbnail";
import ProfileAvatar from "./ProfileAvatar";
import LocalizedText from "./LocalizedText";
import MentionText from "./MentionText";

export function GuestUnavailable() {
  return <div role="status" className="rounded-2xl border border-slate-400/30 p-6"><LocalizedText en="Public content is temporarily unavailable. Please try again shortly." de="Öffentliche Inhalte sind gerade nicht erreichbar. Bitte versuche es gleich erneut."/><Link href="/home" className="mt-4 block font-bold text-orange-500"><LocalizedText en="Back to public posts" de="Zurück zu öffentlichen Beiträgen"/></Link></div>;
}

function formatPublicDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function GuestPosts({ username, page = 1 }: { username?: string; page?: number }) {
  let posts;
  try { posts = await getGuestPosts(username, page); } catch { return <GuestUnavailable/>; }
  const base = username ? `/profile/${encodeURIComponent(username)}` : "/home";
  return <>
    {!posts.length && <p className="rounded-2xl border border-slate-400/20 p-8 text-center text-sm text-slate-600 dark:text-slate-300"><LocalizedText en="No public posts here yet." de="Hier gibt es noch keine öffentlichen Beiträge."/></p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => {
      const images = getPostImages(post).filter(Boolean);
      const mediaTypes = getPostMediaTypes(post);
      const primaryImage = images[0];
      const locationText = post.locationLabel || (post.locationLatitude !== null ? "Shared location" : "");
      return <article key={post.id} className="group overflow-hidden rounded-2xl border border-slate-400/20 bg-white shadow-sm transition hover:border-orange-300/60 hover:shadow-md dark:bg-slate-900 dark:hover:border-orange-500/40">
        {post.author?.username && <Link href={`/profile/${encodeURIComponent(post.author.username)}`} className="flex items-center gap-3 p-3 transition hover:bg-slate-50 dark:hover:bg-white/5"><ProfileAvatar {...post.author} sizeClass="size-10"/><span className="min-w-0"><span className="flex flex-wrap items-center gap-1.5 break-words font-bold">{post.author.name || post.author.username}<AdminBadge isAdmin={post.author.isAdmin} isVerified={post.author.isVerified} badges={post.author.profileBadges} hiddenBadges={post.author.hiddenProfileBadges}/></span><span className="block truncate text-xs text-slate-500 dark:text-slate-400">@{post.author.username}</span></span></Link>}
        {primaryImage ? <PostThumbnail href={`/posts/${post.id}`} src={primaryImage} mediaType={mediaTypes[0]} poster={post.videoPosters[0]} alt={post.description || "VIBE"} className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950"/> : <Link href={`/posts/${post.id}`} className="grid aspect-square place-items-center bg-linear-to-br from-orange-500/15 via-pink-500/10 to-cyan-500/15 p-6 text-center text-sm font-semibold text-slate-700 transition group-hover:scale-[1.01] dark:text-slate-200"><LocalizedText en="Open text post" de="Textbeitrag öffnen"/></Link>}
        <div className="space-y-3 p-3">
          <div className="flex flex-wrap gap-2 text-[0.72rem] font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10"><CalendarDays size={12}/>{formatPublicDate(post.createdAt)}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"><Heart size={12}/>{post.likesCount}</span>
          </div>
          {post.description ? <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm"><MentionText text={post.description}/></p> : <p className="text-sm text-slate-500 dark:text-slate-400"><LocalizedText en="This public post has no text." de="Dieser öffentliche Beitrag hat keinen Text."/></p>}
          {locationText ? <Link href={`/posts/${post.id}/map`} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-cyan-300/60 px-2.5 py-1 text-xs font-bold text-cyan-700 transition hover:bg-cyan-500/10 dark:border-cyan-500/40 dark:text-cyan-200"><MapPin size={12} className="shrink-0"/><span className="truncate">{locationText}</span></Link> : null}
        </div>
      </article>;
    })}</div>
    <div className="mt-5 flex justify-between gap-4">{page > 1 && <Link href={`${base}?page=${page - 1}`}><LocalizedText en="Previous" de="Zurück"/></Link>}{posts.length === 24 && page < 1000 && <Link href={`${base}?page=${page + 1}`}><LocalizedText en="Next" de="Weiter"/></Link>}</div>
  </>;
}
