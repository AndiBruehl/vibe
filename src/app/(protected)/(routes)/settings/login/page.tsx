import { auth } from "@/auth";
import { prisma } from "@/db";
import { redirect } from "next/navigation";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import { Suspense } from "react";
import { availableLoginProviders, emailAuthAvailable } from "@/auth-options";
import LoginMethods from "@/app/components/LoginMethods";
import LoginNotice from "@/app/components/LoginNotice";
import LocalizedText from "@/app/components/LocalizedText";
import LinkedLoginMethods from "@/app/components/LinkedLoginMethods";
export default async function LoginSettings({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if ((await searchParams).notice === "conflict") redirect("/settings/login/conflict");
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const profile = await prisma.profile.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    select: { email: true },
  }).catch(() => null);
  const identities = profile ? await prisma.loginIdentity.findMany({ where: { email: profile.email }, select: { provider: true, createdAt: true }, orderBy: { createdAt: "asc" }, distinct: ["provider"] }).catch(() => null) : null;
  const names = availableLoginProviders();
  return <section className="mx-auto max-w-lg space-y-5">
    <BackNavigationLink fallbackHref="/settings" />
    <h1 className="text-2xl font-bold"><LocalizedText en="Sign-in methods" de="Anmeldemethoden"/></h1>
    <p className="text-sm text-slate-600 dark:text-slate-300"><LocalizedText en="One VIBE profile, multiple sign-in methods — even with different email addresses." de="Ein VIBE-Profil, mehrere Anmeldemethoden – auch mit unterschiedlichen E-Mail-Adressen."/></p>
    <Suspense><LoginNotice/></Suspense>
    {identities === null ? <p role="alert"><LocalizedText en="Linked methods could not be loaded. Reload this page to retry." de="Verknüpfte Methoden konnten nicht geladen werden. Lade die Seite erneut."/></p> : <>
      {identities.length > 0 && <LinkedLoginMethods methods={identities.map((identity) => ({ provider: identity.provider, name: names.find((p) => p.id === identity.provider)?.name || identity.provider, enabled: names.some((p) => p.id === identity.provider && p.enabled), since: identity.createdAt.toISOString() }))}/>}
      <LoginMethods providers={names} emailEnabled={emailAuthAvailable()} linking linkedProviders={identities.map((identity) => identity.provider)}/>
    </>}
  </section>;
}
