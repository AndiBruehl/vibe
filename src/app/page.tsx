import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LocalizedText from "@/app/components/LocalizedText";
import LoginMethods from "@/app/components/LoginMethods";
import LoginNotice from "@/app/components/LoginNotice";
import { availableLoginProviders, emailAuthAvailable } from "@/auth-options";
import { Suspense } from "react";

export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    redirect("/home");
  }

  return (
    <div className="vibe-login-screen flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-12">
        <Image
          src="/logo.svg"
          alt="VIBE Logo"
          width={260}
          height={260}
          priority
          className="drop-shadow-2xl"
        />

        <div className="w-full max-w-md space-y-4 px-4"><Suspense><LoginNotice/></Suspense><LoginMethods providers={availableLoginProviders()} emailEnabled={emailAuthAvailable()} showGuestLink={false}/></div>
        <Link href="/home" className="rounded-xl border border-slate-400/40 px-6 py-3 font-bold"><LocalizedText en="View public posts as a guest" de="Öffentliche Beiträge als Gast ansehen"/></Link>
      </div>
    </div>
  );
}
