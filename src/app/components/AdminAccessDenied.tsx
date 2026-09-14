"use client";

import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAccessDenied({ language }: { language: "en" | "de" }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(3);
  const de = language === "de";

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => router.replace("/home"), 3000);
    const countdownTimer = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => {
      window.clearTimeout(redirectTimer);
      window.clearInterval(countdownTimer);
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center p-4">
      <section className="w-full rounded-3xl border border-red-300/50 bg-white p-8 text-center shadow-xl dark:border-red-500/20 dark:bg-slate-900">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
          <ShieldAlert size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
          {de ? "Kein Admin-Zugriff" : "No admin access"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {de ? "Du bist nicht als Administratorin oder Administrator für VIBE berechtigt." : "You are not authorized as a VIBE administrator."}
        </p>
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
          {de ? `Weiterleitung zur Startseite in ${seconds} Sekunden …` : `Redirecting to Home in ${seconds} seconds …`}
        </p>
      </section>
    </main>
  );
}
