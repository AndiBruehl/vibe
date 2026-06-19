import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DesktopNav from "@/app/components/DesktopNav";
import MobileNav from "@/app/components/MobileNav";

// TopicFollowButton temporarily disabled
// import TopicFollowButton from "@/app/components/TopicFollowButton";
import LocalTime from "@/app/components/LocalTime";
import { prisma } from "@/db";
import { auth } from "@/auth";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;

  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      followers: { select: { id: true, profileId: true } },
    },
  });

  if (!topic) return notFound();

  const session = await auth();
  const userEmail = session?.user?.email;
  let initiallyFollowing = false;

  if (userEmail) {
    const profile = await prisma.profile.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (profile) {
      const exists = await prisma.topicFollow.findFirst({
        where: { profileId: profile.id, topicId: topic.id },
      });
      initiallyFollowing = Boolean(exists);
    }
  }

  const posts = await prisma.post.findMany({
    where: { topics: { some: { topic: { slug } } } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      description: true,
      image: true,
      createdAt: true,
      likesCount: true,
      author: {
        select: { id: true, username: true, name: true, avatar: true },
      },
    },
  });

  return (
    <>
      <DesktopNav />
      <MobileNav />

      <div className="md:pl-48">
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">#{topic.name}</h1>
              {topic.description ? (
                <p className="text-sm text-slate-500">{topic.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400">
                {topic.followers.length} followers
              </p>
            </div>
            <div>{/* TopicFollowButton disabled temporarily */}</div>
          </div>

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="rounded-md border p-6 text-center text-slate-500">
                No posts for this topic yet.
              </div>
            ) : (
              posts.map((p) => (
                <article key={p.id} className="rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                      {p.author.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.author.avatar}
                          alt={p.author.name || p.author.username || "avatar"}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            href={`/profile/${p.author.username}`}
                            className="font-semibold text-slate-900 no-underline hover:underline"
                          >
                            {p.author.name || p.author.username}
                          </Link>
                          <div className="text-xs text-slate-400">
                            <LocalTime
                              iso={p.createdAt}
                              options={{
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {p.likesCount} ❤
                        </div>
                      </div>

                      <div className="mt-3">
                        <Link
                          href={`/posts/${p.id}`}
                          className="no-underline hover:underline"
                        >
                          <p className="text-slate-800">{p.description}</p>
                          {p.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image}
                              alt="post"
                              className="mt-3 max-h-64 w-full object-contain"
                            />
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}
