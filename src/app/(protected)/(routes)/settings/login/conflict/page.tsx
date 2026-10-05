import Link from "next/link";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import LocalizedText from "@/app/components/LocalizedText";

export default function LoginConflictPage() {
  return <section className="mx-auto max-w-lg space-y-5">
    <BackNavigationLink fallbackHref="/settings/login" />
    <h1 className="text-2xl font-bold"><LocalizedText en="This method is already linked" de="Diese Methode ist bereits verknüpft"/></h1>
    <p><LocalizedText en="This Google or Discord account belongs to another active VIBE profile. It cannot be moved automatically." de="Dieses Google- oder Discord-Konto gehört zu einem anderen aktiven VIBE-Profil. Es kann nicht automatisch übertragen werden."/></p>
    <p><LocalizedText en="Choose a different provider account, or sign in to the other VIBE profile and remove the method there first. That profile must keep another working sign-in method." de="Wähle ein anderes Anbieterkonto oder melde dich beim anderen VIBE-Profil an und entferne dort zuerst diese Methode. Für dieses Profil muss eine andere funktionierende Anmeldemethode erhalten bleiben."/></p>
    <div className="flex flex-wrap gap-3"><Link href="/settings/login" className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-orange-500 to-red-500 px-4 font-bold text-white"><LocalizedText en="Back to sign-in methods" de="Zurück zu Anmeldemethoden"/></Link><Link href="/support" className="inline-flex min-h-11 items-center rounded-xl border border-slate-400/40 px-4"><LocalizedText en="Contact support" de="Support kontaktieren"/></Link></div>
  </section>;
}
