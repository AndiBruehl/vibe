import type { Metadata } from "next";
import { prisma } from "@/db";
import { guestPostSelect, publicPostWhere } from "@/guest-content";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText, Heart, MapPin } from "lucide-react";
import { GuestUnavailable } from "@/app/components/GuestPosts";
import PostCarousel from "@/app/components/PostCarousel";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import AdminBadge from "@/app/components/AdminBadge";
import MentionText from "@/app/components/MentionText";
import LocalizedText from "@/app/components/LocalizedText";
import { getPostImages, getPostMediaTypes } from "@/post-images";
import { publicPostMetadata } from "@/public-page-metadata";
import GuestJoinPrompt from "@/app/components/GuestJoinPrompt";
import GuestPostComments from "@/app/components/GuestPostComments";

type GuestPostProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: GuestPostProps): Promise<Metadata> {
  const { id } = await params;
  return publicPostMetadata(id);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function GuestPost({ params }: GuestPostProps) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  let post;
  try { post = await prisma.post.findFirst({ where: { id, ...publicPostWhere }, select: guestPostSelect }); } catch { return <GuestUnavailable/>; }
  if (!post) notFound();

  const images = getPostImages(post).filter(Boolean);
  const hasMedia = images.length > 0;
  const hasLocation = Boolean(post.locationLabel || post.locationLatitude !== null);

  return <main className="mx-auto w-full max-w-5xl p-3 sm:p-5 xl:p-8">
    <Link href="/home" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-orange-400/40 px-3 text-sm font-bold text-orange-600 transition hover:bg-orange-500/10 dark:text-orange-200"><ArrowLeft size={16}/><LocalizedText en="Back to public posts" de="Zurück zu öffentlichen Beiträgen"/></Link>
    <article className="overflow-hidden rounded-3xl border border-slate-400/20 bg-white shadow-xl shadow-slate-200/60 dark:bg-slate-900 dark:shadow-slate-950/40">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.68fr)]">
        <section className="min-w-0 bg-slate-950/5 dark:bg-slate-950">
          {hasMedia ? <PostCarousel images={images} mediaTypes={getPostMediaTypes(post)} videoPosters={post.videoPosters} alt={post.description || "VIBE post"}/> : <div className="grid min-h-80 place-items-center bg-linear-to-br from-orange-500/15 via-pink-500/10 to-cyan-500/15 p-8 text-center text-sm text-slate-600 dark:text-slate-200"><div className="max-w-sm"><FileText className="mx-auto mb-3 text-orange-500" size={34}/><p className="font-bold"><LocalizedText en="Text-only public post" de="Öffentlicher Textbeitrag"/></p><p className="mt-2 opacity-80"><LocalizedText en="This post has no public media attached." de="Dieser Beitrag hat keine öffentlichen Medien."/></p></div></div>}
        </section>
        <aside className="flex min-w-0 flex-col">
          {post.author?.username ? <Link href={`/profile/${encodeURIComponent(post.author.username)}`} className="flex items-center gap-3 border-b border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"><ProfileAvatar {...post.author} sizeClass="size-12"/><span className="min-w-0"><span className="flex flex-wrap items-center gap-1.5 font-bold text-slate-900 dark:text-white">{post.author.name || post.author.username}<AdminBadge isAdmin={post.author.isAdmin} isVerified={post.author.isVerified} badges={post.author.profileBadges} hiddenBadges={post.author.hiddenProfileBadges}/></span><span className="block truncate text-sm text-slate-500 dark:text-slate-400">@{post.author.username}</span></span></Link> : <div className="border-b border-slate-200 p-4 font-bold dark:border-slate-700"><LocalizedText en="Public post" de="Öffentlicher Beitrag"/></div>}
          <div className="flex-1 space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><CalendarDays size={13}/>{formatDate(post.createdAt)}</span><span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"><Heart size={13}/>{post.likesCount}</span></div>
            {post.description ? <p className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100"><MentionText text={post.description}/></p> : <p className="text-sm text-slate-500 dark:text-slate-400"><LocalizedText en="This public post has no text." de="Dieser öffentliche Beitrag hat keinen Text."/></p>}
            {hasLocation ? <Link href={`/posts/${post.id}/map`} className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-sm font-bold text-cyan-900 transition hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-100 dark:hover:bg-cyan-500/20"><MapPin size={15} className="shrink-0"/><span className="truncate">{post.locationLabel || "Shared location"}</span></Link> : null}
            <GuestJoinPrompt />
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700"><GuestPostComments postId={post.id}/></div>
          </div>
        </aside>
      </div>
    </article>
  </main>;
}
