import { auth } from "@/auth";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { notFound } from "next/navigation";

type LikerProfile = { email: string; username: string | null; name: string | null; avatar: string | null };

export default async function PostLikesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) notFound();

  const { id } = await params;
  const [post, viewer] = await Promise.all([
    prisma.post.findUnique({ where: { id }, select: { id: true, authorEmail: true, likesCount: true } }),
    prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true, language: true } }),
  ]);
  if (!post || !viewer) notFound();

  const author = await prisma.profile.findUnique({ where: { email: post.authorEmail }, select: { id: true, isPrivate: true } });
  if (author?.isPrivate && post.authorEmail !== session.user.email) {
    const followsAuthor = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewer.id, followingId: author.id } },
      select: { id: true },
    });
    if (!followsAuthor) notFound();
  }

  const likes = await prisma.postLike.findMany({
    where: { postId: id },
    select: { authorEmail: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const profiles: LikerProfile[] = likes.length
    ? await prisma.profile.findMany({
        where: { email: { in: likes.map((like) => like.authorEmail) } },
        select: { email: true, username: true, name: true, avatar: true },
      })
    : [];
  const profilesByEmail = new Map<string, LikerProfile>(profiles.map((profile) => [profile.email, profile]));
  const de = viewer.language === "de";

  return (
    <main className="mx-auto w-full max-w-2xl pb-24 md:pb-8">
      <BackNavigationLink language={de ? "de" : "en"} />
      <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200 dark:bg-slate-800 dark:shadow-slate-950">
        <header className="border-b border-slate-200 px-5 py-5 dark:border-white/10 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-rose-500/10 text-rose-500"><Heart className="size-5 fill-current" /></span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{de ? "Gefällt mir" : "Likes"}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{post.likesCount} {de ? "Personen gefällt dieser Beitrag" : "people liked this post"}</p>
            </div>
          </div>
        </header>
        {likes.length ? <ul className="divide-y divide-slate-100 dark:divide-white/10">
          {likes.flatMap((like) => {
            const profile = profilesByEmail.get(like.authorEmail);
            if (!profile?.username) return [];
            return [<li key={like.authorEmail}>
              <Link href={`/profile/${encodeURIComponent(profile.username)}`} className="flex items-center gap-3 px-5 py-4 no-underline transition hover:bg-slate-50 dark:hover:bg-white/5 sm:px-6">
                <div className="size-11 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  {profile.avatar ? <Image src={profile.avatar} alt="" width={44} height={44} className="h-full w-full object-cover" unoptimized /> : null}
                </div>
                <div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{profile.name || profile.username}</p><p className="truncate text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p></div>
              </Link>
            </li>];
          })}
        </ul> : <p className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">{de ? "Dieser Beitrag hat noch keine Likes." : "This post has no likes yet."}</p>}
      </section>
    </main>
  );
}
