"use client";

import { deleteProfileAsSuperAdmin } from "@/actions";

export default function DeleteProfileButton({ profileId, de, fallback = "/profiles" }: { profileId: string; de: boolean; fallback?: string; useReferrer?: boolean }) {

  return <form action={deleteProfileAsSuperAdmin}>
    <input type="hidden" name="profileId" value={profileId}/>
    <input type="hidden" name="returnTo" value={fallback}/>
    <button className="rounded-xl border border-red-400/70 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10">{de ? "Profil löschen" : "Delete profile"}</button>
  </form>;
}
