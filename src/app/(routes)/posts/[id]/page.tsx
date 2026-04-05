import { prisma } from "@/db";
import Image from "next/image";
import { notFound } from "next/navigation";

import Link from "next/link";
import { MoveLeft } from "lucide-react";

export default async function SinglePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  return (
    <>
      <section className="flex flex-row justify-between items-center">
        <Link
          href="/profile"
          className="group flex items-center gap-2 text-black no-underline hover:no-underline visited:no-underline hover:text-slate-700"
        >
          <MoveLeft className="shrink-0" />

          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Back to Profile
          </span>
        </Link>
      </section>
      <main className="mx-auto flex min-h-screen w-full justify-center p-4 md:p-8">
        <div className="w-full max-w-md flex justify-center">
          {/* 👇 Skalierung */}
          <div className="w-full scale-90 md:scale-95 origin-top">
            <article className="w-full overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
              <div className="w-full">
                <Image
                  src={post.image}
                  alt={post.description || "Post image"}
                  width={800}
                  height={800}
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>

              <div className="space-y-4 p-5 md:p-6">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Post
                </h1>

                <p className="text-gray-700 dark:text-gray-200">
                  {post.description}
                </p>
              </div>
            </article>
          </div>
        </div>
      </main>
    </>
  );
}
