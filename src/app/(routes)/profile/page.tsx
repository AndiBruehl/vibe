import PostGrid from "@/app/components/PostGrid";
import { auth } from "@/auth";
import { Check, MoveLeft, Settings } from "lucide-react";
import Link from "next/link";
import img1 from "./Flux2-Klein_00001_.png";

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
                src={img1.src}
                alt="testimg"
                className="w-full h-full object-cover"
              />
            </div>{" "}
          </div>
        </div>
      </section>
      <section className="text-center mt-8">
        <h1 className="text-xl bold"> {session?.user?.name}</h1>
        <p className="text-slate-800 my-1">Business Account</p>
        <p>
          Bla bla bla <br />
          Allods ONLINE
        </p>
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
        <PostGrid />
      </section>
    </main>
  );
}
