"use client";

import { ImageUp, Moon, UserRound } from "lucide-react";
import { Switch } from "@radix-ui/themes";
import type { Profile } from "@prisma/client";
import { upsertProfile } from "@/actions";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

import defaultImg from "./default.jpg";

type SettingsFormProps = {
  profile: Profile | null;
};

export default function SettingsForm({ profile }: SettingsFormProps) {
  const fileInRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile?.avatar ?? null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
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
    <form action={upsertProfile} className="space-y-5 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-5 lg:space-y-0">
      <section className="flex flex-col items-center gap-4 border-b border-slate-200 pb-7 dark:border-slate-700/80 lg:row-span-3 lg:self-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
        <div className="size-44 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30">
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
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-wait disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-orange-400 dark:hover:text-orange-300"
          >
            <ImageUp size={17} />
            {isUploading ? "Uploading..." : "Change avatar"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">JPG, PNG or WEBP</p>
        </div>
      </section>

      <section className="lg:col-start-2">
        <div className="mb-4 flex items-center gap-2">
          <UserRound size={17} className="text-orange-500" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Profile details</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Username
            <input
              name="username"
              defaultValue={profile?.username ?? ""}
              placeholder="your_username"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Display name
            <input
              name="name"
              defaultValue={profile?.name ?? ""}
              placeholder="John Doe"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15"
            />
          </label>
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Subtitle
          <input
            name="subtitle"
            defaultValue={profile?.subtitle ?? ""}
            placeholder="Graphic designer"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15"
          />
        </label>

        <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Bio
          <textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            placeholder="Tell people a little about yourself"
            rows={4}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/15"
          />
        </label>
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60 lg:col-start-2">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Moon size={17} /></span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Dark mode</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Use VIBE with a darker color scheme</p>
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

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-700/80 sm:flex-row sm:items-center sm:justify-between lg:col-start-2">
        <LanguageSwitcher />
        <button
          type="submit"
          disabled={isUploading}
          className="self-end rounded-xl bg-linear-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] hover:shadow-xl disabled:cursor-wait disabled:opacity-60 sm:self-auto"
        >
          Save Settings
        </button>
      </div>
    </form>
  );
}
