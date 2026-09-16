import { Heart } from "lucide-react";
import Link from "next/link";

type Shoutout = { id: string; label: string; targetProfile: { username: string | null; name: string | null; avatar: string | null } };

export default function ProfileShoutouts({ shoutouts, language, centered = false }: { shoutouts: Shoutout[]; language: "en" | "de"; centered?: boolean | "mobile" }) {
  const heading = language === "de" ? "Shoutouts" : "Shoutouts";
  const centerClass = centered === true ? "justify-center" : centered === "mobile" ? "justify-center lg:justify-start" : "";
  return <section className={`mt-4 ${centered === true ? "text-center" : centered === "mobile" ? "text-center lg:text-left" : ""}`}><p className={`mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-violet-500 dark:text-violet-300 ${centerClass}`}><Heart size={13} fill="currentColor" />{heading}</p><div className={`flex flex-wrap gap-2 ${centerClass}`}>{shoutouts.filter((shoutout) => shoutout.targetProfile.username).map((shoutout) => <Link key={shoutout.id} href={`/profile/${encodeURIComponent(shoutout.targetProfile.username!)}`} className="inline-flex items-center gap-2 rounded-full border border-violet-400/80 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 dark:bg-white/5 dark:text-violet-200 dark:hover:bg-violet-500/10">{shoutout.targetProfile.avatar ? <img src={shoutout.targetProfile.avatar} alt="" className="size-5 rounded-full object-cover" /> : <Heart size={14} fill="currentColor" />}<span>{shoutout.label}: @{shoutout.targetProfile.username}</span></Link>)}</div></section>;
}
