import { Heart } from "lucide-react";
import Link from "next/link";

type Shoutout = { id: string; label: string; targetProfile: { username: string | null; name: string | null; avatar: string | null } };

export default function ProfileShoutouts({ shoutouts, language, centered = false }: { shoutouts: Shoutout[]; language: "en" | "de"; centered?: boolean }) {
  const heading = language === "de" ? "Shoutouts" : "Shoutouts";
  return <section className={`mt-4 ${centered ? "text-center" : ""}`}><p className={`mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-pink-600 dark:text-pink-300 ${centered ? "justify-center" : ""}`}><Heart size={13} fill="currentColor" />{heading}</p><div className={`flex flex-wrap gap-2 ${centered ? "justify-center" : ""}`}>{shoutouts.filter((shoutout) => shoutout.targetProfile.username).map((shoutout) => <Link key={shoutout.id} href={`/profile/${encodeURIComponent(shoutout.targetProfile.username!)}`} className="inline-flex items-center gap-2 rounded-full border border-pink-300 bg-pink-50 px-2.5 py-1.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-100 dark:border-pink-400/40 dark:bg-pink-500/10 dark:text-pink-200 dark:hover:bg-pink-500/20">{shoutout.targetProfile.avatar ? <img src={shoutout.targetProfile.avatar} alt="" className="size-5 rounded-full object-cover" /> : <Heart size={14} fill="currentColor" />}<span>{shoutout.label}: @{shoutout.targetProfile.username}</span></Link>)}</div></section>;
}
