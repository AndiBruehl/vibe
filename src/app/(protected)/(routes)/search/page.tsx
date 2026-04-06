import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import SearchInput from "./SearchInput";
import img1 from "../profile/default.jpg";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const [users, posts] = query
    ? await Promise.all([
        prisma.profile.findMany({
          where: {
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
        }),

        prisma.post.findMany({
          where: {
            description: {
              contains: query,
              mode: "insensitive",
            },
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
          take: 50,
        }),
      ])
    : [[], []];

  const hasResults = users.length > 0 || posts.length > 0;

  return (
    <main className="pb-24 md:pb-8">
      <section className="flex items-center justify-between">
        <Link
          href="/home"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-200 dark:visited:text-slate-200 dark:hover:text-slate-300"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Back to Home
          </span>
        </Link>

        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Search
        </h1>

        <div className="w-24" />
      </section>

      <section className="mt-6">
        <SearchInput initialQuery={query} />
      </section>

      {!query ? (
        <section className="mt-6 rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
          <p className="text-slate-700 dark:text-slate-300">
            Search for users or words inside post descriptions.
          </p>
        </section>
      ) : null}

      {query ? (
        <>
          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Users
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {users.length} result{users.length === 1 ? "" : "s"}
              </span>
            </div>

            {users.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
                <p className="text-slate-700 dark:text-slate-300">
                  No users found.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    href={
                      user.username ? `/profile/${user.username}` : "/profile"
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
                          <p className="truncate font-semibold text-slate-800 transition group-hover:text-slate-600 dark:text-slate-200 dark:group-hover:text-slate-300">
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
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Posts
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {posts.length} result{posts.length === 1 ? "" : "s"}
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
                <p className="text-slate-700 dark:text-slate-300">
                  No posts found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/profile/post/${post.id}`}
                    className="group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
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
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
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
                        <span>{post.likesCount} likes</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {!hasResults ? (
            <section className="mt-8 rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <p className="text-slate-700 dark:text-slate-300">
                Nothing found for{" "}
                <span className="font-semibold">&quot;{query}&quot;</span>.
              </p>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
