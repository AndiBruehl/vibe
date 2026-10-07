import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getGuestComments } from "@/guest-comments";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import AdminBadge from "@/app/components/AdminBadge";
import MentionText from "@/app/components/MentionText";
import LocalizedText from "@/app/components/LocalizedText";

type PublicComment = {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    username: string | null;
    name: string | null;
    avatar: string | null;
    avatarAccent: string | null;
    avatarAccentEnd: string | null;
    avatarAccentDirection: string | null;
    isAdmin: boolean;
    isVerified: boolean;
    profileBadges: string[];
    hiddenProfileBadges: string[];
  };
  replies: PublicComment[];
};

function GuestComment({ comment, isReply = false }: { comment: PublicComment; isReply?: boolean }) {
  const profileHref = comment.author.username ? `/profile/${encodeURIComponent(comment.author.username)}` : null;
  return <article id={`comment-${comment.id}`} className={`${isReply ? "ml-8 border-l border-orange-300/30 pl-4" : ""} rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40`}>
    <div className="flex items-start gap-3">
      {profileHref ? <Link href={profileHref} className="shrink-0 transition hover:opacity-85"><ProfileAvatar {...comment.author} sizeClass="size-10"/></Link> : <ProfileAvatar {...comment.author} sizeClass="size-10"/>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {profileHref ? <Link href={profileHref} className="font-bold text-slate-900 hover:underline dark:text-white"><span className="inline-flex items-center gap-1.5">{comment.author.name || comment.author.username || "Unknown"}<AdminBadge isAdmin={comment.author.isAdmin} isVerified={comment.author.isVerified} badges={comment.author.profileBadges} hiddenBadges={comment.author.hiddenProfileBadges}/></span></Link> : <span className="font-bold text-slate-900 dark:text-white">{comment.author.name || "Unknown"}</span>}
          {comment.author.username ? <span className="text-sm text-slate-500 dark:text-slate-400">@{comment.author.username}</span> : null}
          <time dateTime={comment.createdAt.toISOString()} className="text-xs text-slate-400 dark:text-slate-500">{comment.createdAt.toLocaleDateString("en")}</time>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200"><MentionText text={comment.text}/></p>
      </div>
    </div>
    {!isReply && comment.replies.length > 0 ? <div className="mt-3 space-y-3">{comment.replies.map((reply) => <GuestComment key={reply.id} comment={reply} isReply />)}</div> : null}
  </article>;
}

export default async function GuestPostComments({ postId }: { postId: string }) {
  let comments: PublicComment[];
  try {
    comments = await getGuestComments(postId);
  } catch {
    return <section className="rounded-2xl border border-slate-300/50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"><p className="font-bold"><LocalizedText en="Comments are temporarily unavailable." de="Kommentare sind gerade nicht erreichbar."/></p><p className="mt-1"><LocalizedText en="The public post is still available. Please try comments again shortly." de="Der öffentliche Beitrag ist weiterhin verfügbar. Bitte versuche die Kommentare gleich erneut."/></p></section>;
  }
  return <section className="rounded-2xl border border-slate-300/50 p-4 dark:border-slate-700">
    <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white"><MessageCircle size={17}/><LocalizedText en="Comments" de="Kommentare"/></h2>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400"><LocalizedText en="Read-only for guests. Sign in to reply or react." de="Für Gäste schreibgeschützt. Melde dich an, um zu antworten oder zu reagieren."/></p>
    <div className="mt-4 space-y-3">{comments.length ? comments.map((comment) => <GuestComment key={comment.id} comment={comment}/>) : <p className="text-sm text-slate-500 dark:text-slate-400"><LocalizedText en="No comments yet." de="Noch keine Kommentare."/></p>}</div>
  </section>;
}
