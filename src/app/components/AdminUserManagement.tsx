"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, UsersRound } from "lucide-react";
import { deleteProfileAsSuperAdmin, setProfileAdmin } from "@/actions";

type AdminUser = { id: string; email: string; name: string | null; username: string | null; isAdmin: boolean; isProtected: boolean };

export default function AdminUserManagement({ users, de, canDeleteUsers }: { users: AdminUser[]; de: boolean; canDeleteUsers: boolean }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().replace(/^@/, "").toLocaleLowerCase();
  const visibleUsers = useMemo(() => users.filter((user) => !normalized || user.username?.toLocaleLowerCase().includes(normalized)), [users, normalized]);

  return <details className="group border-t border-slate-200 pt-6 dark:border-slate-700">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 transition hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
      <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/15"><UsersRound size={18}/></span><div><h2 className="font-black">{de ? "Benutzerverwaltung" : "User management"}</h2><p className="text-xs font-medium text-slate-500">{users.length} {de ? "Profile" : "profiles"}</p></div></div><ChevronDown size={19} className="transition group-open:rotate-180"/>
    </summary>
    <div className="pt-4">
      <p className="text-sm text-slate-500">{de ? "Adminrechte können hier vergeben oder entfernt werden. Violett und Anna sind geschützt." : "Grant or remove admin access here. Violett and Anna are protected."}</p>
      <label className="relative mt-4 block"><span className="sr-only">{de ? "Handle suchen" : "Search handle"}</span><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" maxLength={120} placeholder={de ? "Nach @Benutzername suchen" : "Search by @username"} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/></label>
      {canDeleteUsers && <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">{de ? "Du kannst als geschützter Admin andere Accounts dauerhaft löschen." : "As a protected admin, you can permanently delete other accounts."}</p>}
      <p role="status" className="mt-3 text-xs font-medium text-slate-500">{visibleUsers.length} {visibleUsers.length === 1 ? (de ? "Profil" : "profile") : (de ? "Profile" : "profiles")}{normalized ? (de ? " gefunden" : " found") : ""}</p>
      {visibleUsers.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">{de ? "Keine passenden Profile gefunden." : "No matching profiles found."}</p> : <div className="mt-4 grid gap-2 sm:grid-cols-2">{visibleUsers.map((user) => <div key={user.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name || user.username || user.email}</span>{user.isProtected ? <span className="text-xs font-bold text-orange-600">ADMIN</span> : <form action={setProfileAdmin}><input type="hidden" name="profileId" value={user.id}/><input type="hidden" name="isAdmin" value={user.isAdmin ? "false" : "true"}/><button className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${user.isAdmin ? "border border-red-300 text-red-600" : "bg-orange-500 text-white"}`}>{user.isAdmin ? (de ? "Admin entfernen" : "Remove admin") : (de ? "Zum Admin machen" : "Make admin")}</button></form>}</div>{canDeleteUsers && !user.isProtected && <form action={deleteProfileAsSuperAdmin} className="mt-2"><input type="hidden" name="profileId" value={user.id}/><button className="text-xs font-bold text-red-600 hover:underline dark:text-red-300">{de ? "Account löschen" : "Delete account"}</button></form>}</div>)}</div>}
    </div>
  </details>;
}
