import { Shield } from "lucide-react";

export default function AdminBadge({ isAdmin }: { isAdmin?: boolean | null }) {
  if (!isAdmin) return null;
  return <span title="ADMIN" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-orange-400/60 bg-orange-50 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-200"><Shield size={11} />ADMIN</span>;
}
