import { auth } from "@/auth";
import Link from "next/link";
import { isProtectedAdmin, isSuperAdmin, isVibeAdmin } from "@/admin";
import { addAdminNoteComment, createAdminNote, deleteAdminNote, deleteReport, toggleAdminNoteVote, updateAdminNote } from "@/actions";
import AdminAccessDenied from "@/app/components/AdminAccessDenied";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import AdminUserManagement from "@/app/components/AdminUserManagement";
import ReportContentPreview from "@/app/components/ReportContentPreview";
import ReportModerationControls from "@/app/components/ReportModerationControls";
import VibeTeamMessageComposer from "@/app/components/VibeTeamMessageComposer";
import SupportTicketManagement from "@/app/components/SupportTicketManagement";
import AdminPollManager from "@/app/components/AdminPollManager";
import { prisma } from "@/db";
import { ensureVibeSystemProfiles } from "@/system-profile";
import { Flag, History, MessageSquareText, ThumbsUp } from "lucide-react";
import { redirect } from "next/navigation";

function reportTypeLabel(type: string, de: boolean) {
  const labels: Record<string, [string, string]> = { profile: ["Profil", "Profile"], post: ["Beitrag", "Post"], comment: ["Kommentar", "Comment"] };
  const label = labels[type] ?? [type, type];
  return de ? label[0] : label[1];
}

function reportStatusLabel(status: string, de: boolean) {
  const labels: Record<string, [string, string]> = { open: ["Offen", "Open"], resolved: ["Erledigt", "Resolved"], dismissed: ["Verworfen", "Dismissed"] };
  const label = labels[status] ?? [status, status];
  return de ? label[0] : label[1];
}

function moderationActionLabel(action: string | null, de: boolean) {
  const labels: Record<string, [string, string]> = {
    "no-action": ["Keine Maßnahme erforderlich", "No action needed"],
    review: ["Wird weiter geprüft", "Under further review"],
    "content-removed": ["Inhalt wurde gelöscht", "Content was removed"],
    other: ["Andere Maßnahme durchgeführt", "Other action taken"],
  };
  if (!action) return null;
  const label = labels[action] ?? [action, action];
  return de ? label[0] : label[1];
}

