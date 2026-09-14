import { Sparkles } from "lucide-react";

export default function VibeTeamBadge({ isSystem }: { isSystem?: boolean | null }) {
  if (!isSystem) return null;
  return <span title="VIBE TEAM" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-400/70 bg-linear-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 px-1.5 py-0.5 text-[10px] font-black tracking-wide text-cyan-700 dark:text-cyan-200"><Sparkles size={11} />VIBE TEAM</span>;
}
