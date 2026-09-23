"use client";

import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@radix-ui/themes";
import { useState, useTransition } from "react";
import { updateProfileBadgeVisibility } from "@/actions";
import { CURATED_PROFILE_BADGES } from "@/profile-badges";

export default function ProfileBadgeVisibility({ badges, hiddenBadges, language }: { badges: string[] | null | undefined; hiddenBadges: string[] | null | undefined; language: "de" | "en" }) {
  const de = language === "de";
  const assigned = Array.isArray(badges) ? badges : [];
  const [hidden, setHidden] = useState(() => Array.isArray(hiddenBadges) ? hiddenBadges.filter((badge) => assigned.includes(badge)) : []);
  const [isPending, startTransition] = useTransition();
  const [saveFailed, setSaveFailed] = useState(false);
  if (!assigned.length) return null;
  const toggle = (badge: string, visible: boolean) => {
    const next = visible ? hidden.filter((item) => item !== badge) : [...new Set([...hidden, badge])];
    setHidden(next);
    setSaveFailed(false);
    startTransition(async () => { try { const formData = new FormData(); formData.set("hiddenBadges", JSON.stringify(next)); await updateProfileBadgeVisibility(formData); } catch { setHidden(hidden); setSaveFailed(true); } });
  };
  return <section className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700/80 dark:bg-slate-900/30"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"><Eye size={18}/></span><div><h3 className="font-semibold text-slate-900 dark:text-white">{de ? "Badge-Sichtbarkeit" : "Badge visibility"}</h3><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{de ? "Blende dir verliehene Badges auf deinem öffentlichen Profil ein oder aus." : "Show or hide badges awarded to you on your public profile."}</p></div></div><div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">{CURATED_PROFILE_BADGES.filter((badge) => assigned.includes(badge.key)).map((badge) => { const visible = !hidden.includes(badge.key); return <div key={badge.key} className="flex items-center justify-between px-3 py-2.5"><span className="text-xs font-black text-violet-700 dark:text-violet-200">{badge.label}</span><Switch checked={visible} disabled={isPending} onCheckedChange={(checked) => toggle(badge.key, checked)} aria-label={`${badge.label} ${visible ? "visible" : "hidden"}`}/></div>; })}</div>{hidden.length > 0 && <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500"><EyeOff size={13}/>{de ? "Ausgeblendete Badges bleiben für dich gespeichert." : "Hidden badges remain assigned to you."}</p>}{saveFailed && <p role="alert" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">{de ? "Die Änderung konnte nicht gespeichert werden. Bitte versuche es erneut." : "The change could not be saved. Please try again."}</p>}</section>;
}
