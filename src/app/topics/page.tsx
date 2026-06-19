import Link from "next/link";
import { prisma } from "@/db";
import DesktopNav from "@/app/components/DesktopNav";
import MobileNav from "@/app/components/MobileNav";

export default async function TopicsIndex() {
  const topics = await prisma.topic.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <DesktopNav />
      <MobileNav />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Topics</h1>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {topics.map((t) => (
            <Link
              key={t.id}
              href={`/topics/${t.slug}`}
              className="block rounded-md border px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                #{t.name}
              </div>
              {t.description ? (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {t.description}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
