import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/db";
import SettingsForm from "../../components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const profile = await prisma.profile.findUnique({
    where: {
      email: session.user.email,
    },
  });

  return (
    <main>
      <section className="flex justify-between items-center">
        <Link
          href="/profile"
          className="group flex items-center gap-2 text-black no-underline visited:text-black hover:text-slate-700"
        >
          <MoveLeft />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Back to Profile
          </span>
        </Link>
      </section>

      <section className="mt-8 flex justify-center items-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Profile Settings
          </h1>

          <SettingsForm profile={profile} />
        </div>
      </section>
    </main>
  );
}
