import Link from "next/link";
import { prisma } from "@/db";

type Props = {
  email: string;
};

export default async function ProfileTopics({ email }: Props) {
  const profile = await prisma.profile.findUnique({ where: { email } });
  if (!profile) return <p className="text-gray-600">No topics found.</p>;

  const follows = await prisma.topicFollow.findMany({
    where: { profileId: profile.id },
    include: { topic: true },
    orderBy: { createdAt: "desc" },
  });

  if (follows.length === 0) {
    return (
      <p className="text-gray-600">You are not following any topics yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {follows.map((f) => (
        <Link
          key={f.id}
          href={`/topics/${f.topic.slug}`}
          className="block rounded-md border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <div className="font-semibold text-slate-800 dark:text-slate-100">
            #{f.topic.slug}
          </div>
          {f.topic.description ? (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {f.topic.description}
            </div>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
