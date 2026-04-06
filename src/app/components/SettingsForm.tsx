"use client";

import { ImageUp } from "lucide-react";
import { Button, Switch, TextArea, TextField } from "@radix-ui/themes";
import type { Profile } from "@prisma/client";
import { upsertProfile } from "@/actions";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

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
    <form action={upsertProfile}>
      <div className="flex items-center gap-3">
        <div className="size-24 overflow-hidden rounded-full border-2 border-slate-600 bg-slate-400 shadow-lg shadow-slate-900">
          <img
            src={avatarSrc}
            alt="Avatar"
            className="h-full w-full cursor-pointer object-cover"
            onClick={() => fileInRef.current?.click()}
          />
        </div>

        <div>
          <input
            ref={fileInRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <input type="hidden" name="avatarUrl" value={avatarUrl} />

          <Button
            variant="surface"
            type="button"
            onClick={() => fileInRef.current?.click()}
            disabled={isUploading}
          >
            <ImageUp />
            {isUploading ? "Uploading..." : "Change avatar"}
          </Button>
        </div>
      </div>

      <p className="mt-2 font-bold">username</p>
      <TextField.Root
        name="username"
        defaultValue={profile?.username ?? ""}
        placeholder="your_username"
        className="mb-4"
      />

      <p className="mt-2 font-bold">name</p>
      <TextField.Root
        name="name"
        defaultValue={profile?.name ?? ""}
        placeholder="John Doe"
        className="mb-4"
      />

      <p className="mt-2 font-bold">subtitle</p>
      <TextField.Root
        name="subtitle"
        defaultValue={profile?.subtitle ?? ""}
        placeholder="graphic designer"
        className="mb-4"
      />

      <p className="mt-2 font-bold">bio</p>
      <TextArea
        name="bio"
        defaultValue={profile?.bio ?? ""}
        placeholder="your_description"
        className="mb-4"
      />

      <label className="mt-2 flex items-center gap-2">
        <span>Dark mode</span>
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
      </label>

      <div className="mt-2 flex justify-center">
        <Button type="submit" variant="solid" disabled={isUploading}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
