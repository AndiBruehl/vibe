import { Award } from "lucide-react";
import { PROFILE_MILESTONES } from "@/profile-milestone-data";

export default function ProfileMilestones({ milestones, hiddenMilestones, language, centered = false }: { milestones?: string[] | null; hiddenMilestones?: string[] | null; language: "de" | "en"; centered?: boolean | "mobile" }) {
  const earned = Array.isArray(milestones) ? milestones : [];
  const hidden = Array.isArray(hiddenMilestones) ? hiddenMilestones : [];
  const visible = PROFILE_MILESTONES.filter((item) => earned.includes(item.key) && !hidden.includes(item.key));
  if (!visible.length) return null;
  const centerClass = centered === true ? "justify-center" : centered === "mobile" ? "justify-center lg:justify-start" : "";
  return <section className={`mt-4 ${centered === true ? "text-center" : centered === "mobile" ? "text-center lg:text-left" : ""}`} aria-label={language === "de" ? "Meilensteine" : "Milestones"}><p className={`mb-2 flex items-center gap-1 text-[11px] font-black uppercase tracking-[.14em] text-emerald-700 dark:text-emerald-200 ${centerClass}`}><Award size={13}/>{language === "de" ? "Meilensteine" : "Milestones"}</p><div className={`flex flex-wrap gap-1.5 ${centerClass}`}>{visible.map((item) => <span key={item.key} title={item.criterion} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100"><Award size={12}/>{item.title}</span>)}</div></section>;
}
