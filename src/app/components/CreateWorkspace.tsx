"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2 } from "lucide-react";
import { postEntry } from "@/actions";
import { deletePostDraft } from "@/draft-actions";
import PostComposer from "./PostComposer";
import type { TaggedProfile } from "./ProfileTagPicker";
import useVibeLanguage from "./useVibeLanguage";

type Draft = { id: string; description: string; images: string[]; mediaTypes: string[]; topics: string[]; updatedAt: string; taggedProfiles: TaggedProfile[] };
export default function CreateWorkspace({ drafts, draftLoadFailed = false }: { drafts: Draft[]; draftLoadFailed?: boolean }) {
  const de = useVibeLanguage() === "de";
  const router = useRouter();
  const [tab, setTab] = useState<"new" | "drafts">("new");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const button = "rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600";
  async function remove(id: string) {
    setPending(id); setError("");
    try {
      const result = await deletePostDraft(id);
      if (!result.ok) setError(de ? "Löschen fehlgeschlagen. Bitte erneut versuchen." : "Could not delete draft. Please try again.");
      else router.refresh();
    } catch { setError(de ? "Verbindung unterbrochen. Bitte erneut versuchen." : "Connection interrupted. Please try again."); }
    finally { setPending(null); }
  }
  return <main className="mx-auto w-full max-w-xl py-6">
    <h1 className="mb-6 text-2xl font-bold">{de ? "Beitrag erstellen" : "Create a post"}</h1>
    <div className="mb-6 flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
      {(["new", "drafts"] as const).map(value => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${tab === value ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}>
        {value === "new" ? <Plus size={18} /> : <FileText size={18} />}
        {value === "new" ? (de ? "Neuer Beitrag" : "New post") : `${de ? "Entwürfe" : "Drafts"} (${drafts.length})`}
      </button>)}
    </div>
    {notice && <p role="status" className="mb-4 text-sm text-emerald-600 dark:text-emerald-300">{notice}</p>}
    {error && <p role="alert" className="mb-4 text-sm text-red-500">{error}</p>}
    {draftLoadFailed && <p role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">{de ? "Entwürfe konnten gerade nicht geladen werden. Du kannst trotzdem einen neuen Beitrag erstellen und erneut versuchen." : "Drafts could not be loaded right now. You can still create a new post and try again."}</p>}
    <section hidden={tab !== "new"}>
      {editing && <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-semibold">{de ? "Entwurf bearbeiten" : "Editing draft"}</p><button type="button" className={button} onClick={() => {
        if (!window.confirm(de ? "Neuen Beitrag beginnen? Nicht gespeicherte Änderungen werden verworfen." : "Start a new post? Unsaved changes will be discarded.")) return;
        setEditing(null); setRevision(value => value + 1);
      }}>{de ? "Neuen Beitrag beginnen" : "Start new post"}</button></div>}
      <PostComposer key={`${editing?.id || "new"}-${revision}`} action={postEntry} accountDrafts draftId={editing?.id} initialImages={editing?.images} initialMediaTypes={editing?.mediaTypes} description={editing?.description} topics={editing?.topics} taggedProfiles={editing?.taggedProfiles} onDraftSaved={() => {
        setNotice(de ? "Entwurf in deinem Account gespeichert." : "Draft saved to your account.");
        setEditing(null); setRevision(value => value + 1); setTab("drafts"); router.refresh();
      }} />
    </section>
    <section hidden={tab !== "drafts"} className="space-y-4">
      {!drafts.length && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><FileText className="mx-auto mb-3 text-orange-400" /><p className="font-semibold">{de ? "Noch keine Entwürfe" : "No drafts yet"}</p><p className="mt-2 text-sm text-slate-500">{de ? "Speichere einen Beitrag als Entwurf und mache später auf einem beliebigen Gerät weiter." : "Save a post as a draft and continue later on any device."}</p></div>}
      {drafts.map(draft => <article key={draft.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {draft.images[0] && (draft.mediaTypes[0] === "video" ? <video src={draft.images[0]} muted playsInline preload="metadata" className="h-40 w-full bg-black object-contain" /> : <img src={draft.images[0]} alt={de ? "Entwurf-Vorschau" : "Draft preview"} className="h-40 w-full object-cover" />)}
        <div className="space-y-3 p-4"><p className="line-clamp-2 font-semibold">{draft.description || (de ? "Entwurf ohne Beschreibung" : "Draft without a description")}</p>
          <p className="text-xs text-slate-500">{de ? "Zuletzt geändert: " : "Last edited: "}<time dateTime={draft.updatedAt}>{Number.isNaN(Date.parse(draft.updatedAt)) ? (de ? "Unbekannt" : "Unknown") : new Date(draft.updatedAt).toLocaleString(de ? "de-DE" : "en-US")}</time></p>
          <div className="flex gap-2"><button className={button} onClick={() => {
            if (!window.confirm(de ? "Entwurf öffnen? Nicht gespeicherte Änderungen im Editor werden ersetzt." : "Open draft? Unsaved changes in the editor will be replaced.")) return;
            setEditing(draft); setRevision(value => value + 1); setTab("new"); setNotice("");
          }}>{de ? "Weiterbearbeiten" : "Continue editing"}</button><button disabled={pending === draft.id} className={`${button} inline-flex items-center gap-2 text-red-500 disabled:opacity-50`} onClick={() => { if(window.confirm(de ? "Diesen Entwurf löschen?" : "Delete this draft?")) void remove(draft.id); }}><Trash2 size={16} />{de ? "Löschen" : "Delete"}</button></div>
        </div>
      </article>)}
    </section>
  </main>;
}