function adminActivityLabel(kind: string, de: boolean) {
  const labels: Record<string, [string, string]> = {
    report: ["Neue Meldung", "New report"], "report-status": ["Meldung bearbeitet", "Report moderated"], "report-delete": ["Meldung gelöscht", "Report deleted"],
    note: ["Admin-Notiz erstellt", "Admin note created"], "note-update": ["Admin-Notiz aktualisiert", "Admin note updated"], "note-delete": ["Admin-Notiz gelöscht", "Admin note deleted"],
    "note-comment": ["Notiz kommentiert", "Note commented on"], "note-vote": ["Für Notiz abgestimmt", "Note voted on"], "admin-role": ["Adminrolle geändert", "Admin role changed"],
    "user-delete": ["Account gelöscht", "Account deleted"], "post-delete": ["Beitrag gelöscht", "Post deleted"], "comment-delete": ["Kommentar gelöscht", "Comment deleted"], "team-message": ["VibeTeam-Nachricht gesendet", "VibeTeam message sent"], "support-ticket": ["Neue Support-Anfrage", "New support request"], "support-claim": ["Support-Ticket übernommen", "Support ticket claimed"], "support-reply": ["Support-Ticket beantwortet", "Support ticket answered"], "support-release": ["Support-Ticket freigegeben", "Support ticket released"], "support-close": ["Support-Ticket geschlossen", "Support ticket closed"], "support-delete": ["Support-Ticket gelöscht", "Support ticket deleted"], "restriction": ["Temporäre Restriktion gesetzt", "Temporary restriction applied"], "profile-verification": ["Profilverifizierung geändert", "Profile verification changed"], "profile-badge": ["Profil-Badge geändert", "Profile badge changed"],
  };
  const label = labels[kind] ?? ["Admin-Aktion", "Admin action"];
  return de ? label[0] : label[1];
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requestedTab } = await searchParams;
  const activeTab = ["moderation", "support", "team", "management", "log", "notes", "polls"].includes(requestedTab || "") ? requestedTab! : "moderation";
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) redirect("/");
  const profile = await prisma.profile.findUnique({ where: { email }, select: { language: true } });
  const de = profile?.language === "de";
  if (!(await isVibeAdmin(email))) return <AdminAccessDenied language={de ? "de" : "en"} />;
  await ensureVibeSystemProfiles();

  const [reports, notes, profiles, auditEntries, supportTickets, polls] = await Promise.all([
    prisma.report.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 }),
    prisma.adminNote.findMany({ include: { comments: { orderBy: { createdAt: "asc" } }, votes: { select: { voterEmail: true } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.profile.findMany({ select: { id: true, email: true, name: true, username: true, isAdmin: true, isVerified: true, profileBadges: true, isSystem: true, restrictedUntil: true, restrictionMessages: true, restrictionComments: true, restrictionPosts: true }, orderBy: { name: "asc" } }).then((items) => items.map((item) => ({ ...item, profileBadges: Array.isArray(item.profileBadges) ? item.profileBadges : [] }))),
    prisma.adminActivity.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.supportTicket.findMany({ include: { messages: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.poll.findMany({ include: { options: { orderBy: { position: "asc" }, include: { votes: { include: { profile: { select: { name: true, username: true, avatar: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const date = new Intl.DateTimeFormat(de ? "de-DE" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  const canDeleteUsers = isSuperAdmin(email);
  const manageableProfiles = profiles.filter((item) => !item.isSystem);

  return <main className="mx-auto w-full max-w-4xl pb-24 md:pb-8">
    <BackNavigationLink language={de ? "de" : "en"} />
    <section className="mt-6 overflow-hidden rounded-3xl border border-orange-400/30 bg-white shadow-xl dark:bg-slate-900">
      <header className="bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-6 py-7 text-white"><p className="text-xs font-bold tracking-[.18em]">VIBE ADMIN</p><h1 className="mt-2 text-3xl font-black">{de ? "Adminbereich" : "Admin area"}</h1><p className="mt-2 text-sm text-white/85">{de ? "Moderation, Support und Teamarbeit an einem Ort." : "Moderation, support, and team work in one place."}</p></header>
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">{[
        ["moderation", de ? "Meldungen" : "Reports"],
        ["support", "Support@Vibe"],
        ["team", "VibeTeam"],
        ["management", de ? "Benutzer" : "Users"],
        ["notes", de ? "Notizen" : "Notes"],
        ["polls", "Polls"],
        ["log", de ? "Protokoll" : "Log"],
      ].map(([tab, label]) => <Link key={tab} href={`/admin?tab=${tab}`} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition ${activeTab === tab ? "bg-white text-orange-600 shadow-sm dark:bg-slate-800 dark:text-orange-300" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}>{label}</Link>)}</nav>
      <div className="space-y-8 p-5 sm:p-7">
        {activeTab === "moderation" && <>
        <section>
          <div className="flex items-center gap-2"><Flag size={19} className="text-orange-500"/><h2 className="font-black text-slate-900 dark:text-white">{de ? "Meldungen" : "Reports"}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold dark:bg-slate-800">{reports.filter((report) => report.status === "open").length}</span></div>
          {reports.length === 0 ? <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{de ? "Keine Meldungen offen." : "No reports yet."}</p> : <div className="mt-4 space-y-3">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-500">{reportTypeLabel(report.targetType, de)}</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{report.targetLabel || (de ? "Gemeldeter Inhalt" : "Reported content")}</p><ReportContentPreview href={report.targetUrl} de={de} /></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{reportStatusLabel(report.status, de)}</span></div><p className="mt-3 text-sm text-slate-700 dark:text-slate-200"><b>{de ? "Grund:" : "Reason:"}</b> {report.reason}</p><p className="mt-2 text-xs text-slate-500">{de ? "Gemeldet von" : "Reported by"}: {report.reporterEmail} · {date.format(report.createdAt)}</p>{report.targetOwnerEmail && <p className="mt-1 text-xs text-slate-500">{de ? "Betroffenes Profil" : "Affected profile"}: {report.targetOwnerEmail}</p>}{report.moderationAction && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"><b>{de ? "Letzte Maßnahme:" : "Latest action:"}</b> {moderationActionLabel(report.moderationAction, de)}{report.moderationNote ? <p className="mt-1">{report.moderationNote}</p> : null}<p className="mt-1 text-xs opacity-75">{report.moderatedByEmail} · {report.moderatedAt ? date.format(report.moderatedAt) : ""}</p></div>}{report.status === "open" ? <ReportModerationControls reportId={report.id} targetType={report.targetType} status={report.status} currentAction={report.moderationAction} de={de} canRemoveContent={canDeleteUsers} /> : canDeleteUsers ? <form action={deleteReport} className="mt-3"><input type="hidden" name="reportId" value={report.id}/><button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 dark:border-red-800 dark:text-red-300">{de ? "Meldung löschen" : "Delete report"}</button></form> : null}</article>)}</div>}
        </section>
        </>}
        {activeTab === "support" && <SupportTicketManagement tickets={supportTickets} actorEmail={email} de={de} />}
        {activeTab === "team" && <VibeTeamMessageComposer recipients={manageableProfiles.map((item) => ({ id: item.id, username: item.username, name: item.name }))} de={de} />}
        {activeTab === "polls" && <AdminPollManager de={de} referenceTime={new Date().toISOString()} polls={polls.map((poll) => ({ ...poll, createdAt: poll.createdAt.toISOString(), startsAt: poll.startsAt?.toISOString() ?? null, expiresAt: poll.expiresAt?.toISOString() ?? null }))} />}
        {activeTab === "management" && <AdminUserManagement users={manageableProfiles.map((item) => ({ ...item, isProtected: isProtectedAdmin(item.email) }))} de={de} canDeleteUsers={canDeleteUsers} referenceTime={new Date().toISOString()} />}
        {activeTab === "log" && <>
        <section className="border-t border-slate-200 pt-8 dark:border-slate-700"><div className="flex items-center gap-2"><History size={19} className="text-orange-500"/><h2 className="font-black text-slate-900 dark:text-white">{de ? "Admin-Protokoll" : "Admin log"}</h2></div><p className="mt-1 text-sm text-slate-500">{de ? "Nachvollziehbare Übersicht aller Moderations- und Adminaktionen." : "Traceable overview of moderation and admin actions."}</p>{auditEntries.length === 0 ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{de ? "Noch keine Adminaktionen." : "No admin actions yet."}</p> : <div className="mt-4 max-h-96 divide-y divide-slate-200 overflow-y-auto rounded-2xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">{auditEntries.map((entry) => { const actor = profiles.find((item) => item.email === entry.actorEmail); return <article key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3"><div className="min-w-0"><p className="font-semibold text-slate-900 dark:text-white">{adminActivityLabel(entry.kind, de)}</p><p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{entry.detail}</p><p className="mt-1 truncate text-xs text-slate-500">{actor?.name || actor?.username || entry.actorEmail}</p></div><time className="shrink-0 text-right text-xs text-slate-500">{date.format(entry.createdAt)}</time></article>; })}</div>}</section>
        </>}
        {activeTab === "notes" && <>
        <section className="border-t border-slate-200 pt-8 dark:border-slate-700"><div className="flex items-center gap-2"><MessageSquareText size={19} className="text-orange-500"/><h2 className="font-black text-slate-900 dark:text-white">{de ? "Interne Notizen" : "Internal notes"}</h2></div><form action={createAdminNote} className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><textarea name="body" required rows={3} maxLength={2000} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={de ? "Notiz für das Admin-Team…" : "Note for the admin team…"}/><button className="mt-3 rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2 text-sm font-bold text-white">{de ? "Notiz speichern" : "Save note"}</button></form><div className="mt-4 space-y-4">{notes.map((note) => <article key={note.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex justify-between gap-3"><p className="text-xs text-slate-500">{note.authorEmail} · {date.format(note.updatedAt)}</p>{canDeleteUsers && <form action={deleteAdminNote}><input type="hidden" name="noteId" value={note.id}/><button className="text-xs font-bold text-red-600">{de ? "Löschen" : "Delete"}</button></form>}</div><form action={updateAdminNote} className="mt-3"><input type="hidden" name="noteId" value={note.id}/><textarea name="body" defaultValue={note.body} rows={3} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"/><button className="mt-2 text-xs font-bold text-orange-600">{de ? "Speichern" : "Save"}</button></form><div className="mt-3 flex gap-3"><form action={toggleAdminNoteVote}><input type="hidden" name="noteId" value={note.id}/><button className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300"><ThumbsUp size={14}/>{note.votes.length}</button></form><span className="text-xs text-slate-500">{note.comments.length} {de ? "Kommentare" : "comments"}</span></div>{note.comments.map((comment) => <p key={comment.id} className="mt-2 text-sm text-slate-700 dark:text-slate-200"><b>{comment.authorEmail}:</b> {comment.body}</p>)}<form action={addAdminNoteComment} className="mt-3 flex gap-2"><input type="hidden" name="noteId" value={note.id}/><input name="body" required maxLength={1000} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={de ? "Kommentar…" : "Comment…"}/><button className="rounded-lg border border-orange-400 px-3 py-2 text-xs font-bold text-orange-600">{de ? "Senden" : "Send"}</button></form></article>)}</div></section>
        </>}
      </div>
    </section>
  </main>;
}
