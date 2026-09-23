import { auth } from "@/auth";
import { prisma } from "@/db";
import BlockButton from "@/app/components/BlockButton";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import { notFound } from "next/navigation";

export default async function BlockedPage() {
  const session = await auth();
  if (!session?.user?.email) notFound();

  const viewer = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: { id: true, language: true },
  });
  if (!viewer) notFound();

  const rows = await prisma.block.findMany({
    where: { blockerId: viewer.id },
    include: { blocked: true },
  });
  const de = viewer.language === "de";

  return (
    <main className="w-full pb-24 md:pb-8">
      <BackNavigationLink fallbackHref="/settings" language={de ? "de" : "en"} label={de ? "Zurück zu Einstellungen" : "Back to settings"} />
      <section className="mx-auto w-full max-w-2xl">
        <h1 className="mt-6 text-2xl font-bold">{de ? "Blockierte Nutzer" : "Blocked users"}</h1>
        <p className="mt-2 text-slate-500">{de ? "Blockierte Nutzer können dein Profil und deine Beiträge nicht mehr sehen." : "Blocked users can no longer see your profile or posts."}</p>
        {rows.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
            <p className="font-semibold text-slate-900 dark:text-white">{de ? "Keine blockierten Nutzer" : "No blocked users"}</p>
            <p className="mt-1 text-sm text-slate-500">{de ? "Du hast aktuell keine Profile blockiert." : "You have not blocked any profiles."}</p>
          </section>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 dark:bg-slate-800">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.blocked.name || row.blocked.username}</p>
                  <p className="truncate text-sm text-slate-500">@{row.blocked.username}</p>
                </div>
                <BlockButton targetProfileId={row.blockedId} blocked language={de ? "de" : "en"} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
