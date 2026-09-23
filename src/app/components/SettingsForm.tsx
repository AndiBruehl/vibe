"use client";

import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, BookmarkPlus, Download, ImageUp, Link as LinkIcon, LoaderCircle, Lock, MonitorSmartphone, Moon, Pipette, Plus, Search, ShieldCheck, SlidersHorizontal, Sun, Trash2, Upload, UserRound, X } from "lucide-react";
import { Switch } from "@radix-ui/themes";
import type { Profile } from "@prisma/client";
import { upsertProfile } from "@/actions";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import MentionTextarea from "@/app/components/MentionTextarea";
import ShoutoutEditor from "@/app/components/ShoutoutEditor";
import ReleaseDownloads from "@/app/components/ReleaseDownloads";
import AppVersion from "@/app/components/AppVersion";
import ProfileVisibilitySettings from "@/app/components/ProfileVisibilitySettings";
import ProfileBadgeVisibility from "@/app/components/ProfileBadgeVisibility";
import { applyTheme, type ThemePreference } from "@/app/components/ProfileThemeRuntime";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AVATAR_ACCENT_PRESETS, AVATAR_FRAME_DIRECTIONS, AVATAR_FRAME_GRADIENTS, DEFAULT_AVATAR_ACCENT, DEFAULT_PROFILE_ACCENT, DEFAULT_PROFILE_HEADER_BACKGROUND_COLOR, avatarFrameConfig, avatarFrameStyle, normalizeAvatarAccent, normalizeProfileAccent, normalizeProfileHeaderBackgroundMode, normalizeProfileHeaderLayout, normalizeProfileHeaderTextColor, profileHeaderBackgroundStyle, type ProfileHeaderBackgroundMode, type ProfileHeaderLayout } from "@/profile-personalization";

import defaultImg from "./default.jpg";

type AppearancePreset = { id: string; name: string; avatarAccent: string; avatarAccentEnd: string | null; avatarAccentDirection: string; profileAccent: string; profileHeaderLayout: string; profileHeaderBackgroundMode: string; profileHeaderBackgroundImage: string | null; profileHeaderBackgroundColor: string; profileHeaderBackgroundEnd: string | null; profileHeaderTextColor: string; isDefault: boolean };

type SettingsFormProps = {
  profile: (Profile & { profileLinks?: { id: string; label: string; url: string }[]; shoutouts?: { id: string; label: string; targetProfile: { id: string; username: string | null; name: string | null; avatar: string | null } }[]; framePresets?: { id: string; startColor: string; endColor: string; direction: string; position: number }[]; appearancePresets?: AppearancePreset[] }) | null;
};

type EditableProfileLink = { id: string; label: string; url: string };

type SettingsTab = "profile" | "preferences" | "account";
type AppearanceSection = "general" | "profile";
type PersonalizationSection = "layout" | "background" | "avatar";

function settingsRoute(params: { get(name: string): string | null }) {
  const tab = params.get("tab");
  const section = params.get("section");
  if (tab === "account") return { tab: "account" as SettingsTab, appearance: "general" as AppearanceSection, personalization: "background" as PersonalizationSection };
  if (tab === "appearance") {
    if (section === "layout" || section === "background" || section === "avatar") return { tab: "preferences" as SettingsTab, appearance: "profile" as AppearanceSection, personalization: section as PersonalizationSection };
    return { tab: "preferences" as SettingsTab, appearance: "general" as AppearanceSection, personalization: "background" as PersonalizationSection };
  }
  return { tab: "profile" as SettingsTab, appearance: "general" as AppearanceSection, personalization: "background" as PersonalizationSection };
}

function settingsPath(tab: SettingsTab, appearance: AppearanceSection = "general", personalization: PersonalizationSection = "background") {
  if (tab === "account") return "/settings?tab=account";
  if (tab === "preferences") return appearance === "profile" ? `/settings?tab=appearance&section=${personalization}` : "/settings?tab=appearance&section=general";
  return "/settings?tab=profile";
}

