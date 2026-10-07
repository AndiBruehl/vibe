import Link from "next/link";
import { MessageCircle, Sparkles, UserPlus } from "lucide-react";
import LocalizedText from "./LocalizedText";

type GuestJoinPromptProps = {
  compact?: boolean;
};

export default function GuestJoinPrompt({ compact = false }: GuestJoinPromptProps) {
  return (
    <section className={`${compact ? "p-3" : "p-4"} rounded-2xl border border-orange-300/60 bg-orange-50 text-sm text-orange-950 shadow-sm dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100`}>
      <p className="flex items-center gap-2 font-black">
        <Sparkles size={compact ? 15 : 17} />
        <LocalizedText en="Reading as a guest" de="Du liest als Gast" />
      </p>
      <p className={`${compact ? "mt-1" : "mt-2"} opacity-85`}>
        <LocalizedText
          en="Create an account to like, comment, follow, message and save posts."
          de="Erstelle ein Konto, um zu liken, zu kommentieren, zu folgen, Nachrichten zu senden und Beiträge zu speichern."
        />
      </p>
      <div className={`${compact ? "mt-3" : "mt-4"} flex flex-wrap gap-2`}>
        <Link href="/join" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-linear-to-r from-orange-500 to-red-500 px-4 text-sm font-black text-white shadow-sm shadow-orange-900/10 transition hover:scale-[1.01]">
          <UserPlus size={16} />
          <LocalizedText en="Create account or sign in" de="Konto erstellen oder anmelden" />
        </Link>
        <Link href="/profiles" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-orange-400/40 px-4 text-sm font-bold text-orange-700 transition hover:bg-orange-500/10 dark:text-orange-100">
          <MessageCircle size={16} />
          <LocalizedText en="Browse profiles" de="Profile ansehen" />
        </Link>
      </div>
    </section>
  );
}
