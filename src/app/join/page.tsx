import Link from "next/link";
import GuestShell from "@/app/components/GuestShell";
import LocalizedText from "@/app/components/LocalizedText";
import GuestGoogleSignIn from "@/app/components/GuestGoogleSignIn";
export default function JoinPage() {
  return <GuestShell><section className="mx-auto max-w-lg space-y-6 rounded-3xl border border-slate-400/30 bg-white p-6 text-center dark:bg-slate-900">
    <h1 className="text-3xl font-black"><LocalizedText en="Join VIBE" de="Werde Teil von VIBE"/></h1>
    <p><LocalizedText en="Create an account to post, comment and connect. As a guest, you can view public profiles and posts." de="Erstelle ein Konto, um Beiträge zu posten, zu kommentieren und Kontakte zu knüpfen. Als Gast kannst du öffentliche Profile und Beiträge ansehen."/></p>
    <GuestGoogleSignIn register/>
    <p><LocalizedText en="Already a member?" de="Bereits Mitglied?"/> <Link href="/" className="font-bold text-orange-500"><LocalizedText en="Sign in" de="Anmelden"/></Link></p>
    <Link href="/home" className="inline-block py-3"><LocalizedText en="Continue viewing as a guest" de="Weiter als Gast ansehen"/></Link>
  </section></GuestShell>;
}
