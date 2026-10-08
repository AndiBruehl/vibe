import Link from "next/link";
import { AlertTriangle, Eye, Link2, MessageCircle, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import GuestShell from "@/app/components/GuestShell";
import LocalizedText from "@/app/components/LocalizedText";
import LoginMethods from "@/app/components/LoginMethods";
import LoginNotice from "@/app/components/LoginNotice";
import { availableLoginProviders, emailAuthAvailable } from "@/auth-options";
import { Suspense } from "react";

const memberBenefits = [
  { icon: MessageCircle, en: "Post, comment and reply", de: "Posten, kommentieren und antworten" },
  { icon: Sparkles, en: "Follow profiles and personalize your space", de: "Profilen folgen und deinen Bereich gestalten" },
  { icon: ShieldCheck, en: "Keep Google and Discord linked to one profile", de: "Google und Discord mit einem Profil verbinden" },
];

export default function JoinPage() {
  return <GuestShell><main className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[1.08fr_0.92fr]">
    <section className="rounded-3xl border border-orange-400/40 bg-linear-to-br from-orange-500/15 via-fuchsia-500/10 to-slate-950/5 p-7 shadow-xl shadow-orange-950/10 dark:from-orange-500/20 dark:via-fuchsia-500/15 dark:to-slate-950">
      <p className="inline-flex items-center gap-2 rounded-full bg-slate-950/10 px-3 py-1 text-sm font-black text-orange-600 dark:bg-black/30 dark:text-orange-200"><UserPlus size={16}/><LocalizedText en="Join from guest mode" de="Aus dem Gastmodus beitreten"/></p>
      <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl"><LocalizedText en="Create your VIBE account" de="Erstelle dein VIBE-Konto"/></h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-200"><LocalizedText en="You can keep reading public posts as a guest. Create an account when you want to interact, save things, follow people or build your own profile." de="Du kannst öffentliche Beiträge weiter als Gast lesen. Erstelle ein Konto, wenn du interagieren, Dinge speichern, Menschen folgen oder dein eigenes Profil aufbauen möchtest."/></p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">{memberBenefits.map((benefit) => <article key={benefit.en} className="rounded-2xl border border-slate-400/20 bg-white/60 p-4 dark:bg-slate-950/45"><benefit.icon className="mb-4 text-orange-500"/><p className="font-black"><LocalizedText en={benefit.en} de={benefit.de}/></p></article>)}</div>
      <Link href="/home" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-400/30 px-4 font-bold transition hover:border-orange-400"><Eye size={17}/><LocalizedText en="Keep browsing as guest" de="Als Gast weiter ansehen"/></Link>
    </section>

    <section className="rounded-3xl border border-slate-400/30 bg-white p-6 shadow-xl shadow-slate-900/5 dark:bg-slate-900 dark:shadow-slate-950/30">
      <h2 className="text-2xl font-black"><LocalizedText en="Sign up or sign in" de="Registrieren oder anmelden"/></h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300"><LocalizedText en="Use an enabled sign-in method below. More methods can be added later from Settings → Sign-in methods." de="Nutze eine verfügbare Anmeldemethode. Weitere Methoden kannst du später unter Einstellungen → Anmeldemethoden verknüpfen."/></p>
      <div className="mt-4"><Suspense><LoginNotice/></Suspense></div>
      <section className="mt-5 space-y-3 rounded-2xl border border-orange-400/40 bg-orange-50/80 p-4 text-left text-sm text-slate-800 shadow-sm dark:bg-slate-950/50 dark:text-slate-100">
        <p className="flex items-start gap-2 font-black"><Link2 className="mt-0.5 shrink-0 text-orange-500" size={18}/><span><LocalizedText en="Start with Google or Discord." de="Starte mit Google oder Discord."/></span></p>
        <p><LocalizedText en="Create the account with either Google or Discord first. After you are signed in, open Settings → Sign-in methods to link the other provider to the same VIBE profile." de="Erstelle das Konto zuerst entweder mit Google oder mit Discord. Wenn du angemeldet bist, kannst du unter Einstellungen → Anmeldemethoden den anderen Anbieter mit demselben VIBE-Profil verknüpfen."/></p>
        <p className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-200/25 p-3 font-bold text-amber-900 dark:text-amber-100"><AlertTriangle className="mt-0.5 shrink-0" size={16}/><span><LocalizedText en="If you already have a VIBE account and sign in with an unlinked provider, VIBE creates a separate new account." de="Wenn du bereits ein VIBE-Konto hast und dich mit einem nicht verknüpften Anbieter anmeldest, erstellt VIBE ein separates neues Konto."/></span></p>
      </section>
      <div className="mt-5"><LoginMethods
        providers={availableLoginProviders()}
        emailEnabled={emailAuthAvailable()}
        register
        showGuestLink={false}
        requireAcknowledgement
        acknowledgementText={{
          en: "I have read and acknowledge that an unlinked Google or Discord login creates a separate new account.",
          de: "Ich habe gelesen und verstanden, dass ein nicht verknüpfter Google- oder Discord-Login ein separates neues Konto erstellt."
        }}
      /></div>
      <p className="mt-5 text-sm"><LocalizedText en="Already a member? Use your existing provider above." de="Bereits Mitglied? Nutze oben deinen bestehenden Anbieter."/></p>
    </section>
  </main></GuestShell>;
}
