import { MoveLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/db";
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

      <section className="mt-8 flex items-center justify-center">
        <div className="mx-auto w-full max-w-md">
          <h1 className="mb-4 text-center text-2xl font-bold">
            Profile Settings
          </h1>

          <SettingsForm profile={profile} />
        </div>
      </section>
    </main>
  );
}