export default function SettingsForm({ profile }: SettingsFormProps) {
  const searchParams = useSearchParams();
  const initialRoute = settingsRoute(searchParams);
  const fileInRef = useRef<HTMLInputElement>(null);
  const headerBackgroundFileRef = useRef<HTMLInputElement>(null);
  const appearanceImportRef = useRef<HTMLInputElement>(null);

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
  const [profileHeaderBackgroundMode, setProfileHeaderBackgroundMode] = useState<ProfileHeaderBackgroundMode>(normalizeProfileHeaderBackgroundMode(profile?.profileHeaderBackgroundMode));
  const [profileHeaderBackgroundImage, setProfileHeaderBackgroundImage] = useState(profile?.profileHeaderBackgroundImage ?? "");
  const [profileHeaderBackgroundColor, setProfileHeaderBackgroundColor] = useState(profile?.profileHeaderBackgroundColor ?? DEFAULT_PROFILE_HEADER_BACKGROUND_COLOR);
  const [profileHeaderBackgroundEnd, setProfileHeaderBackgroundEnd] = useState<string | null>(profile?.profileHeaderBackgroundEnd ?? null);
  const [profileHeaderTextColor, setProfileHeaderTextColor] = useState(normalizeProfileHeaderTextColor(profile?.profileHeaderTextColor));
  const [isSavingHeaderBackground, setIsSavingHeaderBackground] = useState(false);
  const [isUploadingHeaderBackground, setIsUploadingHeaderBackground] = useState(false);
  const [isSavingAccent, setIsSavingAccent] = useState(false);
  const [framePresets, setFramePresets] = useState(profile?.framePresets ?? []);
  const [appearancePresets, setAppearancePresets] = useState<AppearancePreset[]>(profile?.appearancePresets ?? []);
  const [appearancePresetName, setAppearancePresetName] = useState("");
  const [isSavingAppearancePreset, setIsSavingAppearancePreset] = useState(false);
  const [appearanceImportError, setAppearanceImportError] = useState<"invalid-json" | "unsupported" | "too-large" | "limit" | "unavailable" | null>(null);
  const [isApplyingAppearancePreset, setIsApplyingAppearancePreset] = useState(false);
  const [previewAppearancePreset, setPreviewAppearancePreset] = useState<AppearancePreset | null>(null);
  const [lastAppliedAppearance, setLastAppliedAppearance] = useState<{ appearance: Omit<AppearancePreset, "id" | "name" | "isDefault">; presetName: string } | null>(null);
  const [renamingAppearancePresetId, setRenamingAppearancePresetId] = useState<string | null>(null);
  const [renamingAppearancePresetName, setRenamingAppearancePresetName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<"saved" | "failed" | "import-failed" | null>(null);
  const [themePreference, setThemePreference] = useState<ThemePreference>(profile?.theme === "light" || profile?.theme === "dark" ? profile.theme : "system");
  const [isPrivate, setIsPrivate] = useState(profile?.isPrivate ?? false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    notificationLikes: profile?.notificationLikes ?? true,
    notificationComments: profile?.notificationComments ?? true,
    notificationMentions: profile?.notificationMentions ?? true,
    notificationFollowRequests: profile?.notificationFollowRequests ?? true,
    notificationAdmin: profile?.notificationAdmin ?? true,
  });
  const [isSavingNotificationPreferences, setIsSavingNotificationPreferences] = useState(false);
  const [language, setLanguage] = useState<"en" | "de">("en");
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialRoute.tab);
  const [activeAppearanceSection, setActiveAppearanceSection] = useState<AppearanceSection>(initialRoute.appearance);
  const [activePersonalizationSection, setActivePersonalizationSection] = useState<PersonalizationSection>(initialRoute.personalization);
  const [settingsSearch, setSettingsSearch] = useState("");
  const [profileLinks, setProfileLinks] = useState<EditableProfileLink[]>(
    profile?.profileLinks?.map((link) => ({ id: link.id, label: link.label, url: link.url })) ?? [],
  );
  const de = language === "de";
  const copy = (english: string, german: string) => de ? german : english;
  const appearanceImportErrorText = appearanceImportError === "invalid-json"
    ? copy("This JSON file is damaged or contains formatting errors.", "Diese JSON-Datei ist beschädigt oder enthält Formatierungsfehler.")
    : appearanceImportError === "unsupported"
      ? copy("This is not a compatible VIBE profile-look file.", "Das ist keine kompatible VIBE-Profil-Look-Datei.")
      : appearanceImportError === "too-large"
        ? copy("This JSON file is empty or too large. The limit is 100 KB.", "Diese JSON-Datei ist leer oder zu groß. Das Limit beträgt 100 KB.")
        : appearanceImportError === "limit"
          ? copy("You already have six saved profile looks. Remove one before importing.", "Du hast bereits sechs gespeicherte Profil-Looks. Entferne einen, bevor du importierst.")
          : copy("The look could not be imported right now. Please try again.", "Der Look konnte gerade nicht importiert werden. Bitte versuche es erneut.");
  const settingsSearchItems = [
    { id: "background", label: copy("Header background", "Header-Hintergrund"), hint: copy("Image, color and gradient", "Bild, Farbe und Verlauf"), tab: "preferences" as const, appearance: "profile" as const, personalization: "background" as const, terms: "background header image color gradient text hintergrund bild farbe verlauf text" },
    { id: "layout", label: copy("Profile header layout", "Profilkopf-Layout"), hint: copy("Standard, compact or spotlight", "Standard, kompakt oder Fokus"), tab: "preferences" as const, appearance: "profile" as const, personalization: "layout" as const, terms: "layout compact spotlight fokus profilkopf" },
    { id: "frame", label: copy("Profile image frame & accents", "Profilbildrahmen & Akzente"), hint: copy("Frame, gradients and link color", "Rahmen, Verläufe und Linkfarbe"), tab: "preferences" as const, appearance: "profile" as const, personalization: "avatar" as const, terms: "frame accent gradients rahmen akzent linkfarbe verlauf" },
    { id: "theme", label: copy("Theme", "Thema"), hint: copy("Light, dark or system", "Hell, dunkel oder System"), tab: "preferences" as const, appearance: "general" as const, terms: "theme light dark system thema hell dunkel" },
    { id: "language", label: copy("Language", "Sprache"), hint: copy("English or German", "Englisch oder Deutsch"), tab: "preferences" as const, appearance: "general" as const, terms: "language sprache english deutsch german" },
    { id: "blocked", label: copy("Blocked users", "Blockierte Nutzer"), hint: copy("Safety and blocked profiles", "Sicherheit und blockierte Profile"), tab: "account" as const, terms: "blocked block safety sicherheit blockiert" },
  ];
  const normalizedSettingsSearch = settingsSearch.trim().toLowerCase();
  const matchingSettings = normalizedSettingsSearch ? settingsSearchItems.filter((item) => `${item.label} ${item.hint} ${item.terms}`.toLowerCase().includes(normalizedSettingsSearch)).slice(0, 5) : [];
  function openSetting(item: typeof settingsSearchItems[number]) {
    setActiveTab(item.tab);
    if (item.tab === "preferences" && item.appearance && item.personalization) { setActiveAppearanceSection(item.appearance); setActivePersonalizationSection(item.personalization); }
    window.history.pushState(null, "", settingsPath(item.tab, item.appearance ?? "general", item.personalization ?? "background"));
    setSettingsSearch("");
  }

  function openSettingsSection(tab: SettingsTab, appearance: AppearanceSection = "general", personalization: PersonalizationSection = "background") {
    setActiveTab(tab); setActiveAppearanceSection(appearance); setActivePersonalizationSection(personalization);
    window.history.pushState(null, "", settingsPath(tab, appearance, personalization));
  }

  useEffect(() => {
    const route = settingsRoute(searchParams);
    setActiveTab(route.tab); setActiveAppearanceSection(route.appearance); setActivePersonalizationSection(route.personalization);
  }, [searchParams]);

  useEffect(() => {
    setLanguage(localStorage.getItem("vibe-language") === "de" ? "de" : "en");
    const preference: ThemePreference = profile?.theme === "light" || profile?.theme === "dark" ? profile.theme : "system";
    setThemePreference(preference);
  }, []);

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);
    setUploadError(null);

    const data = new FormData();
    data.set("file", file);

    try {
      setIsUploading(true);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof result.error === "string" ? result.error : copy("Upload failed. Check the file type and size.", "Upload fehlgeschlagen. Prüfe Dateityp und Dateigröße."));
      setAvatarUrl(result.url);
      setIsDirty(true);
    } catch (error) {
      console.error(error);
      setSaveFeedback("failed");
      setUploadError(error instanceof Error ? error.message : copy("The image could not be uploaded. Please try again.", "Das Bild konnte nicht hochgeladen werden. Bitte versuche es erneut."));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await uploadAvatar(e.target.files?.[0]);
    e.target.value = "";
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

  async function updateProfileHeaderBackground(nextMode: ProfileHeaderBackgroundMode, nextImage = profileHeaderBackgroundImage, nextColor = profileHeaderBackgroundColor, nextEnd = profileHeaderBackgroundEnd, nextTextColor = profileHeaderTextColor) {
    const previous = { mode: profileHeaderBackgroundMode, image: profileHeaderBackgroundImage, color: profileHeaderBackgroundColor, end: profileHeaderBackgroundEnd, textColor: profileHeaderTextColor };
    setProfileHeaderBackgroundMode(nextMode); setProfileHeaderBackgroundImage(nextImage); setProfileHeaderBackgroundColor(nextColor); setProfileHeaderBackgroundEnd(nextEnd); setProfileHeaderTextColor(nextTextColor); setIsSavingHeaderBackground(true); setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/header-background", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileHeaderBackgroundMode: nextMode, profileHeaderBackgroundImage: nextImage || null, profileHeaderBackgroundColor: nextColor, profileHeaderBackgroundEnd: nextEnd, profileHeaderTextColor: nextTextColor }) });
      if (!response.ok) throw new Error("Header background could not be saved");
      setSaveFeedback("saved"); window.setTimeout(() => setSaveFeedback(null), 2500);
    } catch {
      setProfileHeaderBackgroundMode(previous.mode); setProfileHeaderBackgroundImage(previous.image); setProfileHeaderBackgroundColor(previous.color); setProfileHeaderBackgroundEnd(previous.end); setProfileHeaderTextColor(previous.textColor); setSaveFeedback("failed");
    } finally { setIsSavingHeaderBackground(false); }
  }

  async function uploadHeaderBackgroundFile(file: File) {
    if (!file.type.startsWith("image/")) { setSaveFeedback("failed"); return; }
    const data = new FormData(); data.set("file", file); setIsUploadingHeaderBackground(true);
    try { const response = await fetch("/api/upload", { method: "POST", body: data }); if (!response.ok) throw new Error("Header image upload failed"); const { url } = await response.json(); await updateProfileHeaderBackground("image", url); }
    catch { setSaveFeedback("failed"); } finally { setIsUploadingHeaderBackground(false); }
  }

  function uploadHeaderBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadHeaderBackgroundFile(file);
  }

  function handleHeaderBackgroundDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file && !isUploadingHeaderBackground && !isSavingHeaderBackground) void uploadHeaderBackgroundFile(file);
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

  async function updateNotificationPreference(key: keyof typeof notificationPreferences, value: boolean) {
    if (isSavingNotificationPreferences) return;
    const previous = notificationPreferences;
    const next = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(next); setIsSavingNotificationPreferences(true); setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/notification-preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      if (!response.ok) throw new Error("Notification preferences could not be saved");
      setSaveFeedback("saved");
    } catch { setNotificationPreferences(previous); setSaveFeedback("failed"); } finally { setIsSavingNotificationPreferences(false); }
  }

  function currentAppearance() {
    return { avatarAccent, avatarAccentEnd, avatarAccentDirection, profileAccent, profileHeaderLayout, profileHeaderBackgroundMode, profileHeaderBackgroundImage: profileHeaderBackgroundImage || null, profileHeaderBackgroundColor, profileHeaderBackgroundEnd, profileHeaderTextColor };
  }

  function applyAppearanceToState(appearance: Omit<AppearancePreset, "id" | "name" | "isDefault">) {
    setAvatarAccent(normalizeAvatarAccent(appearance.avatarAccent));
    setAvatarAccentEnd(appearance.avatarAccentEnd);
    setAvatarAccentDirection(avatarFrameConfig(appearance.avatarAccent, appearance.avatarAccentEnd, appearance.avatarAccentDirection).direction);
    setProfileAccent(normalizeProfileAccent(appearance.profileAccent));
    setProfileHeaderLayout(normalizeProfileHeaderLayout(appearance.profileHeaderLayout));
    setProfileHeaderBackgroundMode(normalizeProfileHeaderBackgroundMode(appearance.profileHeaderBackgroundMode));
    setProfileHeaderBackgroundImage(appearance.profileHeaderBackgroundImage ?? "");
    setProfileHeaderBackgroundColor(appearance.profileHeaderBackgroundColor);
    setProfileHeaderBackgroundEnd(appearance.profileHeaderBackgroundEnd);
    setProfileHeaderTextColor(normalizeProfileHeaderTextColor(appearance.profileHeaderTextColor));
  }

  async function saveAppearancePreset() {
    const name = appearancePresetName.trim().replace(/\s+/g, " ");
    if (!name || isSavingAppearancePreset) return;
    setIsSavingAppearancePreset(true); setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/appearance-presets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, ...currentAppearance() }) });
      if (!response.ok) throw new Error("Could not save profile look");
      const { preset } = await response.json() as { preset: AppearancePreset };
      setAppearancePresets((current) => [preset, ...current.filter((item) => item.id !== preset.id)]);
      setAppearancePresetName(""); setSaveFeedback("saved");
    } catch { setSaveFeedback("failed"); } finally { setIsSavingAppearancePreset(false); }
  }

  async function applyAppearancePreset(preset: AppearancePreset) {
    if (isApplyingAppearancePreset) return;
    const previous = currentAppearance();
    applyAppearanceToState(preset); setIsApplyingAppearancePreset(true); setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/appearance-presets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ presetId: preset.id }) });
      if (!response.ok) throw new Error("Could not apply profile look");
      setLastAppliedAppearance({ appearance: previous, presetName: preset.name }); setSaveFeedback("saved");
    } catch { applyAppearanceToState(previous); setSaveFeedback("failed"); } finally { setIsApplyingAppearancePreset(false); }
  }

  async function resetAppearance() {
    if (isApplyingAppearancePreset) return;
    const previous = currentAppearance(); setIsApplyingAppearancePreset(true); setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/appearance-presets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset" }) });
      if (!response.ok) throw new Error("Could not reset profile look");
      const { appearance } = await response.json(); applyAppearanceToState(appearance); setSaveFeedback("saved");
    } catch { applyAppearanceToState(previous); setSaveFeedback("failed"); } finally { setIsApplyingAppearancePreset(false); }
  }

  async function deleteAppearancePreset(id: string) {
    const previous = appearancePresets; setAppearancePresets((current) => current.filter((preset) => preset.id !== id));
    try { const response = await fetch(`/api/profile/appearance-presets?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!response.ok) throw new Error("Could not delete profile look"); }
    catch { setAppearancePresets(previous); setSaveFeedback("failed"); }
  }

  async function undoAppearancePreset() {
    if (!lastAppliedAppearance || isApplyingAppearancePreset) return;
    const restoring = lastAppliedAppearance; setIsApplyingAppearancePreset(true); setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/appearance-presets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore", ...restoring.appearance }) });
      if (!response.ok) throw new Error("Could not restore profile look");
      applyAppearanceToState(restoring.appearance); setLastAppliedAppearance(null); setSaveFeedback("saved");
    } catch { setSaveFeedback("failed"); } finally { setIsApplyingAppearancePreset(false); }
  }

  async function renameAppearancePreset(preset: AppearancePreset) {
    const name = renamingAppearancePresetName.trim().replace(/\s+/g, " ");
    if (!name || isApplyingAppearancePreset) return;
    setIsApplyingAppearancePreset(true); setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/appearance-presets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "rename", presetId: preset.id, name }) });
      if (!response.ok) throw new Error("Could not rename profile look");
      const { preset: updated } = await response.json() as { preset: AppearancePreset };
      setAppearancePresets((current) => current.map((item) => item.id === updated.id ? updated : item)); setRenamingAppearancePresetId(null); setSaveFeedback("saved");
    } catch { setSaveFeedback("failed"); } finally { setIsApplyingAppearancePreset(false); }
  }

  async function setDefaultAppearancePreset(preset: AppearancePreset) {
    if (isApplyingAppearancePreset) return;
    setIsApplyingAppearancePreset(true); setSaveFeedback(null);
    try {
      const response = await fetch("/api/profile/appearance-presets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-default", presetId: preset.id }) });
      if (!response.ok) throw new Error("Could not set default profile look");
      setAppearancePresets((current) => current.map((item) => ({ ...item, isDefault: item.id === preset.id }))); setSaveFeedback("saved");
    } catch { setSaveFeedback("failed"); } finally { setIsApplyingAppearancePreset(false); }
  }

  function exportAppearancePreset(preset: AppearancePreset) {
    const payload = {
      format: "vibe-profile-look",
      version: 1,
      name: preset.name,
      appearance: {
        avatarAccent: preset.avatarAccent,
        avatarAccentEnd: preset.avatarAccentEnd,
        avatarAccentDirection: preset.avatarAccentDirection,
        profileAccent: preset.profileAccent,
        profileHeaderLayout: preset.profileHeaderLayout,
        profileHeaderBackgroundMode: preset.profileHeaderBackgroundMode,
        profileHeaderBackgroundImage: preset.profileHeaderBackgroundImage,
        profileHeaderBackgroundColor: preset.profileHeaderBackgroundColor,
        profileHeaderBackgroundEnd: preset.profileHeaderBackgroundEnd,
        profileHeaderTextColor: preset.profileHeaderTextColor,
      },
    };
    const fileName = `${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profile-look"}.vibe-look.json`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
  }

  async function importAppearancePreset(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isSavingAppearancePreset) return;
    setIsSavingAppearancePreset(true); setSaveFeedback(null); setAppearanceImportError(null);
    try {
      if (!file.name.toLowerCase().endsWith(".json")) throw new Error("unsupported");
      if (!file.size || file.size > 100_000) throw new Error("too-large");
      let data: unknown;
      try { data = JSON.parse(await file.text()); } catch { throw new Error("invalid-json"); }
      if (!data || typeof data !== "object") throw new Error("invalid-json");
      const imported = data as { format?: unknown; version?: unknown; name?: unknown; appearance?: unknown };
      if (imported.format !== "vibe-profile-look" || imported.version !== 1 || typeof imported.name !== "string" || !imported.appearance || typeof imported.appearance !== "object") throw new Error("unsupported");
      const name = imported.name.trim().replace(/\s+/g, " ").slice(0, 32);
      if (!name) throw new Error("invalid-json");
      const response = await fetch("/api/profile/appearance-presets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, ...(imported.appearance as Record<string, unknown>) }) });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: unknown } | null;
        if (typeof result?.error === "string" && result.error.includes("up to")) throw new Error("limit");
        throw new Error("unavailable");
      }
      const { preset } = await response.json() as { preset: AppearancePreset };
      setAppearancePresets((current) => [preset, ...current.filter((item) => item.id !== preset.id)]);
      setSaveFeedback("saved");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unavailable";
      setAppearanceImportError(reason === "invalid-json" || reason === "unsupported" || reason === "too-large" || reason === "limit" ? reason : "unavailable");
      setSaveFeedback("import-failed");
    } finally { setIsSavingAppearancePreset(false); }
  }

  return (
    <form action={saveProfile} onChange={(event) => { if (event.target instanceof HTMLInputElement && event.target.type === "color") return; setIsDirty(true); }} className="space-y-5">
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input value={settingsSearch} onChange={(event) => setSettingsSearch(event.target.value)} placeholder={copy("Search settings", "Einstellungen durchsuchen")} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900/30 dark:text-white dark:placeholder:text-slate-500" />
        {normalizedSettingsSearch && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{matchingSettings.length ? matchingSettings.map((item) => <button key={item.id} type="button" onClick={() => openSetting(item)} className="block w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-orange-50 dark:hover:bg-orange-500/10"><span className="block text-sm font-bold text-slate-800 dark:text-white">{item.label}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.hint}</span></button>) : <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">{copy("No settings found.", "Keine Einstellungen gefunden.")}</p>}</div>}
      </div>
      <nav className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label={copy("Settings sections", "Einstellungsbereiche")}>
        <button type="button" onClick={() => openSettingsSection("profile")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "profile" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><UserRound size={16} />{copy("Profile", "Profil")}</button>
        <button type="button" onClick={() => openSettingsSection("preferences")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "preferences" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><SlidersHorizontal size={16} />{copy("Appearance & privacy", "Darstellung & Privatsphäre")}</button>
        <button type="button" onClick={() => openSettingsSection("account")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === "account" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}><ShieldCheck size={16} />{copy("Account & app", "Konto & App")}</button>
      </nav>
      {activeTab === "profile" && <Link href="/milestones" className="mt-4 flex items-center justify-between rounded-2xl border border-violet-400/60 bg-linear-to-r from-violet-600 to-fuchsia-600 px-5 py-4 text-white no-underline shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:brightness-110"><span><span className="block text-xs font-black tracking-[.16em] text-white/75">VIBE MILESTONES</span><span className="mt-1 block text-base font-black">{copy("Your milestones", "Deine Meilensteine")}</span><span className="mt-0.5 block text-xs font-medium text-white/85">{copy("See goals, progress and badge visibility", "Ziele, Fortschritt und Badge-Sichtbarkeit ansehen")}</span></span><span className="text-2xl" aria-hidden="true">→</span></Link>}
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
          <input type="hidden" name="profileHeaderBackgroundMode" value={profileHeaderBackgroundMode} />
          <input type="hidden" name="profileHeaderBackgroundImage" value={profileHeaderBackgroundImage} />
          <input type="hidden" name="profileHeaderBackgroundColor" value={profileHeaderBackgroundColor} />
          <input type="hidden" name="profileHeaderBackgroundEnd" value={profileHeaderBackgroundEnd ?? ""} />
          <input type="hidden" name="profileHeaderTextColor" value={profileHeaderTextColor} />

          <div
            role="button"
            tabIndex={isUploading ? -1 : 0}
            onClick={() => fileInRef.current?.click()}
            onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !isUploading) { event.preventDefault(); fileInRef.current?.click(); } }}
            onDragEnter={(event) => { event.preventDefault(); if (!isUploading) setIsAvatarDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (event.currentTarget === event.target) setIsAvatarDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setIsAvatarDragging(false); void uploadAvatar(event.dataTransfer.files?.[0]); }}
            className={`flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${isAvatarDragging ? "border-orange-500 bg-orange-100/70 dark:bg-orange-500/20" : "border-slate-300 bg-white hover:border-orange-300 hover:bg-orange-50/70 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-orange-400 dark:hover:bg-orange-500/10"} ${isUploading ? "cursor-wait opacity-60" : ""}`}
          >
            <ImageUp size={19} className="text-orange-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{isUploading ? copy("Uploading...", "Wird hochgeladen...") : isAvatarDragging ? copy("Drop avatar here", "Profilbild hier ablegen") : copy("Change avatar", "Avatar ändern")}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{copy("Drag & drop or click · JPG, PNG, WebP, GIF or AVIF", "Ziehen & ablegen oder klicken · JPG, PNG, WebP, GIF oder AVIF")}</span>
          </div>
          {uploadError && <p role="alert" className="mt-2 max-w-xs text-xs font-semibold text-red-600 dark:text-red-300">{uploadError}</p>}
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">{copy("JPG, PNG, WEBP, GIF or AVIF · max. 25 MB", "JPG, PNG, WEBP, GIF oder AVIF · max. 25 MB")}</p>
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
            <span className="flex items-center gap-2"><LinkIcon size={16} className="text-orange-500" />{copy("Link color", "Linkfarbe")}</span>
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
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800"><button type="button" onClick={() => openSettingsSection("preferences", "general")} className={`rounded-lg px-3 py-2 transition ${activeAppearanceSection === "general" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}>{copy("General", "Allgemein")}</button><button type="button" onClick={() => openSettingsSection("preferences", "profile", "background")} className={`rounded-lg px-3 py-2 transition ${activeAppearanceSection === "profile" ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}>{copy("Profile look", "Profil-Look")}</button></div>
      <div className={activeAppearanceSection === "general" ? "space-y-3" : "hidden"}>
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

      <ProfileVisibilitySettings profile={profile ?? {}} language={language} />
      <ProfileBadgeVisibility badges={profile?.profileBadges ?? []} hiddenBadges={profile?.hiddenProfileBadges ?? []} language={language} />

      </div>
      <div className={activeAppearanceSection === "profile" ? "space-y-3" : "hidden"}>
      <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="mb-3 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Pipette size={17} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{copy("Profile personalization", "Profil-Personalisierung")}</p><p className="text-xs text-slate-500 dark:text-slate-400">{copy("Profile image frame and link accent", "Profilbildrahmen und Link-Akzent")}</p></div>
        <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800" role="tablist" aria-label={copy("Profile personalization sections", "Bereiche der Profil-Personalisierung")}>{([{ value: "background", label: copy("Background", "Hintergrund") }, { value: "layout", label: copy("Layout", "Layout") }, { value: "avatar", label: copy("Profile frame & accents", "Profilbildrahmen & Akzente") }] as const).map(({ value, label }) => <button key={value} type="button" role="tab" aria-selected={activePersonalizationSection === value} onClick={() => openSettingsSection("preferences", "profile", value)} className={`rounded-lg px-2 py-2.5 text-xs font-bold transition ${activePersonalizationSection === value ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>{label}</button>)}</div>
</div>
        <details open className={activePersonalizationSection === "layout" ? "group rounded-xl border border-slate-200 bg-white/60 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/20" : "hidden"}>
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-bold text-slate-800 marker:content-none dark:text-white"><span>{copy("Profile header layout", "Profilkopf-Layout")}</span><span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">⌄</span></summary>
          <div className="pt-3">
        <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700/80 dark:bg-slate-900/30"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{copy("Profile header layout", "Profilkopf-Layout")}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy("Choose how your profile introduction is arranged.", "Wähle die Anordnung deiner Profilvorstellung.")}</p><div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800">{([{ value: "standard", label: copy("Standard", "Standard") }, { value: "compact", label: copy("Compact", "Kompakt") }, { value: "spotlight", label: copy("Spotlight", "Fokus") }] as const).map(({ value, label }) => <button key={value} type="button" onClick={() => void updateProfileHeaderLayout(value)} disabled={isSavingHeaderLayout} className={`rounded-lg px-2 py-2 transition disabled:cursor-wait disabled:opacity-60 ${profileHeaderLayout === value ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>{label}</button>)}</div><div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/80 dark:bg-slate-950/30"><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{copy("Preview", "Vorschau")}</p><div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">{profileHeaderLayout === "standard" ? <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_4rem] items-center gap-3"><span className="size-10 rounded-full bg-slate-300 dark:bg-slate-600" /><span className="space-y-2"><span className="block h-2.5 w-3/4 rounded bg-slate-300 dark:bg-slate-600" /><span className="block h-2 w-full rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-700" /></span><span className="grid grid-cols-3 gap-1"><i className="h-5 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-5 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-5 rounded bg-slate-300 dark:bg-slate-600" /></span></div> : profileHeaderLayout === "compact" ? <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-x-3 gap-y-3"><span className="space-y-2"><span className="block h-2.5 w-2/3 rounded bg-slate-300 dark:bg-slate-600" /><span className="block h-2 w-full rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-2 w-4/5 rounded bg-slate-200 dark:bg-slate-700" /></span><span className="size-12 self-center rounded-full bg-slate-300 dark:bg-slate-600" /><span className="col-span-2 grid grid-cols-3 gap-2 border-t border-slate-200 pt-2 dark:border-slate-700"><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /></span></div> : <div className="flex flex-col items-center gap-3"><span className="size-14 rounded-full bg-slate-300 dark:bg-slate-600" /><span className="w-full max-w-48 space-y-2"><span className="mx-auto block h-3 w-3/4 rounded bg-slate-300 dark:bg-slate-600" /><span className="block h-2 w-full rounded bg-slate-200 dark:bg-slate-700" /><span className="mx-auto block h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-700" /></span><span className="grid w-full grid-cols-3 gap-2 border-t border-slate-200 pt-2 dark:border-slate-700"><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /><i className="h-4 rounded bg-slate-300 dark:bg-slate-600" /></span></div>}</div></div></div>
          </div>
        </details>
        <details open className={activePersonalizationSection === "background" ? "group rounded-xl border border-slate-200 bg-white/60 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/20" : "hidden"}>
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-bold text-slate-800 marker:content-none dark:text-white"><span>{copy("Header background", "Header-Hintergrund")}</span><span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">⌄</span></summary>
          <div className="pt-3">
        <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700/80 dark:bg-slate-900/30"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{copy("Header background", "Header-Hintergrund")}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy("Optional and visible on every device.", "Optional und auf allen Geräten sichtbar.")}</p><div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-800">{([{ value: "none", label: copy("None", "Nichts") }, { value: "image", label: copy("Image", "Bild") }, { value: "color", label: copy("Color / gradient", "Farbe / Verlauf") }] as const).map(({ value, label }) => <button key={value} type="button" disabled={isSavingHeaderBackground} onClick={() => void updateProfileHeaderBackground(value)} className={`rounded-lg px-2 py-2 transition disabled:opacity-60 ${profileHeaderBackgroundMode === value ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}>{label}</button>)}</div><div className="mt-3 min-h-20 rounded-lg border border-slate-200 bg-slate-100 bg-cover bg-center dark:border-slate-700 dark:bg-slate-800" style={profileHeaderBackgroundStyle(profileHeaderBackgroundMode, profileHeaderBackgroundImage, profileHeaderBackgroundColor, profileHeaderBackgroundEnd)} />{profileHeaderBackgroundMode === "image" && <div className="mt-3"><input ref={headerBackgroundFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={uploadHeaderBackground} /><div role="button" tabIndex={0} onClick={() => headerBackgroundFileRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); headerBackgroundFileRef.current?.click(); } }} onDragOver={(event) => event.preventDefault()} onDrop={handleHeaderBackgroundDrop} className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/60 px-4 py-4 text-center transition hover:border-orange-400 hover:bg-orange-100/70 dark:border-orange-400/50 dark:bg-orange-500/10 dark:hover:bg-orange-500/15"><ImageUp size={22} className="mb-2 text-orange-600 dark:text-orange-300" /><p className="text-sm font-bold text-slate-800 dark:text-white">{isUploadingHeaderBackground ? copy("Uploading header image...", "Headerbild wird hochgeladen...") : copy("Drop a header image here", "Headerbild hier ablegen")}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy("or click to choose · JPG, PNG, WebP, GIF or AVIF · max. 25 MB", "oder klicken zum Auswählen · JPG, PNG, WebP, GIF oder AVIF · max. 25 MB")}</p></div>{profileHeaderBackgroundImage && <button type="button" onClick={() => void updateProfileHeaderBackground("image", "")} disabled={isSavingHeaderBackground || isUploadingHeaderBackground} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-400/60 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"><X size={15} />{copy("Remove header image", "Headerbild entfernen")}</button>}</div>}{profileHeaderBackgroundMode === "color" && <div className="mt-3 grid grid-cols-2 gap-4"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{copy("First color", "Erste Farbe")}<span className="mt-1 flex items-center gap-2"><span className="relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/70" style={{ backgroundColor: profileHeaderBackgroundColor }}><Pipette size={15} className="text-white" /><input type="color" value={profileHeaderBackgroundColor} onChange={(event) => void updateProfileHeaderBackground("color", profileHeaderBackgroundImage, event.target.value, profileHeaderBackgroundEnd)} className="absolute inset-0 opacity-0" /></span></span></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{copy("Second color", "Zweite Farbe")}<span className="mt-1 flex items-center gap-2"><span className="relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/70" style={{ backgroundColor: profileHeaderBackgroundEnd ?? profileHeaderBackgroundColor }}><Pipette size={15} className="text-white" /><input type="color" value={profileHeaderBackgroundEnd ?? profileHeaderBackgroundColor} onChange={(event) => void updateProfileHeaderBackground("color", profileHeaderBackgroundImage, profileHeaderBackgroundColor, event.target.value)} className="absolute inset-0 opacity-0" /></span></span></label>{profileHeaderBackgroundEnd && <button type="button" onClick={() => void updateProfileHeaderBackground("color", profileHeaderBackgroundImage, profileHeaderBackgroundColor, null)} className="col-span-2 justify-self-start text-xs font-semibold text-slate-500 underline dark:text-slate-300">{copy("Use a single color", "Nur eine Farbe")}</button>}</div>}{profileHeaderBackgroundMode !== "none" && <><label className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200"><span><span className="block">{copy("Header text color", "Textfarbe im Header")}</span><span className="mt-0.5 block text-[11px] font-normal text-slate-500 dark:text-slate-400">{copy("For bright images and backgrounds", "Für helle Bilder und Hintergründe")}</span></span><span className="relative grid size-10 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: profileHeaderTextColor }}><Pipette size={16} className="text-white" /><input type="color" value={profileHeaderTextColor} onChange={(event) => void updateProfileHeaderBackground(profileHeaderBackgroundMode, profileHeaderBackgroundImage, profileHeaderBackgroundColor, profileHeaderBackgroundEnd, event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" /></span></label><button type="button" onClick={() => void updateProfileHeaderBackground(profileHeaderBackgroundMode, profileHeaderBackgroundImage, profileHeaderBackgroundColor, profileHeaderBackgroundEnd, "#ffffff")} disabled={profileHeaderTextColor === "#ffffff" || isSavingHeaderBackground} className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{copy("Reset text color", "Textfarbe zurücksetzen")}</button></>}</div>
          </div>
        </details>
        <details open className={activePersonalizationSection === "avatar" ? "group rounded-xl border border-slate-200 bg-white/60 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/20" : "hidden"}>
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-bold text-slate-800 marker:content-none dark:text-white"><span>{copy("Profile frame & accents", "Profilbildrahmen & Akzente")}</span><span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">⌄</span></summary>
          <div className="pt-3">
        <div className="w-full border-t border-slate-200 pt-3 dark:border-slate-700/80">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{copy("Avatar frame", "Avatar-Rahmen")}</p>
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
          {framePresets.length > 0 && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700/80 dark:bg-slate-950/25"><div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{copy("Saved gradients", "Gespeicherte Verläufe")}</p><span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{framePresets.length}/3</span></div><div className="mt-3 flex flex-wrap justify-center gap-4">{framePresets.map((preset) => <span key={preset.id} className="relative"><button type="button" onClick={() => void updateAvatarAccent(preset.startColor, preset.endColor, preset.direction)} className="size-12 rounded-full ring-2 ring-slate-300 ring-offset-2 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 dark:ring-slate-600 dark:ring-offset-slate-900" style={avatarFrameStyle(preset.startColor, preset.endColor, preset.direction)} aria-label={copy("Use saved gradient", "Gespeicherten Verlauf verwenden")} /><button type="button" onClick={() => void deleteFramePreset(preset.id)} className="absolute -right-4 -top-4 grid size-11 place-items-center text-red-600 transition hover:scale-110 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={copy("Delete saved gradient", "Gespeicherten Verlauf löschen")}><Trash2 size={14} /></button></span>)}</div></div>}
          {avatarAccentEnd && framePresets.length < 3 && <button type="button" onClick={() => void saveFramePreset()} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-orange-400/60 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 shadow-sm transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"><BookmarkPlus size={15} />{copy("Save gradient", "Verlauf speichern")}</button>}
          {(avatarAccent !== DEFAULT_AVATAR_ACCENT || avatarAccentEnd) && <button type="button" onClick={() => void updateAvatarAccent(DEFAULT_AVATAR_ACCENT, null, "to-bottom-right")} disabled={isSavingAccent} className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{copy("Reset frame", "Rahmen zurücksetzen")}</button>}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700/80 dark:bg-slate-950/25">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{copy("Profile accent", "Profil-Akzent")}</p>
            <label className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/70 text-white shadow-sm dark:border-slate-500" style={{ backgroundColor: profileAccent }}><Pipette size={15} aria-hidden="true" /><input type="color" value={profileAccent} onChange={(event) => void updateProfileAccent(event.target.value)} disabled={isSavingProfileAccent} className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-wait" aria-label={copy("Choose profile accent", "Profil-Akzent wählen")} /></span>
              {copy("Link color", "Linkfarbe")}
            </label>
            {profileAccent !== DEFAULT_PROFILE_ACCENT && <button type="button" onClick={() => void updateProfileAccent(DEFAULT_PROFILE_ACCENT)} disabled={isSavingProfileAccent} className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{copy("Reset accent", "Akzent zurücksetzen")}</button>}
          </div>
        </div>
          </div>
        </details>
        <section className="mt-4 rounded-xl border border-slate-200 bg-white/60 p-3 dark:border-slate-700/80 dark:bg-slate-900/20">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-bold text-slate-800 dark:text-white">{copy("Saved profile looks", "Gespeicherte Profil-Looks")}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy("Save your full header, frame and accent setup.", "Speichere deine komplette Header-, Rahmen- und Akzent-Einstellung.")}</p></div><span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{appearancePresets.length}/6</span></div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-3 text-white dark:border-slate-700" style={profileHeaderBackgroundStyle(profileHeaderBackgroundMode, profileHeaderBackgroundImage, profileHeaderBackgroundColor, profileHeaderBackgroundEnd)}>
            <div className="rounded-lg bg-slate-950/40 p-3 backdrop-blur-sm" style={{ color: profileHeaderTextColor }}><div className={`flex gap-3 ${profileHeaderLayout === "spotlight" ? "flex-col items-center text-center" : profileHeaderLayout === "compact" ? "flex-row-reverse items-start text-left" : "items-center text-left"}`}><span className="size-12 shrink-0 rounded-full p-0.5" style={avatarFrameStyle(avatarAccent, avatarAccentEnd, avatarAccentDirection)}><span className="block size-full rounded-full bg-slate-200" /></span><span className="min-w-0"><span className="block truncate text-sm font-bold">{profile?.name || copy("Your profile", "Dein Profil")}</span><span className="mt-1 block text-xs opacity-85">{copy("A compact public preview", "Kompakte öffentliche Vorschau")}</span></span></div></div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={appearancePresetName} maxLength={32} onChange={(event) => setAppearancePresetName(event.target.value)} placeholder={copy("Name this look", "Diesen Look benennen")} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" /><button type="button" onClick={() => void saveAppearancePreset()} disabled={!appearancePresetName.trim() || isSavingAppearancePreset} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-orange-400/60 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"><BookmarkPlus size={15} />{isSavingAppearancePreset ? copy("Saving...", "Wird gespeichert...") : copy("Save look", "Look speichern")}</button><input ref={appearanceImportRef} type="file" accept="application/json,.json" onChange={(event) => void importAppearancePreset(event)} className="sr-only" /><button type="button" onClick={() => appearanceImportRef.current?.click()} disabled={isSavingAppearancePreset || appearancePresets.length >= 6} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><Upload size={15} />{copy("Import JSON", "JSON importieren")}</button></div>
          {lastAppliedAppearance && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200"><span>{copy(`Applied ${lastAppliedAppearance.presetName}.`, `${lastAppliedAppearance.presetName} angewendet.`)}</span><button type="button" onClick={() => void undoAppearancePreset()} disabled={isApplyingAppearancePreset} className="rounded-md bg-emerald-700 px-2 py-1 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60">{copy("Undo", "Rückgängig")}</button></div>}
          {appearancePresets.length > 0 ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{appearancePresets.map((preset) => <div key={preset.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><div className="h-12 bg-cover bg-center" style={profileHeaderBackgroundStyle(preset.profileHeaderBackgroundMode, preset.profileHeaderBackgroundImage, preset.profileHeaderBackgroundColor, preset.profileHeaderBackgroundEnd)} /><div className="p-2"><div className="flex items-center gap-2"><span className="size-8 shrink-0 rounded-full p-0.5" style={avatarFrameStyle(preset.avatarAccent, preset.avatarAccentEnd, preset.avatarAccentDirection)}><span className="block size-full rounded-full bg-slate-300 dark:bg-slate-600" /></span>{renamingAppearancePresetId === preset.id ? <form onSubmit={(event) => { event.preventDefault(); void renameAppearancePreset(preset); }} className="flex min-w-0 flex-1 gap-1"><input autoFocus value={renamingAppearancePresetName} maxLength={32} onChange={(event) => setRenamingAppearancePresetName(event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" /><button className="rounded-md bg-slate-800 px-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">{copy("Save", "Speichern")}</button></form> : <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-white">{preset.name}{preset.isDefault && <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">{copy("Default", "Standard")}</span>}</p>}<button type="button" onClick={() => { setRenamingAppearancePresetId(preset.id); setRenamingAppearancePresetName(preset.name); }} className="text-xs font-bold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300">{copy("Rename", "Umbenennen")}</button></div><div className="mt-2 flex flex-wrap gap-1.5"><button type="button" onClick={() => setPreviewAppearancePreset(preset)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-600 transition hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">{copy("Preview", "Vorschau")}</button><button type="button" onClick={() => void applyAppearancePreset(preset)} disabled={isApplyingAppearancePreset} className="rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">{copy("Apply", "Anwenden")}</button><button type="button" onClick={() => void setDefaultAppearancePreset(preset)} disabled={isApplyingAppearancePreset || preset.isDefault} className="rounded-md border border-orange-400/60 px-2 py-1 text-xs font-bold text-orange-700 transition hover:bg-orange-50 disabled:opacity-50 dark:text-orange-300 dark:hover:bg-orange-500/10">{copy("Set default", "Als Standard")}</button><button type="button" onClick={() => exportAppearancePreset(preset)} className="inline-flex items-center gap-1 rounded-md border border-cyan-400/60 px-2 py-1 text-xs font-bold text-cyan-700 transition hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-cyan-500/10"><Download size={13} />{copy("Export", "Exportieren")}</button><button type="button" onClick={() => void deleteAppearancePreset(preset.id)} className="grid size-7 place-items-center rounded-md text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10" aria-label={copy("Delete saved look", "Gespeicherten Look löschen")}><Trash2 size={14} /></button></div></div></div>)}</div> : <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">{copy("Your saved profile looks will appear here.", "Deine gespeicherten Profil-Looks erscheinen hier.")}</p>}
          {previewAppearancePreset && <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-lg dark:border-slate-700" style={profileHeaderBackgroundStyle(previewAppearancePreset.profileHeaderBackgroundMode, previewAppearancePreset.profileHeaderBackgroundImage, previewAppearancePreset.profileHeaderBackgroundColor, previewAppearancePreset.profileHeaderBackgroundEnd)}><div className={`rounded-xl bg-slate-950/45 p-5 backdrop-blur-sm ${previewAppearancePreset.profileHeaderLayout === "spotlight" ? "mx-auto max-w-lg text-center" : previewAppearancePreset.profileHeaderLayout === "compact" ? "text-left" : "max-w-xl text-left"}`} style={{ color: previewAppearancePreset.profileHeaderTextColor }}><div className={`flex gap-4 ${previewAppearancePreset.profileHeaderLayout === "spotlight" ? "flex-col items-center" : previewAppearancePreset.profileHeaderLayout === "compact" ? "flex-row-reverse items-start" : "items-center"}`}><span className="size-20 shrink-0 rounded-full p-1" style={avatarFrameStyle(previewAppearancePreset.avatarAccent, previewAppearancePreset.avatarAccentEnd, previewAppearancePreset.avatarAccentDirection)}><span className="block size-full rounded-full bg-slate-200" /></span><div><p className="text-lg font-bold">{profile?.name || copy("Your profile", "Dein Profil")}</p><p className="mt-1 text-sm opacity-90">{copy("Public profile preview", "Öffentliche Profilvorschau")}</p><p className="mt-3 text-xs opacity-80">{previewAppearancePreset.name} · {previewAppearancePreset.profileHeaderLayout}</p></div></div></div><button type="button" onClick={() => setPreviewAppearancePreset(null)} className="mt-3 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/25">{copy("Close preview", "Vorschau schließen")}</button></div>}
          <button type="button" onClick={() => void resetAppearance()} disabled={isApplyingAppearancePreset} className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{copy("Reset full profile look", "Kompletten Profil-Look zurücksetzen")}</button>
        </section>
      </section>
      </div>
      <div className={activeAppearanceSection === "general" ? "space-y-3" : "hidden"}>
      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"><Lock size={17} /></span><div><p className="font-semibold text-slate-900 dark:text-white">{copy("Private profile", "Privates Profil")}</p><p className="text-xs text-slate-500 dark:text-slate-400">{copy("Approve follow requests before people can see your posts", "Bestätige Follow-Anfragen, bevor Nutzer deine Beiträge sehen")}</p></div></div>
        <input type="hidden" name="isPrivate" value={isPrivate ? "true" : "false"} />
        <Switch checked={isPrivate} onCheckedChange={(next) => { setIsPrivate(next); setIsDirty(true); }} />
      </section>

      <LanguageSwitcher onLanguageChange={setLanguage} />

      </div>
      </div>
      <div className={activeTab === "account" ? "space-y-3" : "hidden"}>
        <details className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-800/30">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 marker:content-none dark:text-slate-200">{copy("Activity notifications", "Aktivitäts-Benachrichtigungen")}</summary>
          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700/80"><p className="text-xs text-slate-500 dark:text-slate-400">{copy("Choose what contributes to the activity counter and in-app activity notifications.", "Wähle, was zum Aktivitäts-Zähler und zu In-App-Aktivitätsbenachrichtigungen beiträgt.")}</p>{([
            ["notificationLikes", copy("Likes", "Likes")],
            ["notificationComments", copy("Comments and replies", "Kommentare und Antworten")],
            ["notificationMentions", copy("Mentions", "Erwähnungen")],
            ["notificationFollowRequests", copy("Follow requests", "Follow-Anfragen")],
            ["notificationAdmin", copy("Admin updates", "Admin-Hinweise")],
          ] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><span>{label}</span><Switch checked={notificationPreferences[key]} disabled={isSavingNotificationPreferences} onCheckedChange={(value) => void updateNotificationPreference(key, value)} /></label>)}</div>
        </details>
        <details className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-800/30">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 marker:content-none dark:text-slate-200">{copy("Safety & blocked users", "Sicherheit & blockierte Nutzer")}</summary>
          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700/80"><Link href="/settings/blocked" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-orange-400/60 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20">{copy("Manage blocked users", "Blockierte Nutzer verwalten")}</Link></div>
        </details>
        <details className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-800/30">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 marker:content-none dark:text-slate-200">{copy("Apps & downloads", "Apps & Downloads")}</summary>
          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700/80"><ReleaseDownloads /></div>
        </details>
        <AppVersion />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700/80">
        {saveFeedback && <p role="status" className={`text-sm font-semibold ${saveFeedback === "saved" ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}`}>{saveFeedback === "saved" ? copy("Settings saved", "Einstellungen gespeichert") : saveFeedback === "import-failed" ? appearanceImportErrorText : copy("Could not save settings", "Einstellungen konnten nicht gespeichert werden")}</p>}
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
