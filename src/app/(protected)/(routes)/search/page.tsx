import PostImageCount from "@/app/components/PostImageCount";
import SortablePosts from "@/app/components/SortablePosts";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import SearchInput, { searchScopes, type SearchScope } from "./SearchInput";
import img1 from "../profile/default.jpg";
import LocalizedText from "@/app/components/LocalizedText";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    scope?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, scope: requestedScope } = await searchParams;
  const query = q?.trim() || "";
  const scope: SearchScope = searchScopes.includes(requestedScope as SearchScope)
    ? (requestedScope as SearchScope)
    : "all";
  const topicQuery = query.replace(/^#/, "");
  const includesProfiles = scope === "all" || scope === "profiles" || scope === "admins";
  const includesPosts = scope === "all" || scope === "posts";
  const includesTags = scope === "all" || scope === "tags";

  const [users, posts, topics] = query
    ? await Promise.all([
        includesProfiles ? prisma.profile.findMany({
          where: {
            ...(scope === "admins" ? { isAdmin: true } : {}),
            OR: [
              {
                username: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                subtitle: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                bio: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          },
          orderBy: {
            username: "asc",
          },
          take: 20,
        }) : Promise.resolve([]),

        includesPosts ? prisma.post.findMany({
          where: {
            isArchived: false,
            OR: [
              { description: { contains: query, mode: "insensitive" } },
              { topics: { some: { topic: { name: { contains: topicQuery, mode: "insensitive" } } } } },
            ],
          },
          include: {
            author: {
              select: {
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 48,
        }) : Promise.resolve([]),
        includesTags ? prisma.topic.findMany({
          where: {
            OR: [
              { name: { contains: topicQuery, mode: "insensitive" } },
              { slug: { contains: topicQuery, mode: "insensitive" } },
              { description: { contains: topicQuery, mode: "insensitive" } },
            ],
          },
          include: { _count: { select: { posts: true } } },
          orderBy: { name: "asc" },
          take: 20,
        }) : Promise.resolve([]),
      ])
    : [[], [], []];

  const hasResults = users.length > 0 || posts.length > 0 || topics.length > 0;

  return (
    <main className="pb-24 md:pb-8">
      <section className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="justify-self-start">
          <Link
            href="/home"
            className="group inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-slate-800 no-underline transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <MoveLeft />
            <span className="hidden opacity-0 transition-opacity duration-200 sm:inline group-hover:opacity-100">
              <LocalizedText en="Back to Home" de="Zurück zur Startseite" />
            </span>
          </Link>
        </div>
        <h1 className="justify-self-center text-lg font-bold text-slate-800 dark:text-slate-100">
          <LocalizedText en="Search" de="Suche" />
        </h1>
        <div className="justify-self-end" />
      </section>

      <section className="mt-6">
        <SearchInput initialQuery={query} initialScope={scope} />
      </section>

      {!query ? (
        <section className="mt-6 rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
          <p className="text-slate-700 dark:text-slate-300">
            <LocalizedText en="Search profiles, posts, tags, or admins." de="Suche nach Profilen, Beiträgen, Tags oder Admins." />
          </p>
        </section>
      ) : null}

      {query ? (
        <>
          {includesProfiles ? <section className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-500">
                <LocalizedText en="Users" de="Nutzer" />
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {users.length} <LocalizedText en={users.length === 1 ? "result" : "results"} de={users.length === 1 ? "Ergebnis" : "Ergebnisse"} />
              </span>
            </div>

            {users.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
                <p className="text-slate-700 dark:text-slate-300">
                  <LocalizedText en="No users found." de="Keine Nutzer gefunden." />
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    href={
                      user.username ? `/profile/${encodeURIComponent(user.username)}` : "/profile"
                    }
                    className="group block"
                  >
                    <article className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-md shadow-gray-200 transition hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-slate-300 dark:bg-slate-700">
                          <Image
                            src={user.avatar || img1.src}
                            alt={user.name || user.username || "User avatar"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800 transition group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300">
                            {user.name || "Unknown"}
                          </p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                            @{user.username || "user"}
                          </p>
                          {user.subtitle ? (
                            <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                              {user.subtitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section> : null}

          {includesTags ? <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100"><LocalizedText en="Tags" de="Tags" /></h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">{topics.length} <LocalizedText en={topics.length === 1 ? "result" : "results"} de={topics.length === 1 ? "Ergebnis" : "Ergebnisse"} /></span>
            </div>
            {topics.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900"><p className="text-slate-700 dark:text-slate-300"><LocalizedText en="No tags found." de="Keine Tags gefunden." /></p></div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {topics.map((topic) => <Link key={topic.id} href={`/topics/${topic.slug}`} className="rounded-xl bg-white px-4 py-3 font-semibold text-slate-800 shadow-md shadow-gray-200 transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-800 dark:text-slate-100 dark:shadow-gray-900">#{topic.name}<span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">{topic._count.posts} <LocalizedText en="posts" de="Beiträge" /></span></Link>)}
              </div>
            )}
          </section> : null}

          {includesPosts ? <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-500">
                <LocalizedText en="Posts" de="Beiträge" />
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {posts.length} <LocalizedText en={posts.length === 1 ? "result" : "results"} de={posts.length === 1 ? "Ergebnis" : "Ergebnisse"} />
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
                <p className="text-slate-700 dark:text-slate-300">
                  <LocalizedText en="No posts found." de="Keine Beiträge gefunden." />
                </p>
              </div>
            ) : (
              <SortablePosts posts={posts.map((post) => ({ id: post.id, description: post.description, createdAt: post.createdAt }))} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/profile/post/${post.id}`}
                    className="group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                      <PostImageCount images={post.images}/>
              <Image
                        src={post.image}
                        alt={post.description || "Post image"}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        unoptimized
                      />
                    </div>

                    <div className="space-y-2 p-3">
                      <div className="flex items-center gap-2">
                        <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-slate-300 dark:bg-slate-600">
                          <Image
                            src={post.author.avatar || img1.src}
                            alt={post.author.name || "Author avatar"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-500">
                            {post.author.name || "Unknown"}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            @{post.author.username || "user"}
                          </p>
                        </div>
                      </div>

                      <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-300">
                        {post.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{post.likesCount} <LocalizedText en="likes" de="Likes" /></span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </SortablePosts>
            )}
          </section> : null}

          {!hasResults ? (
            <section className="mt-8 rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <p className="text-slate-700 dark:text-slate-300">
                <LocalizedText en="Nothing found for" de="Nichts gefunden für" />{" "}
                <span className="font-semibold">&quot;{query}&quot;</span>.
              </p>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
