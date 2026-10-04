import { auth } from "@/auth";
import { prisma } from "@/db";
import { redirect } from "next/navigation";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import { Suspense } from "react";
import { availableLoginProviders, emailAuthAvailable } from "@/auth-options";
import LoginMethods from "@/app/components/LoginMethods";
import LoginNotice from "@/app/components/LoginNotice";
import LocalizedText from "@/app/components/LocalizedText";
export default async function LoginSettings() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const profile = await prisma.profile.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    select: { email: true },
  }).catch(() => null);
  const identities = profile ? await prisma.loginIdentity.findMany({ where: { email: profile.email }, select: { provider: true } }).catch(() => null) : null;
  const names = availableLoginProviders();
  return <section className="mx-auto max-w-lg space-y-5">
    <BackNavigationLink fallbackHref="/settings" />
    <h1 className="text-2xl font-bold"><LocalizedText en="Sign-in methods" de="Anmeldemethoden"/></h1>
    <p><LocalizedText en="Use Google and Discord with the same VIBE profile. Link the additional provider below; both sign-in methods remain connected, even with different email addresses." de="Nutze Google und Discord mit demselben VIBE-Profil. Verknüpfe unten den weiteren Anbieter; beide Anmeldemethoden bleiben verbunden, auch bei unterschiedlichen E-Mail-Adressen."/></p>
    <Suspense><LoginNotice/></Suspense>
    {identities === null ? <p><LocalizedText en="Linked methods could not be loaded. Please retry." de="Verknüpfte Methoden konnten nicht geladen werden. Bitte erneut versuchen."/></p> : <ul>{identities.map((identity) => <li key={identity.provider}>{names.find((p) => p.id === identity.provider)?.name || identity.provider}</li>)}</ul>}
    <LoginMethods providers={names} emailEnabled={emailAuthAvailable()} linking linkedProviders={identities?.map((identity) => identity.provider) ?? []}/>
  </section>;
}
