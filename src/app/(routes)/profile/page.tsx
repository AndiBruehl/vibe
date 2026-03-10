import { auth } from "@/auth";
import { Check, MoveLeft, Settings } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  return (
    <main>
      <section className=" flex justify-between items-center">
        <Link
          href="/"
          className="group flex items-center gap-2 text-black no-underline visited:text-black hover:text-slate-700"
        >
          <MoveLeft />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Back to Home
          </span>
        </Link>
        <div className="text-lg font-medium flex items-center gap-2">
          {session?.user?.name}
          <div className="text-white size-5 rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) inline-flex items-center justify-center">
            <Check size={16} />
          </div>
          <br className="bg-blackS" />
        </div>
        <Link
          href="/settings"
          className="group flex items-center gap-2 text-black no-underline visited:text-black hover:text-slate-700"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Settings
          </span>
          <Settings />
        </Link>
      </section>
      <section className="mt-8 flex justify-center">
        <div className="size-44 bg-linear-to-tr from-(--ig-orange) to-(--ig-red) rounded-full flex items-center justify-center">
          {" "}
          <div className="size-42 bg-white rounded-full flex items-center justify-center">
            <div className="size-40 aspect-square overflow-hidden rounded-full">
              <img
                src="http://127.0.0.1:8188/api/view?filename=2026-vio-zit_02927_.png"
                alt="testimg"
                className="w-full h-full object-cover"
              />
            </div>{" "}
          </div>
        </div>
      </section>
    </main>
  );
}
