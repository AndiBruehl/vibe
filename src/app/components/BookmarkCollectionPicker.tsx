"use client";

import { Check, FolderPlus, X } from "lucide-react";
import { useState } from "react";
import { toggleBookmarkCollectionPost } from "@/actions";

type Collection = { id: string; name: string };

export default function BookmarkCollectionPicker({ postId, collections, assignedCollectionIds, language }: { postId: string; collections: Collection[]; assignedCollectionIds: string[]; language: "en" | "de" }) {
  const [open, setOpen] = useState(false);
  const de = language === "de";
  if (!collections.length) return null;

  return (
    <div className="relative z-30">
      <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-orange-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-orange-300" aria-expanded={open}>
        <FolderPlus size={14} /> {de ? "Sammlung" : "Collection"}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 flex items-center justify-between px-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><span>{de ? "Zu Sammlung hinzufügen" : "Add to collection"}</span><button type="button" onClick={() => setOpen(false)} aria-label={de ? "Schließen" : "Close"}><X size={14} /></button></div>
          {collections.map((collection) => {
            const assigned = assignedCollectionIds.includes(collection.id);
            return <form key={collection.id} action={toggleBookmarkCollectionPost}><input type="hidden" name="collectionId" value={collection.id} /><input type="hidden" name="postId" value={postId} /><button className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-orange-400/10"><span className="truncate">{collection.name}</span>{assigned && <Check size={15} className="text-orange-500" />}</button></form>;
          })}
        </div>
      )}
    </div>
  );
}
