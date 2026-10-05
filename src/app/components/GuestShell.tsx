import Link from "next/link";
import { Home, UserRound, UsersRound } from "lucide-react";
import LocalizedText from "./LocalizedText";
import Image from "next/image";
import QuickSettings from "./QuickSettings";

export default function GuestShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-4 text-slate-900 dark:text-slate-100">
    <QuickSettings guest initialLanguage="en" initialTheme="system"/>
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-300/30 pb-4 pr-14">
      <Link href="/home" aria-label="VIBE"><Image src="/logo.svg" alt="VIBE" width={80} height={60} className="h-12 w-20 object-contain" priority/></Link>
      <p className="text-sm"><LocalizedText en="Guest · View public posts and profiles" de="Gast · Öffentliche Beiträge und Profile ansehen" /></p>
    </header>
    <main id="vibe-main-content">{children}</main>
    <nav aria-label="Navigation" className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-8 border-t border-slate-300/30 bg-white px-4 py-3 dark:bg-slate-900">
      <Link href="/home" className="flex min-h-11 items-center gap-2"><Home size={20}/><LocalizedText en="Home" de="Startseite"/></Link>
      <Link href="/profiles" className="flex min-h-11 items-center gap-2"><UsersRound size={20}/><LocalizedText en="Profiles" de="Profile"/></Link>
      <Link href="/join" className="flex min-h-11 items-center gap-2"><UserRound size={20}/><LocalizedText en="Profile" de="Profil"/></Link>
    </nav>
  </div>;
}
