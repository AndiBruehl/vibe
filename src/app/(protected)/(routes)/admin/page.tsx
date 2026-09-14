import { auth } from "@/auth";
import { isProtectedAdmin, isSuperAdmin, isVibeAdmin } from "@/admin";
import { addAdminNoteComment, createAdminNote, deleteAdminNote, deleteReport, toggleAdminNoteVote, updateAdminNote, updateReportStatus } from "@/actions";
import AdminAccessDenied from "@/app/components/AdminAccessDenied";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import AdminUserManagement from "@/app/components/AdminUserManagement";
import { prisma } from "@/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flag, MessageSquareText, ThumbsUp } from "lucide-react";

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

export default async function AdminPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) redirect("/");

  const profile = await prisma.profile.findUnique({ where: { email }, select: { language: true } });
  const de = profile?.language === "de";
  if (!(await isVibeAdmin(email))) return <AdminAccessDenied language={de ? "de" : "en"} />;

  const [reports, notes, profiles] = await Promise.all([
    prisma.report.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 }),
    prisma.adminNote.findMany({ include: { comments: { orderBy: { createdAt: "asc" } }, votes: { select: { voterEmail: true } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.profile.findMany({ select: { id: true, email: true, name: true, username: true, isAdmin: true }, orderBy: { name: "asc" } }),
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
          {reports.length === 0 ? <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{de ? "Keine Meldungen offen." : "No reports yet."}</p> : <div className="mt-4 space-y-3">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-500">{reportTypeLabel(report.targetType, de)}</p><Link href={targetLink(report)} className="text-sm font-bold text-orange-600 hover:underline dark:text-orange-300">{de ? "Gemeldeten Inhalt öffnen" : "Open reported content"}</Link></div><span className="text-xs font-bold text-slate-500">{reportStatusLabel(report.status, de)}</span></div><p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{report.reason}</p><p className="mt-2 text-xs text-slate-500">{report.reporterEmail} · {date.format(report.createdAt)}</p>{report.status === "open" ? <div className="mt-3 flex gap-2"><form action={updateReportStatus}><input type="hidden" name="reportId" value={report.id}/><input type="hidden" name="status" value="resolved"/><button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">{de ? "Erledigt" : "Resolve"}</button></form><form action={updateReportStatus}><input type="hidden" name="reportId" value={report.id}/><input type="hidden" name="status" value="dismissed"/><button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold dark:border-slate-600">{de ? "Verwerfen" : "Dismiss"}</button></form></div> : canDeleteUsers ? <form action={deleteReport} className="mt-3"><input type="hidden" name="reportId" value={report.id}/><button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 dark:border-red-800 dark:text-red-300">{de ? "Meldung löschen" : "Delete report"}</button></form> : null}</article>)}</div>}
        </section>

        <AdminUserManagement users={profiles.map((item) => ({ ...item, isProtected: isProtectedAdmin(item.email) }))} de={de} canDeleteUsers={canDeleteUsers} />

        <section className="border-t border-slate-200 pt-8 dark:border-slate-700"><div className="flex items-center gap-2"><MessageSquareText size={19} className="text-orange-500"/><h2 className="font-black text-slate-900 dark:text-white">{de ? "Interne Notizen" : "Internal notes"}</h2></div><form action={createAdminNote} className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><textarea name="body" required rows={3} maxLength={2000} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={de ? "Notiz für das Admin-Team…" : "Note for the admin team…"}/><button className="mt-3 rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2 text-sm font-bold text-white">{de ? "Notiz speichern" : "Save note"}</button></form><div className="mt-4 space-y-4">{notes.map((note) => <article key={note.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex justify-between gap-3"><p className="text-xs text-slate-500">{note.authorEmail} · {date.format(note.updatedAt)}</p>{canDeleteUsers && <form action={deleteAdminNote}><input type="hidden" name="noteId" value={note.id}/><button className="text-xs font-bold text-red-600">{de ? "Löschen" : "Delete"}</button></form>}</div><form action={updateAdminNote} className="mt-3"><input type="hidden" name="noteId" value={note.id}/><textarea name="body" defaultValue={note.body} rows={3} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/><button className="mt-2 text-xs font-bold text-orange-600">{de ? "Speichern" : "Save"}</button></form><div className="mt-3 flex gap-3"><form action={toggleAdminNoteVote}><input type="hidden" name="noteId" value={note.id}/><button className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300"><ThumbsUp size={14}/>{note.votes.length}</button></form><span className="text-xs text-slate-500">{note.comments.length} {de ? "Kommentare" : "comments"}</span></div>{note.comments.map((comment) => <p key={comment.id} className="mt-2 text-sm text-slate-700 dark:text-slate-200"><b>{comment.authorEmail}:</b> {comment.body}</p>)}<form action={addAdminNoteComment} className="mt-3 flex gap-2"><input type="hidden" name="noteId" value={note.id}/><input name="body" required maxLength={1000} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={de ? "Kommentar…" : "Comment…"}/><button className="rounded-lg border border-orange-400 px-3 py-2 text-xs font-bold text-orange-600">{de ? "Senden" : "Send"}</button></form></article>)}</div></section>
      </div>
    </section>
  </main>;
}
