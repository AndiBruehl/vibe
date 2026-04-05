import { auth } from "@/auth";
import { Check, MoveLeft, Settings } from "lucide-react";
import Link from "next/link";
import img1 from "./default.jpg";
import { prisma } from "@/db";
import ProfilePosts from "@/app/components/ProfilePosts";
import { Suspense } from "react";

export default async function ProfilePage() {
  const session = await auth();
  const profile = await prisma.profile.findFirstOrThrow({
    where: {
      email: session?.user?.email as string,
    },
  });
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
          {profile.username}
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
          <div className="size-42 bg-white rounded-full flex items-center justify-center">
            <div className="size-40 aspect-square overflow-hidden rounded-full">
              <img src={profile?.avatar || img1.src} alt="Avatar" />
            </div>{" "}
          </div>
        </div>
      </section>
      <section className="text-center mt-8">
        <h1 className="text-xl bold"> {profile.name}</h1>
        <p className="text-slate-800 my-1">{profile.subtitle}</p>
        <p>{profile.bio}</p>
      </section>
      <section className="mt-4 ">
        <div className="flex justify-center gap-4">
          <Link className="font-bold underline" href="/">
            Posts
          </Link>
          <Link className="text-slate-700" href="/highlights">
            Highlights
          </Link>
        </div>
      </section>
      <section className="mt-4 ">
        <Suspense fallback="Loading posts...">
          <ProfilePosts email={session?.user?.email as string} />
        </Suspense>
      </section>
    </main>
  );
}
