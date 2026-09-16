import { Heart } from "lucide-react";
import Link from "next/link";

type Shoutout = { id: string; label: string; targetProfile: { username: string | null; name: string | null; avatar: string | null } };

export default function ProfileShoutouts({ shoutouts, language, centered = false, accent }: { shoutouts: Shoutout[]; language: "en" | "de"; centered?: boolean | "mobile"; accent?: string | null }) {
  const heading = language === "de" ? "Shoutouts" : "Shoutouts";
  const centerClass = centered === true ? "justify-center" : centered === "mobile" ? "justify-center lg:justify-start" : "";
  return <section className={`mt-4 ${centered === true ? "text-center" : centered === "mobile" ? "text-center lg:text-left" : ""}`}><p className={`mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${centerClass}`} style={{ color: accent ?? "#ec4899" }}><Heart size={13} fill="currentColor" />{heading}</p><div className={`flex flex-wrap gap-2 ${centerClass}`}>{shoutouts.filter((shoutout) => shoutout.targetProfile.username).map((shoutout) => <Link key={shoutout.id} href={`/profile/${encodeURIComponent(shoutout.targetProfile.username!)}`} className="inline-flex items-center gap-2 rounded-full border bg-slate-50 px-2.5 py-1.5 text-sm font-semibold transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10" style={{ borderColor: accent ?? "#ec4899", color: accent ?? "#f9a8d4" }}>{shoutout.targetProfile.avatar ? <img src={shoutout.targetProfile.avatar} alt="" className="size-5 rounded-full object-cover" /> : <Heart size={14} fill="currentColor" />}<span>{shoutout.label}: @{shoutout.targetProfile.username}</span></Link>)}</div></section>;
}
