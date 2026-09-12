import { MoveLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/db";
import AppVersion from "@/app/components/AppVersion";
import ReleaseDownloads from "@/app/components/ReleaseDownloads";
import SettingsForm from "@/app/components/SettingsForm";
import SettingsHeading from "@/app/components/SettingsHeading";
import LocalizedText from "@/app/components/LocalizedText";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const profile = await prisma.profile.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email },
  });
  return (
    <main>
      <section className="flex items-center justify-between">
        <Link
          href="/profile"
          className="group flex items-center gap-2 text-slate-800 no-underline visited:text-slate-800 hover:text-slate-600 dark:text-slate-500 dark:visited:text-slate-400 dark:hover:text-slate-500"
        >
          <MoveLeft />
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <LocalizedText en="Back to Profile" de="Zurück zum Profil" />
          </span>
        </Link>

        {/* 🔥 SIGN OUT BUTTON */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="group flex items-center gap-2 rounded-xl bg-linear-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:scale-[1.03] hover:shadow-xl"
          >
            <LogOut
              size={16}
              className="transition group-hover:-translate-x-1"
            />
            <span><LocalizedText en="Sign out" de="Abmelden" /></span>
          </button>
        </form>
      </section>

      <section className="mx-auto mt-4 w-full max-w-5xl pb-4">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/25">
          <SettingsHeading initialLanguage={profile.language === "de" ? "de" : "en"} />

          <div className="p-5 sm:p-6">
            <SettingsForm profile={profile} />
            <ReleaseDownloads />
            <AppVersion />
          </div>
        </div>
      </section>
    </main>
  );
}
