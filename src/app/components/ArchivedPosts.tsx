import { prisma } from "@/db";
import { togglePostArchive } from "@/actions";
import Image from "next/image";
import Link from "next/link";

export default async function ArchivedPosts({ email, language }: { email: string; language: "en" | "de" }) {
  const de = language === "de";
  const posts = await prisma.post.findMany({ where: { authorEmail: email, isArchived: true }, orderBy: { updatedAt: "desc" } });

  if (!posts.length) return <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-slate-200 dark:bg-slate-800 dark:shadow-slate-950"><p className="text-slate-600 dark:text-slate-300">{de ? "Dein Archiv ist leer." : "Your archive is empty."}</p></div>;

  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
    {posts.map((post) => <article key={post.id} className="overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-200 dark:bg-slate-800 dark:shadow-slate-950">
      <Link href={`/posts/${post.id}`} className="block"><div className="relative aspect-square"><Image src={post.image} alt={post.description || (de ? "Archivierter Beitrag" : "Archived post")} fill className="object-cover" unoptimized /></div></Link>
      <div className="space-y-3 p-3"><p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{post.description || (de ? "Keine Beschreibung" : "No description")}</p><form action={togglePostArchive}><input type="hidden" name="postId" value={post.id} /><input type="hidden" name="archive" value="false" /><button className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">{de ? "Wiederherstellen" : "Restore"}</button></form></div>
    </article>)}
  </div>;
}
