"use client";

import { ImageUp, Link as LinkIcon, Lock, MonitorSmartphone, Moon, Plus, ShieldCheck, SlidersHorizontal, Sun, Trash2, UserRound } from "lucide-react";
import { Switch } from "@radix-ui/themes";
import type { Profile } from "@prisma/client";
import { upsertProfile } from "@/actions";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import MentionTextarea from "@/app/components/MentionTextarea";
import ShoutoutEditor from "@/app/components/ShoutoutEditor";
import ReleaseDownloads from "@/app/components/ReleaseDownloads";
import AppVersion from "@/app/components/AppVersion";
import { applyTheme, type ThemePreference } from "@/app/components/ProfileThemeRuntime";
import Link from "next/link";

import defaultImg from "./default.jpg";

type SettingsFormProps = {
  profile: (Profile & { profileLinks?: { id: string; label: string; url: string }[]; shoutouts?: { id: string; label: string; targetProfile: { id: string; username: string | null; name: string | null; avatar: string | null } }[] }) | null;
};

type EditableProfileLink = { id: string; label: string; url: string };

export default function SettingsForm({ profile }: SettingsFormProps) {
  const fileInRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile?.avatar ?? null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<"saved" | "failed" | null>(null);
  const [themePreference, setThemePreference] = useState<ThemePreference>(profile?.theme === "light" || profile?.theme === "dark" ? profile.theme : "system");
  const [isPrivate, setIsPrivate] = useState(profile?.isPrivate ?? false);
  const [language, setLanguage] = useState<"en" | "de">("en");
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "account">("profile");
  const [profileLinks, setProfileLinks] = useState<EditableProfileLink[]>(
    profile?.profileLinks?.map((link) => ({ id: link.id, label: link.label, url: link.url })) ?? [],
  );
  const de = language === "de";
  const copy = (english: string, german: string) => de ? german : english;

  useEffect(() => {
    setLanguage(localStorage.getItem("vibe-language") === "de" ? "de" : "en");
    const preference: ThemePreference = profile?.theme === "light" || profile?.theme === "dark" ? profile.theme : "system";
    setThemePreference(preference);
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    const data = new FormData();
    data.set("file", file);

    try {
      setIsUploading(true);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const result = await res.json();
      setAvatarUrl(result.url);
      setIsDirty(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const avatarSrc = previewUrl || profile?.avatar || defaultImg.src;

  async function saveProfile(formData: FormData) {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      await upsertProfile(formData);
      setIsDirty(false);
      setSaveFeedback("saved");
      window.setTimeout(() => setSaveFeedback(null), 2500);
    } catch {
      setSaveFeedback("failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateTheme(next: ThemePreference) {
    if (next === themePreference) return;
    const previous = themePreference;
    setThemePreference(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
    try {
      const response = await fetch("/api/profile/theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: next }) });
      if (!response.ok) throw new Error("Theme could not be saved");
      setSaveFeedback("saved");
    } catch {
      setThemePreference(previous);
      localStorage.setItem("theme", previous);
      applyTheme(previous);
      setSaveFeedback("failed");
    }
    window.setTimeout(() => setSaveFeedback(null), 2500);
  }

  return (
    <form action={saveProfile} onChange={() => setIsDirty(true)} className="space-y-5">
      <nav className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label={copy("Settings sections", "Einstellungsbereiche")}>
        <button type="button" onClick={() => setActiveTab("profile")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "profile" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><UserRound size={16} />{copy("Profile", "Profil")}</button>
        <button type="button" onClick={() => setActiveTab("preferences")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "preferences" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><SlidersHorizontal size={16} />{copy("Appearance & privacy", "Darstellung & Privatsphäre")}</button>
        <button type="button" onClick={() => setActiveTab("account")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "account" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><ShieldCheck size={16} />{copy("Account & app", "Konto & App")}</button>
      </nav>
      <div className={activeTab === "profile" ? "flex flex-col gap-5 lg:flex-row lg:items-start" : "hidden"}>
      <section className="flex flex-col items-center gap-3 border-b border-slate-200 pb-5 dark:border-slate-700/80 lg:w-40 lg:shrink-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
        <div className="size-32 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30">
          <img
            src={avatarSrc}
            alt="Avatar"
            className="h-full w-full cursor-pointer object-cover"
            onClick={() => fileInRef.current?.click()}
          />
        </div>

        <div className="text-center sm:text-left">
          <input
            ref={fileInRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <input type="hidden" name="avatarUrl" value={avatarUrl} />

          <button
            type="button"
            onClick={() => fileInRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-orange-400 dark:hover:text-orange-300"
          >
            <ImageUp size={17} />
            {isUploading ? copy("Uploading...", "Wird hochgeladen...") : copy("Change avatar", "Avatar ändern")}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">{copy("JPG, PNG or WEBP", "JPG, PNG oder WEBP")}</p>
        </div>
      </section>

      <section className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-2">
          <UserRound size={17} className="text-orange-500" />
          <h2 className="font-semibold text-slate-900 dark:text-white">{copy("Profile details", "Profildetails")}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {copy("Username", "Benutzername")}
            <input
              data-emoji-disabled="true"
              name="username"
              defaultValue={profile?.username ?? ""}
              placeholder="your_username"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {copy("Display name", "Anzeigename")}
            <input
              name="name"
              defaultValue={profile?.name ?? ""}
              placeholder="John Doe"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15"
            />
          </label>
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {copy("Subtitle", "Untertitel")}
          <input
            name="subtitle"
            defaultValue={profile?.subtitle ?? ""}
            placeholder="Graphic designer"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15"
          />
        </label>

        <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {copy("Bio", "Über mich")}
          <MentionTextarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            placeholder="Tell people a little about yourself"
            rows={4}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15"
          />
        </label>

        <details className="group mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-800/30">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 marker:content-none dark:text-slate-200">
            <span className="flex items-center gap-2"><LinkIcon size={16} className="text-orange-500" />{copy("Profile links", "Profil-Links")}</span>
            <span className="text-xs font-medium text-slate-500 group-open:hidden dark:text-slate-400">{profileLinks.length ? `${profileLinks.length}/5` : copy("Optional", "Optional")}</span>
            <span className="hidden text-xs font-medium text-slate-500 group-open:inline dark:text-slate-400">{copy("Hide", "Schließen")}</span>
          </summary>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700/80">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{copy("Give each link a label and destination. Up to five links.", "Gib jedem Link einen Text und ein Ziel. Bis zu fünf Links.")}</p>
            </div>
            <button
              type="button"
              disabled={profileLinks.length >= 5}
               onClick={() => { setProfileLinks((links) => [...links, { id: crypto.randomUUID(), label: "", url: "" }]); setIsDirty(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-400/60 dark:text-orange-300 dark:hover:bg-orange-400/10"
            >
              <Plus size={15} /> {copy("Add link", "Link hinzufügen")}
            </button>
          </div>

          {profileLinks.length > 0 && (
            <div className="mt-4 space-y-3">
              {profileLinks.map((link, index) => (
                <div key={link.id} className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]">
                  <input name="linkLabel" value={link.label} maxLength={80} onChange={(event) => setProfileLinks((links) => links.map((current, currentIndex) => currentIndex === index ? { ...current, label: event.target.value } : current))} placeholder={copy("Link text, e.g. My portfolio", "Linktext, z. B. Mein Portfolio")} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15" />
                  <input name="linkUrl" type="url" value={link.url} maxLength={2048} onChange={(event) => setProfileLinks((links) => links.map((current, currentIndex) => currentIndex === index ? { ...current, url: event.target.value } : current))} placeholder="https://example.com" className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15" />
                   <button type="button" onClick={() => { setProfileLinks((links) => links.filter((_, currentIndex) => currentIndex !== index)); setIsDirty(true); }} className="inline-grid size-10 place-items-center self-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300" aria-label={copy("Remove link", "Link entfernen")}>
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </details>
        <ShoutoutEditor shoutouts={profile?.shoutouts ?? []} language={language} />
      </section>
      </div>

      <div className={activeTab === "preferences" ? "space-y-3" : "hidden"}>
      <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><MonitorSmartphone size={17} /></span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{copy("Theme", "Thema")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy("Choose a color scheme for VIBE", "Wähle ein Farbschema für VIBE")}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {([
            { value: "light" as const, label: copy("Light", "Hell"), Icon: Sun },
            { value: "dark" as const, label: copy("Dark", "Dunkel"), Icon: Moon },
            { value: "system" as const, label: copy("System", "System"), Icon: MonitorSmartphone },
          ]).map(({ value, label, Icon }) => <button key={value} type="button" onClick={() => void updateTheme(value)} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition ${themePreference === value ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}><Icon size={14} />{label}</button>)}
        </div>
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Lock size={17} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{copy("Private profile", "Privates Profil")}</p><p className="text-xs text-slate-500 dark:text-slate-400">{copy("Approve follow requests before people can see your posts", "Bestätige Follow-Anfragen, bevor Nutzer deine Beiträge sehen")}</p></div></div>
        <input type="hidden" name="isPrivate" value={isPrivate ? "true" : "false"} />
        <Switch checked={isPrivate} onCheckedChange={(next) => { setIsPrivate(next); setIsDirty(true); }} />
      </section>

      <LanguageSwitcher onLanguageChange={setLanguage} />

      </div>
      <div className={activeTab === "account" ? "space-y-3" : "hidden"}>
        <details className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-800/30">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 marker:content-none dark:text-slate-200">{copy("Safety & blocked users", "Sicherheit & blockierte Nutzer")}</summary>
          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700/80"><Link href="/settings/blocked" className="inline-flex text-sm font-semibold text-orange-600 hover:underline">{copy("Manage blocked users", "Blockierte Nutzer verwalten")}</Link></div>
        </details>
        <details className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-800/30">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 marker:content-none dark:text-slate-200">{copy("Apps & downloads", "Apps & Downloads")}</summary>
          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700/80"><ReleaseDownloads /></div>
        </details>
        <AppVersion />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700/80">
        {saveFeedback && <p role="status" className={`text-sm font-semibold ${saveFeedback === "saved" ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}`}>{saveFeedback === "saved" ? copy("Settings saved", "Einstellungen gespeichert") : copy("Could not save settings", "Einstellungen konnten nicht gespeichert werden")}</p>}
        <button
          type="submit"
          disabled={isUploading || isSaving || !isDirty}
          className="rounded-xl bg-linear-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] hover:shadow-xl disabled:cursor-wait disabled:opacity-60"
        >
          {isSaving ? copy("Saving...", "Wird gespeichert...") : copy("Save Settings", "Einstellungen speichern")}
        </button>
      </div>
    </form>
  );
}
