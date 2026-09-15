import PostImageCount from "@/app/components/PostImageCount";
import SortablePosts from "./SortablePosts";
import BookmarkCollectionPicker from "./BookmarkCollectionPicker";
import { createBookmarkCollection, deleteBookmarkCollection } from "@/actions";
import { prisma } from "@/db";
import Link from "next/link";
import ProgressiveImage from "./ProgressiveImage";
import { Folder, Plus, Trash2 } from "lucide-react";

type Props = { email: string; collectionId?: string; language?: "en" | "de" };

export default async function BookmarkPosts({ email, collectionId, language = "en" }: Props) {
  const de = language === "de";
  const [profile, bookmarks] = await Promise.all([
    prisma.profile.findUnique({ where: { email }, select: { id: true } }),
    prisma.postBookmark.findMany({ where: { authorEmail: email }, select: { postId: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const collections = profile ? await prisma.bookmarkCollection.findMany({ where: { profileId: profile.id }, include: { items: { select: { postId: true } } }, orderBy: { updatedAt: "desc" } }) : [];
  const activeCollection = collections.find((collection) => collection.id === collectionId);
  const selectedPostIds = activeCollection ? new Set(activeCollection.items.map((item) => item.postId)) : null;
  const visibleBookmarks = selectedPostIds ? bookmarks.filter((bookmark) => selectedPostIds.has(bookmark.postId)) : bookmarks;
  const posts = visibleBookmarks.length ? await prisma.post.findMany({ where: { id: { in: visibleBookmarks.map((bookmark) => bookmark.postId) }, isArchived: false } }) : [];
  const postsById = new Map(posts.map((post) => [post.id, post]));
  const savedPosts = visibleBookmarks.map((bookmark) => postsById.get(bookmark.postId)).filter((post): post is (typeof posts)[number] => Boolean(post));
  const hrefFor = (id?: string) => id ? `/profile?tab=bookmarks&collection=${encodeURIComponent(id)}` : "/profile?tab=bookmarks";

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Folder size={18} className="text-orange-500" />{de ? "Gespeicherte Sammlungen" : "Saved collections"}</div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{de ? "Ordne gespeicherte Beiträge nach Themen." : "Organize saved posts by topic."}</p>
          </div>
          <form action={createBookmarkCollection} className="flex gap-2">
            <input name="name" required maxLength={50} placeholder={de ? "Neue Sammlung" : "New collection"} className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
            <button className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-linear-to-r from-orange-500 to-pink-500 px-3 py-2 text-sm font-semibold text-white"><Plus size={15} />{de ? "Anlegen" : "Create"}</button>
          </form>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={hrefFor()} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${!activeCollection ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 hover:text-orange-600 dark:bg-slate-700 dark:text-slate-200"}`}>{de ? `Alle (${bookmarks.length})` : `All (${bookmarks.length})`}</Link>
          {collections.map((collection) => <div key={collection.id} className={`flex items-center rounded-lg text-sm font-semibold ${activeCollection?.id === collection.id ? "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}`}><Link href={hrefFor(collection.id)} className="px-3 py-1.5">{collection.name} ({collection.items.length})</Link><form action={deleteBookmarkCollection}><input type="hidden" name="collectionId" value={collection.id} /><button className="mr-1 grid size-7 place-items-center rounded-md hover:bg-black/10" aria-label={de ? "Sammlung löschen" : "Delete collection"}><Trash2 size={14} /></button></form></div>)}
        </div>
      </div>
      {savedPosts.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900"><p className="text-slate-600 dark:text-slate-300">{activeCollection ? (de ? "Diese Sammlung ist noch leer." : "This collection is empty.") : (de ? "Noch keine gespeicherten Beiträge." : "No bookmarked posts yet.")}</p></div>
      ) : (
        <SortablePosts posts={savedPosts.map((post) => ({ id: post.id, description: post.description, createdAt: post.createdAt }))} className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {savedPosts.map((post) => <article key={post.id} className="group relative z-0 overflow-visible rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:z-20 hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"><Link href={`/posts/${post.id}`} className="block overflow-hidden rounded-t-2xl"><div className="relative aspect-square w-full overflow-hidden"><PostImageCount images={post.images}/><ProgressiveImage src={post.image} alt={post.description || (de ? "Gespeicherter Beitrag" : "Bookmarked post image")} lockAspectRatio="1 / 1" containerClassName="size-full" className="object-cover transition duration-300 group-hover:scale-[1.03]" /></div></Link><div className="space-y-2 p-3"><p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{post.description || (de ? "Keine Beschreibung" : "No description")}</p><div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"><span>{post.likesCount} {de ? "Likes" : "likes"}</span><BookmarkCollectionPicker postId={post.id} collections={collections} assignedCollectionIds={collections.filter((collection) => collection.items.some((item) => item.postId === post.id)).map((collection) => collection.id)} language={language} /></div></div></article>)}
        </SortablePosts>
      )}
    </section>
  );
}
