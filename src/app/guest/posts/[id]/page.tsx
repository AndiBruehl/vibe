import { prisma } from "@/db";
import { guestPostSelect, publicPostWhere } from "@/guest-content";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GuestUnavailable } from "@/app/components/GuestPosts";
import PostCarousel from "@/app/components/PostCarousel";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import { getPostImages, getPostMediaTypes } from "@/post-images";

export default async function GuestPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  let post;
  try { post = await prisma.post.findFirst({ where: { id, ...publicPostWhere }, select: guestPostSelect }); } catch { return <GuestUnavailable/>; }
  if (!post) notFound();
  return <article className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-400/20 bg-white dark:bg-slate-900">
    {post.author?.username && <Link href={`/profile/${encodeURIComponent(post.author.username)}`} className="flex items-center gap-3 p-4"><ProfileAvatar {...post.author} sizeClass="size-12"/><span className="font-bold">{post.author.name || post.author.username}</span></Link>}
    <PostCarousel images={getPostImages(post)} mediaTypes={getPostMediaTypes(post)} videoPosters={post.videoPosters} alt={post.description || "VIBE"}/>
    <p className="whitespace-pre-wrap break-words p-4">{post.description}</p>
  </article>;
}
