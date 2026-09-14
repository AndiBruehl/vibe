import { auth } from "@/auth";
import { isVibeAdmin } from "@/admin";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import AdminAccessDenied from "@/app/components/AdminAccessDenied";
import { prisma } from "@/db";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) redirect("/");
  const profile = await prisma.profile.findUnique({ where: { email }, select: { language: true } });
  const de = profile?.language === "de";
  if (!(await isVibeAdmin(email))) return <AdminAccessDenied language={de ? "de" : "en"} />;

  return (
    <main className="mx-auto w-full max-w-3xl pb-24 md:pb-8">
      <BackNavigationLink language={de ? "de" : "en"} />
      <section className="mt-6 overflow-hidden rounded-3xl border border-orange-400/30 bg-white shadow-xl dark:bg-slate-900">
        <header className="bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-6 py-7 text-white">
          <p className="text-xs font-bold tracking-[0.18em]">VIBE ADMIN</p>
          <h1 className="mt-2 text-3xl font-black">{de ? "Moderation" : "Moderation"}</h1>
          <p className="mt-2 text-sm text-white/85">{de ? "Admin-Werkzeuge und eingehende Meldungen." : "Admin tools and incoming reports."}</p>
        </header>
        <div className="p-6">
          <h2 className="font-bold text-slate-900 dark:text-white">{de ? "Meldungen" : "Reports"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{de ? "Die Meldungsübersicht folgt mit BETA 0.1.65. Bis dahin kannst du Beiträge und Kommentare direkt auf ihren Seiten moderieren." : "The report inbox will arrive with BETA 0.1.65. Until then, you can moderate posts and comments directly from their pages."}</p>
        </div>
      </section>
    </main>
  );
}
