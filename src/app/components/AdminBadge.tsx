import { BadgeCheck, Shield } from "lucide-react";

export default function AdminBadge({ isAdmin, isVerified }: { isAdmin?: boolean | null; isVerified?: boolean | null }) {
  if (!isAdmin && !isVerified) return null;
  return <span className="inline-flex shrink-0 flex-wrap items-center gap-1" aria-label={[isAdmin && "Administrator", isVerified && "Verified"].filter(Boolean).join(", ")}>
    {isAdmin ? <span title="ADMIN" className="inline-flex items-center gap-1 rounded-full border border-orange-400/60 bg-orange-50 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-200"><Shield size={11} />ADMIN</span> : null}
    {isVerified ? <span title="VERIFIED" className="inline-flex items-center gap-1 rounded-full border border-sky-400/60 bg-sky-50 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"><BadgeCheck size={12} />VERIFIED</span> : null}
  </span>;
}
