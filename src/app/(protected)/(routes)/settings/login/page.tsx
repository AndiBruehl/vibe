import { auth } from "@/auth";
import { prisma } from "@/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { availableLoginProviders, emailAuthAvailable } from "@/auth-options";
import LoginMethods from "@/app/components/LoginMethods";
import LoginNotice from "@/app/components/LoginNotice";
import LocalizedText from "@/app/components/LocalizedText";
export default async function LoginSettings() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const identities = await prisma.loginIdentity.findMany({ where: { email: session.user.email }, select: { provider: true } }).catch(() => null);
  const names = availableLoginProviders();
  return <section className="mx-auto max-w-lg space-y-5">
    <Link href="/settings" className="text-orange-500">← <LocalizedText en="Settings" de="Einstellungen"/></Link>
    <h1 className="text-2xl font-bold"><LocalizedText en="Sign-in methods" de="Anmeldemethoden"/></h1>
    <p><LocalizedText en="Link an additional provider while signed in to keep this VIBE account. Matching email addresses alone never link a new provider." de="Verknüpfe einen weiteren Anbieter, während du angemeldet bist, um dieses VIBE-Konto weiterzuverwenden. Gleiche E-Mail-Adressen allein verknüpfen keinen neuen Anbieter."/></p>
    <Suspense><LoginNotice/></Suspense>
    {identities === null ? <p><LocalizedText en="Linked methods could not be loaded. Please retry." de="Verknüpfte Methoden konnten nicht geladen werden. Bitte erneut versuchen."/></p> : <ul>{identities.map((identity) => <li key={identity.provider}>{names.find((p) => p.id === identity.provider)?.name || identity.provider}</li>)}</ul>}
    <LoginMethods providers={names} emailEnabled={emailAuthAvailable()} linking/>
  </section>;
}
