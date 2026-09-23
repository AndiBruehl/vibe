"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Switch } from "@radix-ui/themes";
import { useState, useTransition } from "react";
import { updateProfileSectionVisibility } from "@/actions";

type Visibility = {
  showProfileLinks?: boolean;
  showProfileShoutouts?: boolean;
  showProfileTopics?: boolean;
  showProfileHighlights?: boolean;
  showProfileArchive?: boolean;
  showPinnedPosts?: boolean;
};

const keys = ["showProfileLinks", "showProfileShoutouts", "showProfileTopics", "showProfileHighlights", "showProfileArchive", "showPinnedPosts"] as const;
type VisibilityKey = typeof keys[number];

export default function ProfileVisibilitySettings({ profile, language }: { profile: Visibility; language: "de" | "en" }) {
  const de = language === "de";
  const [visibility, setVisibility] = useState<Record<VisibilityKey, boolean>>({
    showProfileLinks: profile.showProfileLinks !== false,
    showProfileShoutouts: profile.showProfileShoutouts !== false,
    showProfileTopics: profile.showProfileTopics !== false,
    showProfileHighlights: profile.showProfileHighlights !== false,
    showProfileArchive: profile.showProfileArchive !== false,
    showPinnedPosts: profile.showPinnedPosts !== false,
  });
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"saved" | "failed" | null>(null);
  const entries: Array<{ key: VisibilityKey; en: string; de: string; hintEn: string; hintDe: string }> = [
    { key: "showProfileLinks", en: "Profile links", de: "Profil-Links", hintEn: "Links below your introduction", hintDe: "Links unter deiner Vorstellung" },
    { key: "showProfileShoutouts", en: "Shoutouts", de: "Shoutouts", hintEn: "Your featured people", hintDe: "Deine hervorgehobenen Personen" },
    { key: "showPinnedPosts", en: "Pinned posts", de: "Angepinnte Beiträge", hintEn: "Posts highlighted above your feed", hintDe: "Beiträge oberhalb deines Feeds" },
    { key: "showProfileHighlights", en: "Highlights", de: "Highlights", hintEn: "The Highlights profile tab", hintDe: "Der Profil-Tab Highlights" },
    { key: "showProfileTopics", en: "Topics", de: "Themen", hintEn: "The Topics profile tab", hintDe: "Der Profil-Tab Themen" },
    { key: "showProfileArchive", en: "Archive", de: "Archiv", hintEn: "The private Archive profile tab", hintDe: "Der private Profil-Tab Archiv" },
  ];
  const save = (next: Record<VisibilityKey, boolean>) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        keys.forEach((key) => formData.set(key, String(next[key])));
        await updateProfileSectionVisibility(formData);
        setFeedback("saved");
      } catch {
        setFeedback("failed");
      }
    });
  };
  const toggle = (key: VisibilityKey, checked: boolean) => {
    const next = { ...visibility, [key]: checked };
    setVisibility(next);
    save(next);
  };

  return <section className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700/80 dark:bg-slate-900/30">
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"><Eye size={18} /></span>
      <div><h3 className="font-semibold text-slate-900 dark:text-white">{de ? "Sichtbarkeit im Profil" : "Profile visibility"}</h3><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{de ? "Wähle, welche optionalen Bereiche Besucher auf deinem Profil sehen. Deine Inhalte bleiben erhalten." : "Choose which optional areas visitors can see on your profile. Your content stays intact."}</p></div>
    </div>
    <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
      {entries.map((entry) => <div key={entry.key} className="flex items-center justify-between gap-3 px-3 py-3"><div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{de ? entry.de : entry.en}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{de ? entry.hintDe : entry.hintEn}</p></div><Switch checked={visibility[entry.key]} onCheckedChange={(checked) => toggle(entry.key, checked)} disabled={isPending} aria-label={de ? `${entry.de} sichtbar` : `${entry.en} visible`} /></div>)}
    </div>
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/25"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"><Eye size={14} />{de ? "Vorschau für Besucher" : "Visitor preview"}</div><div className="mt-2 flex flex-wrap gap-2">{entries.filter((entry) => visibility[entry.key]).map((entry) => <span key={entry.key} className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{de ? entry.de : entry.en}</span>)}{entries.every((entry) => !visibility[entry.key]) && <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><EyeOff size={14} />{de ? "Nur Beiträge bleiben sichtbar." : "Only posts remain visible."}</span>}</div></div>
    <p aria-live="polite" className={`mt-3 text-xs font-medium ${feedback === "failed" ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>{isPending ? <span className="inline-flex items-center gap-1"><LoaderCircle size={13} className="animate-spin" />{de ? "Wird gespeichert..." : "Saving..."}</span> : feedback === "saved" ? (de ? "Gespeichert." : "Saved.") : feedback === "failed" ? (de ? "Konnte nicht gespeichert werden. Bitte erneut versuchen." : "Could not save. Please try again.") : ""}</p>
  </section>;
}
