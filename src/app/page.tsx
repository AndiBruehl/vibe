import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-12">
        <Image
          src="/logo.svg"
          alt="VIBE Logo"
          width={260}
          height={260}
          priority
          className="drop-shadow-2xl"
        />

        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-black/30 transition hover:scale-[1.05] hover:shadow-2xl"
          >
            🔥 Login with Google
          </button>
        </form>
      </div>
    </div>
  );
}
