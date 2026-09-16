"use client";

import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, BookmarkPlus, ImageUp, Link as LinkIcon, LoaderCircle, Lock, MonitorSmartphone, Moon, Pipette, Plus, ShieldCheck, SlidersHorizontal, Sun, Trash2, UserRound, X } from "lucide-react";
import { Switch } from "@radix-ui/themes";
import type { Profile } from "@prisma/client";
import { upsertProfile } from "@/actions";
import { startTransition, useEffect, useRef, useState, type ChangeEvent } from "react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import MentionTextarea from "@/app/components/MentionTextarea";
import ShoutoutEditor from "@/app/components/ShoutoutEditor";
import ReleaseDownloads from "@/app/components/ReleaseDownloads";
import AppVersion from "@/app/components/AppVersion";
import { applyTheme, type ThemePreference } from "@/app/components/ProfileThemeRuntime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AVATAR_ACCENT_PRESETS, AVATAR_FRAME_DIRECTIONS, AVATAR_FRAME_GRADIENTS, DEFAULT_AVATAR_ACCENT, DEFAULT_PROFILE_ACCENT, avatarFrameConfig, avatarFrameStyle, normalizeAvatarAccent, normalizeProfileAccent, normalizeProfileHeaderLayout, type ProfileHeaderLayout } from "@/profile-personalization";

import defaultImg from "./default.jpg";

type SettingsFormProps = {
  profile: (Profile & { profileLinks?: { id: string; label: string; url: string }[]; shoutouts?: { id: string; label: string; targetProfile: { id: string; username: string | null; name: string | null; avatar: string | null } }[]; framePresets?: { id: string; startColor: string; endColor: string; direction: string; position: number }[] }) | null;
};

type EditableProfileLink = { id: string; label: string; url: string };

