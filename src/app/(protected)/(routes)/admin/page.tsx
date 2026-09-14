import { auth } from "@/auth";
import { isProtectedAdmin, isSuperAdmin, isVibeAdmin } from "@/admin";
import { addAdminNoteComment, createAdminNote, deleteAdminNote, deleteProfileAsSuperAdmin, deleteReport, setProfileAdmin, toggleAdminNoteVote, updateAdminNote, updateReportStatus } from "@/actions";
import AdminAccessDenied from "@/app/components/AdminAccessDenied";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import { prisma } from "@/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown, Flag, MessageSquareText, ThumbsUp, UsersRound } from "lucide-react";

function reportTypeLabel(type: string, de: boolean) {
  const labels: Record<string, [string, string]> = {
    profile: ["Profil", "Profile"],
    post: ["Beitrag", "Post"],
    comment: ["Kommentar", "Comment"],
  };
  const label = labels[type] ?? [type, type];
  return de ? label[0] : label[1];
}

function reportStatusLabel(status: string, de: boolean) {
  const labels: Record<string, [string, string]> = {
    open: ["Offen", "Open"],
    resolved: ["Erledigt", "Resolved"],
    dismissed: ["Verworfen", "Dismissed"],
  };
  const label = labels[status] ?? [status, status];
  return de ? label[0] : label[1];
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) redirect("/");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";

  const profile = await prisma.profile.findUnique({ where: { email }, select: { language: true } });
  const de = profile?.language === "de";
  if (!(await isVibeAdmin(email))) return <AdminAccessDenied language={de ? "de" : "en"} />;

  const [reports, notes, profiles] = await Promise.all([
    prisma.report.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 }),
    prisma.adminNote.findMany({ include: { comments: { orderBy: { createdAt: "asc" } }, votes: { select: { voterEmail: true } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.profile.findMany({ where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}, select: { id: true, email: true, name: true, username: true, isAdmin: true }, orderBy: { name: "asc" } }),
  ]);
  const date = new Intl.DateTimeFormat(de ? "de-DE" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  const targetLink = (report: (typeof reports)[number]) => report.targetUrl || "#";
  const canDeleteUsers = isSuperAdmin(email);

  return <main className="mx-auto w-full max-w-4xl pb-24 md:pb-8">
    <BackNavigationLink language={de ? "de" : "en"} />
    <section className="mt-6 overflow-hidden rounded-3xl border border-orange-400/30 bg-white shadow-xl dark:bg-slate-900">
      <header className="bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-6 py-7 text-white">
        <p className="text-xs font-bold tracking-[.18em]">VIBE ADMIN</p>
        <h1 className="mt-2 text-3xl font-black">{de ? "Moderation" : "Moderation"}</h1>
        <p className="mt-2 text-sm text-white/85">{de ? "Meldungen und interne Abstimmung für das Admin-Team." : "Reports and internal coordination for the admin team."}</p>
      </header>

      <div className="space-y-8 p-5 sm:p-7">
        <section>
          <div className="flex items-center gap-2"><Flag size={19} className="text-orange-500"/><h2 className="font-black text-slate-900 dark:text-white">{de ? "Meldungen" : "Reports"}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold dark:bg-slate-800">{reports.filter((report) => report.status === "open").length}</span></div>
          {reports.length === 0 ? <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{de ? "Keine Meldungen offen." : "No reports yet."}</p> : <div className="mt-4 space-y-3">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-500">{reportTypeLabel(report.targetType, de)}</p><Link href={targetLink(report)} className="text-sm font-bold text-orange-600 hover:underline dark:text-orange-300">{de ? "Gemeldeten Inhalt öffnen" : "Open reported content"}</Link></div><span className="text-xs font-bold text-slate-500">{reportStatusLabel(report.status, de)}</span></div><p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{report.reason}</p><p className="mt-2 text-xs text-slate-500">{report.reporterEmail} · {date.format(report.createdAt)}</p>{report.status === "open" ? <div className="mt-3 flex gap-2"><form action={updateReportStatus}><input type="hidden" name="reportId" value={report.id}/><input type="hidden" name="status" value="resolved"/><button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">{de ? "Erledigt" : "Resolve"}</button></form><form action={updateReportStatus}><input type="hidden" name="reportId" value={report.id}/><input type="hidden" name="status" value="dismissed"/><button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold dark:border-slate-600">{de ? "Verwerfen" : "Dismiss"}</button></form></div> : <form action={deleteReport} className="mt-3"><input type="hidden" name="reportId" value={report.id}/><button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 dark:border-red-800 dark:text-red-300">{de ? "Meldung löschen" : "Delete report"}</button></form>}</article>)}</div>}
        </section>

        <details className="group border-t border-slate-200 pt-6 dark:border-slate-700" open={Boolean(q)}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 transition hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/15"><UsersRound size={18}/></span><div><h2 className="font-black">{de ? "Benutzerverwaltung" : "User management"}</h2><p className="text-xs font-medium text-slate-500">{profiles.length} {de ? "Profile" : "profiles"}</p></div></div>
            <ChevronDown size={19} className="transition group-open:rotate-180"/>
          </summary>
          <div className="pt-4">
            <p className="text-sm text-slate-500">{de ? "Adminrechte können hier vergeben oder entfernt werden. Violett und Anna sind geschützt." : "Grant or remove admin access here. Violett and Anna are protected."}</p>
            <form action="/admin" className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="admin-user-search">{de ? "Nutzer suchen" : "Search users"}</label>
              <input id="admin-user-search" name="q" type="search" defaultValue={q} maxLength={120} placeholder={de ? "Name, Benutzername oder E-Mail suchen" : "Search name, username, or email"} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
              <button className="min-h-11 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white">{de ? "Suchen" : "Search"}</button>
              {q && <Link href="/admin" className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-slate-600 hover:text-orange-600 dark:text-slate-300">{de ? "Zurücksetzen" : "Clear"}</Link>}
            </form>
            {canDeleteUsers && <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">{de ? "Du kannst als geschützter Admin andere Accounts dauerhaft löschen." : "As a protected admin, you can permanently delete other accounts."}</p>}
            <p role="status" className="mt-3 text-xs font-medium text-slate-500">{profiles.length} {profiles.length === 1 ? (de ? "Profil" : "profile") : (de ? "Profile" : "profiles")}{q ? (de ? " gefunden" : " found") : ""}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{profiles.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{item.name || item.username || item.email}</span>{isProtectedAdmin(item.email) ? <span className="text-xs font-bold text-orange-600">ADMIN</span> : <form action={setProfileAdmin}><input type="hidden" name="profileId" value={item.id}/><input type="hidden" name="isAdmin" value={item.isAdmin ? "false" : "true"}/><button className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${item.isAdmin ? "border border-red-300 text-red-600" : "bg-orange-500 text-white"}`}>{item.isAdmin ? (de ? "Admin entfernen" : "Remove admin") : (de ? "Zum Admin machen" : "Make admin")}</button></form>}</div>{canDeleteUsers && !isProtectedAdmin(item.email) && <form action={deleteProfileAsSuperAdmin} className="mt-2"><input type="hidden" name="profileId" value={item.id}/><button className="text-xs font-bold text-red-600 hover:underline dark:text-red-300">{de ? "Account löschen" : "Delete account"}</button></form>}</div>)}</div>
          </div>
        </details>

        <section className="border-t border-slate-200 pt-8 dark:border-slate-700"><div className="flex items-center gap-2"><MessageSquareText size={19} className="text-orange-500"/><h2 className="font-black text-slate-900 dark:text-white">{de ? "Interne Notizen" : "Internal notes"}</h2></div><form action={createAdminNote} className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><textarea name="body" required rows={3} maxLength={2000} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={de ? "Notiz für das Admin-Team…" : "Note for the admin team…"}/><button className="mt-3 rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2 text-sm font-bold text-white">{de ? "Notiz speichern" : "Save note"}</button></form><div className="mt-4 space-y-4">{notes.map((note) => <article key={note.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex justify-between gap-3"><p className="text-xs text-slate-500">{note.authorEmail} · {date.format(note.updatedAt)}</p><form action={deleteAdminNote}><input type="hidden" name="noteId" value={note.id}/><button className="text-xs font-bold text-red-600">{de ? "Löschen" : "Delete"}</button></form></div><form action={updateAdminNote} className="mt-3"><input type="hidden" name="noteId" value={note.id}/><textarea name="body" defaultValue={note.body} rows={3} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/><button className="mt-2 text-xs font-bold text-orange-600">{de ? "Speichern" : "Save"}</button></form><div className="mt-3 flex gap-3"><form action={toggleAdminNoteVote}><input type="hidden" name="noteId" value={note.id}/><button className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300"><ThumbsUp size={14}/>{note.votes.length}</button></form><span className="text-xs text-slate-500">{note.comments.length} {de ? "Kommentare" : "comments"}</span></div>{note.comments.map((comment) => <p key={comment.id} className="mt-2 text-sm text-slate-700 dark:text-slate-200"><b>{comment.authorEmail}:</b> {comment.body}</p>)}<form action={addAdminNoteComment} className="mt-3 flex gap-2"><input type="hidden" name="noteId" value={note.id}/><input name="body" required maxLength={1000} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={de ? "Kommentar…" : "Comment…"}/><button className="rounded-lg border border-orange-400 px-3 py-2 text-xs font-bold text-orange-600">{de ? "Senden" : "Send"}</button></form></article>)}</div></section>
      </div>
    </section>
  </main>;
}
