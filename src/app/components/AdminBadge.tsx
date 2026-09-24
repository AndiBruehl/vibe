 "use client";
import { useState } from "react";
import { Award, BadgeCheck, Shield, Sparkles, Star } from "lucide-react";
import { CURATED_PROFILE_BADGES, parseCustomProfileBadge } from "@/profile-badges";

export default function AdminBadge({ isAdmin, isVerified, badges = [], hiddenBadges = [], showCurated = false }: { isAdmin?: boolean | null; isVerified?: boolean | null; badges?: string[] | null; hiddenBadges?: string[] | null; showCurated?: boolean }) {
  // MongoDB documents created before 0.1.75 may not have either array yet.
  // Invalid legacy values are treated as empty instead of breaking a name row.
  const assigned = Array.isArray(badges) ? badges : [];
  const hidden = Array.isArray(hiddenBadges) ? hiddenBadges : [];
  const visibleBadges = showCurated ? CURATED_PROFILE_BADGES.filter((badge) => assigned.includes(badge.key) && !hidden.includes(badge.key)) : [];
  const customBadges = showCurated ? assigned.map(parseCustomProfileBadge).filter((badge): badge is NonNullable<typeof badge> => Boolean(badge)) : [];
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!isAdmin && !isVerified && !visibleBadges.length && !customBadges.length) return null;
  const icon = (key: string) => key === "early-member" ? <Sparkles size={11} /> : key === "community-star" ? <Star size={11} /> : <Award size={11} />;
  return <span className="inline-flex max-w-full shrink-0 flex-wrap items-center gap-1" aria-label={[isAdmin && "Administrator", isVerified && "Verified", ...visibleBadges.map((badge) => badge.label)].filter(Boolean).join(", ")}>
    {isAdmin ? <span title="ADMIN" className="inline-flex items-center gap-1 rounded-full border border-orange-400/60 bg-orange-50 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-200"><Shield size={11} />ADMIN</span> : null}
    {isVerified ? <span title="VERIFIED" className="inline-flex items-center gap-1 rounded-full border border-sky-400/60 bg-sky-50 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"><BadgeCheck size={12} />VERIFIED</span> : null}
    {(visibleBadges.length || customBadges.length) ? <span className="basis-full flex max-w-full flex-wrap items-center gap-1.5 pt-0.5">{visibleBadges.map((badge) => <span key={badge.key} className="relative inline-flex"><button type="button" title={badge.label} aria-label={badge.label} aria-expanded={expanded === badge.key} onClick={() => setExpanded((current) => current === badge.key ? null : badge.key)} className="inline-flex size-7 items-center justify-center rounded-full border border-violet-400/60 bg-violet-50 text-violet-700 transition hover:scale-105 hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:bg-violet-500/25">{icon(badge.key)}</button>{expanded === badge.key ? <span role="status" className="absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-violet-300/60 bg-white px-2 py-1 text-[10px] font-black text-violet-800 shadow-lg dark:bg-slate-900 dark:text-violet-100">{badge.label}</span> : null}</span>)}{customBadges.map((badge) => <button key={badge.id} type="button" title={badge.label} className="vibe-custom-profile-badge inline-flex size-7 items-center justify-center rounded-full border border-fuchsia-400/60 bg-fuchsia-50 p-0 text-sm dark:bg-fuchsia-500/15">{badge.icon}</button>)}</span> : null}
  </span>;
}
