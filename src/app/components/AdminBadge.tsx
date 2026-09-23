import { Award, BadgeCheck, Shield, Sparkles, Star } from "lucide-react";
import { CURATED_PROFILE_BADGES } from "@/profile-badges";

export default function AdminBadge({ isAdmin, isVerified, badges = [], hiddenBadges = [] }: { isAdmin?: boolean | null; isVerified?: boolean | null; badges?: string[] | null; hiddenBadges?: string[] | null }) {
  // MongoDB documents created before 0.1.75 may not have either array yet.
  // Invalid legacy values are treated as empty instead of breaking a name row.
  const assigned = Array.isArray(badges) ? badges : [];
  const hidden = Array.isArray(hiddenBadges) ? hiddenBadges : [];
  const visibleBadges = CURATED_PROFILE_BADGES.filter((badge) => assigned.includes(badge.key) && !hidden.includes(badge.key));
  if (!isAdmin && !isVerified && !visibleBadges.length) return null;
  const icon = (key: string) => key === "early-member" ? <Sparkles size={11} /> : key === "community-star" ? <Star size={11} /> : <Award size={11} />;
  return <span className="inline-flex shrink-0 flex-wrap items-center gap-1" aria-label={[isAdmin && "Administrator", isVerified && "Verified", ...visibleBadges.map((badge) => badge.label)].filter(Boolean).join(", ")}>
    {isAdmin ? <span title="ADMIN" className="inline-flex items-center gap-1 rounded-full border border-orange-400/60 bg-orange-50 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-200"><Shield size={11} />ADMIN</span> : null}
    {isVerified ? <span title="VERIFIED" className="inline-flex items-center gap-1 rounded-full border border-sky-400/60 bg-sky-50 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"><BadgeCheck size={12} />VERIFIED</span> : null}
    {visibleBadges.map((badge) => <span key={badge.key} title={badge.label} className="inline-flex items-center gap-1 rounded-full border border-violet-400/60 bg-violet-50 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">{icon(badge.key)}{badge.label}</span>)}
  </span>;
}
