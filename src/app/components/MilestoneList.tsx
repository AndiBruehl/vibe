"use client";
import { Switch } from "@radix-ui/themes";
import { useState, useTransition } from "react";
import { updateMilestoneVisibility } from "@/actions";
import { PROFILE_MILESTONES } from "@/profile-milestone-data";

export default function MilestoneList({ earned, hidden }: { earned: string[]; hidden: string[] }) {
  const [hiddenItems, setHiddenItems] = useState(hidden);
  const [pending, startTransition] = useTransition();
  const toggle = (key: string, show: boolean) => { const next = show ? hiddenItems.filter((item) => item !== key) : [...new Set([...hiddenItems, key])]; setHiddenItems(next); startTransition(async () => { const data = new FormData(); data.set("hidden", JSON.stringify(next)); try { await updateMilestoneVisibility(data); } catch { setHiddenItems(hiddenItems); } }); };
  return <div className="mt-5 space-y-3">{PROFILE_MILESTONES.map((item) => { const complete = earned.includes(item.key); const visible = !hiddenItems.includes(item.key); return <article key={item.key} className={`rounded-2xl border p-4 ${complete ? "border-emerald-400/50 bg-emerald-50/60 dark:bg-emerald-500/10" : "border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/30"}`}><div className="flex items-start justify-between gap-4"><div><p className="font-black text-slate-900 dark:text-white">{item.title}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.criterion}</p><p className={`mt-2 text-xs font-bold ${complete ? "text-emerald-700 dark:text-emerald-200" : "text-slate-500"}`}>{complete ? "ACHIEVED" : "NOT YET ACHIEVED"}</p></div><div className="flex flex-col items-end gap-1"><Switch checked={complete && visible} disabled={!complete || pending} onCheckedChange={(checked) => toggle(item.key, checked)} aria-label={`${item.title} visible`} /><span className="text-[10px] font-bold text-slate-500">{complete ? "VISIBLE" : "LOCKED"}</span></div></div></article>; })}</div>;
}
