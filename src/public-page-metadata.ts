import type { Metadata } from "next";
import { prisma } from "@/db";
import { publicPostWhere, publicProfileWhere } from "@/guest-content";
import { absolutePublicUrl, plainTextSummary, publicImageUrl } from "@/public-metadata";

export async function publicProfileMetadata(username: string): Promise<Metadata> {
  if (!username) return { title: "Profile · VIBE" };
  const profile = await prisma.profile.findFirst({
    where: { username, ...publicProfileWhere },
    select: { name: true, username: true, subtitle: true, bio: true, avatar: true },
  }).catch(() => null);
  if (!profile) return { title: "Profile · VIBE", robots: { index: false, follow: false } };
  const displayName = profile.name || profile.username || "VIBE profile";
  const path = `/profile/${encodeURIComponent(profile.username || username)}`;
  const description = plainTextSummary(profile.subtitle || profile.bio, `View ${displayName} on VIBE.`);
  const image = publicImageUrl(profile.avatar);
  return {
    title: `${displayName} (@${profile.username}) · VIBE`,
    description,
    alternates: { canonical: absolutePublicUrl(path) },
    openGraph: { title: `${displayName} on VIBE`, description, url: absolutePublicUrl(path), siteName: "VIBE", images: [{ url: image }], type: "profile" },
    twitter: { card: "summary", title: `${displayName} on VIBE`, description, images: [image] },
  };
}

export async function publicPostMetadata(id: string): Promise<Metadata> {
  if (!/^[a-f\d]{24}$/i.test(id)) return { title: "Post · VIBE", robots: { index: false, follow: false } };
  const post = await prisma.post.findFirst({
    where: { id, ...publicPostWhere },
    select: { id: true, description: true, image: true, images: true, author: { select: { username: true, name: true } } },
  }).catch(() => null);
  if (!post) return { title: "Post · VIBE", robots: { index: false, follow: false } };
  const authorName = post.author?.name || post.author?.username || "VIBE";
  const title = `${authorName} on VIBE`;
  const description = plainTextSummary(post.description, "View this public post on VIBE.");
  const path = `/posts/${post.id}`;
  const image = publicImageUrl(post.images?.[0] || post.image);
  return {
    title: `${title} · Post`,
    description,
    alternates: { canonical: absolutePublicUrl(path) },
    openGraph: { title, description, url: absolutePublicUrl(path), siteName: "VIBE", images: [{ url: image }], type: "article" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
