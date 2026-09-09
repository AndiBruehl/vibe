"use client";

import { useEffect } from "react";

const german: Record<string, string> = {
  Home: "Startseite", Activity: "Aktivität", Search: "Suche", Create: "Erstellen", Browse: "Entdecken", Messages: "Nachrichten", Profile: "Profil", Profiles: "Profile",
  "Profile Settings": "Profileinstellungen", Account: "Konto", "Sign out": "Abmelden", "Back to Profile": "Zurück zum Profil", "Dark mode": "Dunkelmodus", "Save Settings": "Einstellungen speichern",
  "Profile details": "Profildetails", Username: "Benutzername", "Display name": "Anzeigename", Subtitle: "Untertitel", Bio: "Über mich",
  "Get the app": "App herunterladen", "Latest uploaded desktop and mobile builds.": "Neueste Desktop- und Mobilversionen.", Windows: "Windows", Android: "Android",
  "Download Setup EXE": "Setup-EXE herunterladen", "Download APK": "APK herunterladen", "No release available": "Keine Version verfügbar", Unavailable: "Nicht verfügbar", "Checking for a release…": "Suche nach Version…",
  "Create a post": "Beitrag erstellen", "Sort posts": "Beiträge sortieren", "Newest to oldest": "Neueste zuerst", "Oldest to newest": "Älteste zuerst", "A to Z": "A bis Z", "Z to A": "Z bis A",
  "Write a comment...": "Kommentar schreiben...", "Post Comment": "Kommentar veröffentlichen", "No comments yet. Be the first to join the conversation.": "Noch keine Kommentare. Starte die Unterhaltung.",
  "Search users and posts...": "Nutzer und Beiträge suchen...", "Find people and discover their vibes.": "Finde Menschen und entdecke ihre Vibes.", "Clear search": "Suche löschen", "No posts yet.": "Noch keine Beiträge.",
};

function translate(root: ParentNode, enabled: boolean) {
  if (!enabled) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    const value = node.nodeValue?.trim() ?? "";
    if (german[value]) node.nodeValue = node.nodeValue!.replace(value, german[value]);
  });
  root.querySelectorAll<HTMLElement>("[placeholder],[title],[aria-label]").forEach((element) => {
    ["placeholder", "title", "aria-label"].forEach((name) => {
      const value = element.getAttribute(name);
      if (value && german[value]) element.setAttribute(name, german[value]);
    });
  });
}

export default function LanguageRuntime({ initialLanguage }: { initialLanguage: "en" | "de" }) {
  useEffect(() => {
    const apply = () => {
      const saved = localStorage.getItem("vibe-language");
      const active = (saved ?? initialLanguage) === "de";
      if (!saved) localStorage.setItem("vibe-language", initialLanguage);
      document.documentElement.lang = active ? "de" : "en";
      // A page reload restores original server text before applying the selected language.
      if (active) translate(document.body, true);
    };
    apply();
    const observer = new MutationObserver(() => translate(document.body, localStorage.getItem("vibe-language") === "de"));
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("vibe-language-change", () => window.location.reload());
    return () => observer.disconnect();
  }, [initialLanguage]);
  return null;
}
