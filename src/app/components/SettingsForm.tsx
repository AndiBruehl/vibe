"use client";

import { ImageUp, Link as LinkIcon, Lock, Moon, Plus, Trash2, UserRound } from "lucide-react";
import { Switch } from "@radix-ui/themes";
import type { Profile } from "@prisma/client";
import { upsertProfile } from "@/actions";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import MentionTextarea from "@/app/components/MentionTextarea";
import ShoutoutEditor from "@/app/components/ShoutoutEditor";

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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPrivate, setIsPrivate] = useState(profile?.isPrivate ?? false);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [language, setLanguage] = useState<"en" | "de">("en");
  const [profileLinks, setProfileLinks] = useState<EditableProfileLink[]>(
    profile?.profileLinks?.map((link) => ({ id: link.id, label: link.label, url: link.url })) ?? [],
  );
  const de = language === "de";
  const copy = (english: string, german: string) => de ? german : english;

  useEffect(() => {
    setLanguage(localStorage.getItem("vibe-language") === "de" ? "de" : "en");
    const html = document.documentElement;
    const savedTheme = localStorage.getItem("theme");

    if (!savedTheme) {
      localStorage.setItem("theme", "dark");
      html.classList.remove("light", "dark");
      html.classList.add("dark");
      html.dataset.theme = "dark";
      setIsDarkMode(true);
    } else {
      const isDark = savedTheme === "dark";
      html.classList.remove("light", "dark");
      html.classList.add(isDark ? "dark" : "light");
      html.dataset.theme = isDark ? "dark" : "light";
      setIsDarkMode(isDark);
    }

    setIsThemeReady(true);
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const avatarSrc = previewUrl || profile?.avatar || defaultImg.src;

  return (
    <form action={upsertProfile} className="space-y-5 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-x-5 lg:gap-y-5 lg:space-y-0">
      <section className="flex flex-col items-center gap-3 border-b border-slate-200 pb-5 dark:border-slate-700/80 lg:row-span-3 lg:self-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
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

      <section className="lg:col-start-2">
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

        <section className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <LinkIcon size={16} className="text-orange-500" />
                {copy("Profile links", "Profil-Links")}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy("Give each link a label and destination. Up to five links.", "Gib jedem Link einen Text und ein Ziel. Bis zu fünf Links.")}</p>
            </div>
            <button
              type="button"
              disabled={profileLinks.length >= 5}
              onClick={() => setProfileLinks((links) => [...links, { id: crypto.randomUUID(), label: "", url: "" }])}
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
                  <button type="button" onClick={() => setProfileLinks((links) => links.filter((_, currentIndex) => currentIndex !== index))} className="inline-grid size-10 place-items-center self-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300" aria-label={copy("Remove link", "Link entfernen")}>
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        <ShoutoutEditor shoutouts={profile?.shoutouts ?? []} language={language} />
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60 lg:col-start-2">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Moon size={17} /></span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{copy("Dark mode", "Dunkelmodus")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy("Use VIBE with a darker color scheme", "Nutze VIBE mit einem dunkleren Farbschema")}</p>
          </div>
        </div>
        <Switch
          checked={isDarkMode}
          disabled={!isThemeReady}
          onCheckedChange={(nextChecked) => {
            setIsDarkMode(nextChecked);

            const html = document.documentElement;
            const theme = nextChecked ? "dark" : "light";

            html.classList.remove("light", "dark");
            html.classList.add(theme);
            html.dataset.theme = theme;

            localStorage.setItem("theme", theme);
          }}
        />
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60 lg:col-start-2">
        <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Lock size={17} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{copy("Private profile", "Privates Profil")}</p><p className="text-xs text-slate-500 dark:text-slate-400">{copy("Approve follow requests before people can see your posts", "Bestätige Follow-Anfragen, bevor Nutzer deine Beiträge sehen")}</p></div></div>
        <input type="hidden" name="isPrivate" value={isPrivate ? "true" : "false"} />
        <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-700/80 sm:flex-row sm:items-center sm:justify-between lg:col-start-2">
        <LanguageSwitcher onLanguageChange={setLanguage} />
        <button
          type="submit"
          disabled={isUploading}
          className="self-end rounded-xl bg-linear-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] hover:shadow-xl disabled:cursor-wait disabled:opacity-60 sm:self-auto"
        >
          {copy("Save Settings", "Einstellungen speichern")}
        </button>
      </div>
    </form>
  );
}