export default function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter();
  const fileInRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile?.avatar ?? null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar ?? "");
  const initialFrame = avatarFrameConfig(profile?.avatarAccent, profile?.avatarAccentEnd, profile?.avatarAccentDirection);
  const [avatarAccent, setAvatarAccent] = useState(initialFrame.start);
  const [avatarAccentEnd, setAvatarAccentEnd] = useState<string | null>(initialFrame.end);
  const [avatarAccentDirection, setAvatarAccentDirection] = useState(initialFrame.direction);
  const [profileAccent, setProfileAccent] = useState(profile?.profileAccent ?? DEFAULT_PROFILE_ACCENT);
  const [isSavingProfileAccent, setIsSavingProfileAccent] = useState(false);
  const [profileHeaderLayout, setProfileHeaderLayout] = useState<ProfileHeaderLayout>(normalizeProfileHeaderLayout(profile?.profileHeaderLayout));
  const [isSavingHeaderLayout, setIsSavingHeaderLayout] = useState(false);
  const [isSavingAccent, setIsSavingAccent] = useState(false);
  const [framePresets, setFramePresets] = useState(profile?.framePresets ?? []);
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
      startTransition(() => router.refresh());
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

  async function updateAvatarAccent(next: string, end: string | null = avatarAccentEnd, direction = avatarAccentDirection) {
    if (next === avatarAccent && end === avatarAccentEnd && direction === avatarAccentDirection || isSavingAccent) return;
    const previous = { accent: avatarAccent, end: avatarAccentEnd, direction: avatarAccentDirection };
    const accent = normalizeAvatarAccent(next);
    setAvatarAccent(accent);
    setAvatarAccentEnd(end);
    setAvatarAccentDirection(direction);
    setIsSavingAccent(true);
    setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/avatar-accent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarAccent: accent, avatarAccentEnd: end, avatarAccentDirection: direction }),
      });
      if (!response.ok) throw new Error("Avatar frame could not be saved");
      setSaveFeedback("saved");
      window.setTimeout(() => setSaveFeedback(null), 2500);
    } catch {
      setAvatarAccent(previous.accent);
      setAvatarAccentEnd(previous.end);
      setAvatarAccentDirection(previous.direction);
      setSaveFeedback("failed");
    } finally {
      setIsSavingAccent(false);
    }
  }

  async function updateProfileAccent(next: string) {
    const accent = normalizeProfileAccent(next);
    if (accent === profileAccent || isSavingProfileAccent) return;
    const previous = profileAccent;
    setProfileAccent(accent);
    setIsSavingProfileAccent(true);
    setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/accent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileAccent: accent }) });
      if (!response.ok) throw new Error("Profile accent could not be saved");
      setSaveFeedback("saved");
      window.setTimeout(() => setSaveFeedback(null), 2500);
    } catch {
      setProfileAccent(previous);
      setSaveFeedback("failed");
    } finally {
      setIsSavingProfileAccent(false);
    }
  }

  async function updateProfileHeaderLayout(next: ProfileHeaderLayout) {
    if (next === profileHeaderLayout || isSavingHeaderLayout) return;
    const previous = profileHeaderLayout;
    setProfileHeaderLayout(next);
    setIsSavingHeaderLayout(true);
    setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/header-layout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileHeaderLayout: next }) });
      if (!response.ok) throw new Error("Profile header layout could not be saved");
      setSaveFeedback("saved");
      window.setTimeout(() => setSaveFeedback(null), 2500);
    } catch {
      setProfileHeaderLayout(previous);
      setSaveFeedback("failed");
    } finally {
      setIsSavingHeaderLayout(false);
    }
  }

  async function saveFramePreset() {
    if (!avatarAccentEnd || framePresets.length >= 3) return;
    const response = await fetch("/api/profile/avatar-frame-presets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startColor: avatarAccent, endColor: avatarAccentEnd, direction: avatarAccentDirection }) });
    if (!response.ok) { setSaveFeedback("failed"); return; }
    const { preset } = await response.json();
    setFramePresets((current) => [...current, preset]);
    setSaveFeedback("saved");
  }

  async function deleteFramePreset(id: string) {
    await fetch(`/api/profile/avatar-frame-presets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setFramePresets((current) => current.filter((preset) => preset.id !== id));
  }

  return (
    <form action={saveProfile} onChange={(event) => { if (event.target instanceof HTMLInputElement && event.target.type === "color") return; setIsDirty(true); }} className="space-y-5">
      <nav className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label={copy("Settings sections", "Einstellungsbereiche")}>
        <button type="button" onClick={() => setActiveTab("profile")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "profile" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><UserRound size={16} />{copy("Profile", "Profil")}</button>
        <button type="button" onClick={() => setActiveTab("preferences")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "preferences" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><SlidersHorizontal size={16} />{copy("Appearance & privacy", "Darstellung & Privatsphäre")}</button>
        <button type="button" onClick={() => setActiveTab("account")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "account" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><ShieldCheck size={16} />{copy("Account & app", "Konto & App")}</button>
      </nav>
      <div className={activeTab === "profile" ? "flex flex-col gap-5 lg:flex-row lg:items-start" : "hidden"}>
      <section className="flex flex-col items-center gap-3 border-b border-slate-200 pb-5 dark:border-slate-700/80 lg:w-40 lg:shrink-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
        <div className="size-32 shrink-0 rounded-full p-1 shadow-lg shadow-slate-900/15 dark:shadow-black/30" style={avatarFrameStyle(avatarAccent, avatarAccentEnd, avatarAccentDirection)}>
          <div className="size-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><img
            src={avatarSrc}
            alt="Avatar"
            className="h-full w-full cursor-pointer object-cover"
            onClick={() => fileInRef.current?.click()}
          /></div>
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
          <input type="hidden" name="avatarAccent" value={avatarAccent} />
          <input type="hidden" name="avatarAccentEnd" value={avatarAccentEnd ?? ""} />
          <input type="hidden" name="avatarAccentDirection" value={avatarAccentDirection} />
          <input type="hidden" name="profileAccent" value={profileAccent} />
          <input type="hidden" name="profileHeaderLayout" value={profileHeaderLayout} />

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

      <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="mb-3 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Pipette size={17} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{copy("Profile personalization", "Profil-Personalisierung")}</p><p className="text-xs text-slate-500 dark:text-slate-400">{copy("Avatar frame and link accent", "Avatar-Rahmen und Link-Akzent")}</p></div></div>
        <div className="mb-4 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700/80 dark:bg-slate-900/30"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{copy("Profile header layout", "Profilkopf-Layout")}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy("Choose how your profile introduction is arranged.", "Wähle die Anordnung deiner Profilvorstellung.")}</p><div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800">{([{ value: "standard", label: copy("Standard", "Standard") }, { value: "compact", label: copy("Compact", "Kompakt") }, { value: "spotlight", label: copy("Spotlight", "Fokus") }] as const).map(({ value, label }) => <button key={value} type="button" onClick={() => void updateProfileHeaderLayout(value)} disabled={isSavingHeaderLayout} className={`rounded-lg px-2 py-2 transition disabled:cursor-wait disabled:opacity-60 ${profileHeaderLayout === value ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>{label}</button>)}</div><div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/80 dark:bg-slate-950/30"><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{copy("Preview", "Vorschau")}</p><div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">{profileHeaderLayout === "standard" ? <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_4rem] items-center gap-3"><span className="size-10 rounded-full bg-slate-300 dark:bg-slate-600" /><span className="space-y-2"><span className="block h-2.5 w-3/4 rounded bg-slate-300 dark:bg-slate-600" /><span className="block h-2 w-full rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-700" /></span><span className="grid grid-cols-3 gap-1"><i className="h-5 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-5 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-5 rounded bg-slate-300 dark:bg-slate-600" /></span></div> : profileHeaderLayout === "compact" ? <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-x-3 gap-y-3"><span className="space-y-2"><span className="block h-2.5 w-2/3 rounded bg-slate-300 dark:bg-slate-600" /><span className="block h-2 w-full rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-2 w-4/5 rounded bg-slate-200 dark:bg-slate-700" /></span><span className="size-10 self-center rounded-full bg-slate-300 dark:bg-slate-600" /><span className="col-span-2 grid grid-cols-3 gap-2 border-t border-slate-200 pt-2 dark:border-slate-700"><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /></span></div> : <div className="grid grid-cols-[minmax(0,1fr)_3.5rem] gap-x-3 gap-y-3"><span className="col-span-2 grid grid-cols-3 gap-2 border-b border-slate-200 pb-2 dark:border-slate-700"><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /></span><span className="space-y-2"><span className="block h-3 w-3/4 rounded bg-slate-300 dark:bg-slate-600" /><span className="block h-2 w-full rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-700" /></span><span className="size-14 self-center rounded-full bg-slate-300 dark:bg-slate-600" /></div>}</div></div></div>
        <div className="w-full border-t border-slate-200 pt-3 dark:border-slate-700/80">
          <p className="text-center text-xs font-semibold text-slate-700 dark:text-slate-200">{copy("Avatar frame", "Avatar-Rahmen")}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {AVATAR_ACCENT_PRESETS.map((color) => <button key={color} type="button" onClick={() => void updateAvatarAccent(color, null)} disabled={isSavingAccent} aria-label={`${copy("Use frame color", "Rahmenfarbe verwenden")}: ${color}`} className={`grid size-7 place-items-center rounded-full transition hover:scale-110 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${avatarAccent === color && !avatarAccentEnd ? "ring-2 ring-slate-700 ring-offset-2 dark:ring-slate-200 dark:ring-offset-slate-900" : ""}`} style={{ backgroundColor: color }}><span className="sr-only">{color}</span></button>)}
            {AVATAR_FRAME_GRADIENTS.map((gradient) => { const preset = avatarFrameConfig(gradient); return <button key={gradient} type="button" onClick={() => void updateAvatarAccent(preset.start, preset.end, preset.direction)} disabled={isSavingAccent} aria-label={gradient === "gradient-orange-yellow" ? copy("Orange to yellow gradient frame", "Orange-zu-Gelb-Verlaufsrahmen") : copy("Yellow to orange gradient frame", "Gelb-zu-Orange-Verlaufsrahmen")} className="grid size-7 place-items-center rounded-full transition hover:scale-110 disabled:cursor-wait disabled:opacity-60" style={avatarFrameStyle(preset.start, preset.end, preset.direction)}><span className="sr-only">{gradient}</span></button>})}
            <label className="relative grid size-7 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/70 text-white shadow-sm transition hover:scale-110 dark:border-slate-500" style={{ backgroundColor: avatarAccent }} title={copy("Choose first color", "Erste Farbe wählen")}>
              <Pipette size={14} aria-hidden="true" />
              <input type="color" value={avatarAccent} onChange={(event) => void updateAvatarAccent(event.target.value, avatarAccentEnd)} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={copy("Choose a custom frame color", "Eigene Rahmenfarbe wählen")} />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800"><button type="button" onClick={() => void updateAvatarAccent(avatarAccent, null)} className={`rounded-lg px-2 py-2 ${!avatarAccentEnd ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}>{copy("Single", "Einzelfarbe")}</button><button type="button" onClick={() => void updateAvatarAccent(avatarAccent, avatarAccentEnd ?? "#eab308")} className={`rounded-lg px-2 py-2 ${avatarAccentEnd ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}>{copy("Gradient", "Verlauf")}</button></div>
          {avatarAccentEnd && <div className="mt-3 space-y-3"><div className="grid grid-cols-2 gap-8"><label className="flex flex-col items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"><span>{copy("First color", "Erste Farbe")}</span><span className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/70 text-white shadow-sm transition hover:scale-110 dark:border-slate-500" style={{ backgroundColor: avatarAccent }}><Pipette size={15} aria-hidden="true" /><input type="color" value={avatarAccent} onChange={(event) => void updateAvatarAccent(event.target.value, avatarAccentEnd)} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={copy("Choose first gradient color", "Erste Verlaufsfarbe wählen")} /></span></label><label className="flex flex-col items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"><span>{copy("Second color", "Zweite Farbe")}</span><span className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/70 text-white shadow-sm transition hover:scale-110 dark:border-slate-500" style={{ backgroundColor: avatarAccentEnd }}><Pipette size={15} aria-hidden="true" /><input type="color" value={avatarAccentEnd} onChange={(event) => void updateAvatarAccent(avatarAccent, event.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={copy("Choose second gradient color", "Zweite Verlaufsfarbe wählen")} /></span></label></div><div className="grid grid-cols-4 gap-1">{AVATAR_FRAME_DIRECTIONS.map((direction) => { const Icon = ({ "to-bottom-right": ArrowDownRight, "to-bottom-left": ArrowDownLeft, "to-top-right": ArrowUpRight, "to-top-left": ArrowUpLeft } as const)[direction]; return <button key={direction} type="button" onClick={() => void updateAvatarAccent(avatarAccent, avatarAccentEnd, direction)} className={`grid place-items-center rounded-lg py-1.5 ${avatarAccentDirection === direction ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`} aria-label={direction}><Icon size={16} aria-hidden="true" /></button>; })}</div></div>}
          {framePresets.length > 0 && <div className="mt-3 space-y-1"><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{copy("Saved gradients", "Gespeicherte Verläufe")} · {framePresets.length}/3</p><div className="flex gap-3">{framePresets.map((preset) => <span key={preset.id} className="relative"><button type="button" onClick={() => void updateAvatarAccent(preset.startColor, preset.endColor, preset.direction)} className="size-10 rounded-full ring-1 ring-slate-300 ring-offset-2 transition hover:scale-110 dark:ring-slate-600 dark:ring-offset-slate-900" style={avatarFrameStyle(preset.startColor, preset.endColor, preset.direction)} aria-label={copy("Use saved gradient", "Gespeicherten Verlauf verwenden")} /><button type="button" onClick={() => void deleteFramePreset(preset.id)} className="absolute -right-4 -top-4 grid size-11 place-items-center text-red-600 transition hover:scale-110 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={copy("Delete saved gradient", "Gespeicherten Verlauf löschen")}><Trash2 size={16} /></button></span>)}</div></div>}
          {avatarAccentEnd && framePresets.length < 3 && <button type="button" onClick={() => void saveFramePreset()} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-300"><BookmarkPlus size={14} />{copy("Save gradient", "Verlauf speichern")}</button>}
          {(avatarAccent !== DEFAULT_AVATAR_ACCENT || avatarAccentEnd) && <button type="button" onClick={() => void updateAvatarAccent(DEFAULT_AVATAR_ACCENT, null, "to-bottom-right")} disabled={isSavingAccent} className="mt-2 w-full text-xs font-semibold text-slate-500 transition hover:text-orange-600 disabled:opacity-60 dark:text-slate-400 dark:hover:text-orange-300">{copy("Reset frame", "Rahmen zurücksetzen")}</button>}
          <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700/80">
            <p className="text-center text-xs font-semibold text-slate-700 dark:text-slate-200">{copy("Profile accent", "Profil-Akzent")}</p>
            <label className="mx-auto mt-2 flex w-fit items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/70 text-white shadow-sm dark:border-slate-500" style={{ backgroundColor: profileAccent }}><Pipette size={15} aria-hidden="true" /><input type="color" value={profileAccent} onChange={(event) => void updateProfileAccent(event.target.value)} disabled={isSavingProfileAccent} className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-wait" aria-label={copy("Choose profile accent", "Profil-Akzent wählen")} /></span>
              {copy("Profile links", "Profil-Links")}
            </label>
            {profileAccent !== DEFAULT_PROFILE_ACCENT && <button type="button" onClick={() => void updateProfileAccent(DEFAULT_PROFILE_ACCENT)} disabled={isSavingProfileAccent} className="mt-2 w-full text-xs font-semibold text-slate-500 transition hover:text-orange-600 disabled:cursor-wait disabled:opacity-60 dark:text-slate-400 dark:hover:text-orange-300">{copy("Reset accent", "Akzent zurücksetzen")}</button>}
          </div>
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
          data-no-auto-spinner="true"
          disabled={isUploading || isSaving || !isDirty}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] hover:shadow-xl disabled:cursor-wait disabled:opacity-60"
        >
          {isSaving ? <><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />{copy("Saving...", "Wird gespeichert...")}</> : copy("Save Settings", "Einstellungen speichern")}
        </button>
      </div>
    </form>
  );
}
