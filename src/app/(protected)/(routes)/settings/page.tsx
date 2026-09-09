import { MoveLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/db";
import AppVersion from "@/app/components/AppVersion";
import ReleaseDownloads from "@/app/components/ReleaseDownloads";
import SettingsForm from "@/app/components/SettingsForm";

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
            Back to Profile
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
            <span>Sign out</span>
          </button>
        </form>
      </section>

      <section className="mx-auto mt-4 w-full max-w-5xl pb-4">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/25">
          <header className="border-b border-slate-200 bg-linear-to-r from-orange-50 via-white to-pink-50 px-6 py-5 dark:border-slate-700/80 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 sm:px-8">
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-300">Account</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Profile Settings</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage how your profile appears across VIBE.</p>
          </header>

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
