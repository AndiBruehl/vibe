import { ImageUp, MoveLeft } from "lucide-react";
import Link from "next/link";
import { Button, TextArea, TextField } from "@radix-ui/themes";
import { prisma } from "@/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
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
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Profile Settings
          </h1>
          <form
            action={async (data: FormData) => {
              "use server";

              await prisma.profile.upsert({
                where: {
                  email: session?.user?.email,
                },
                update: {
                  username: data.get("username") as string,
                  name: data.get("name") as string,
                  subtitle: data.get("subtitle") as string,
                  bio: data.get("bio") as string,
                },
                create: {
                  email: session?.user?.email || "",
                  avatar: "",
                  username: data.get("username") as string,
                  name: data.get("name") as string,
                  subtitle: data.get("subtitle") as string,
                  bio: data.get("bio") as string,
                },
              });
              redirect("/profile");
            }}
          >
            <div className="flex gap-2 items-center">
              <div>
                <div className="bg-slate-400 size-24 rounded-full"></div>
              </div>
              <div>
                <Button variant="surface">
                  <ImageUp />
                  Change avatar
                </Button>
              </div>
            </div>
            <p className="mt-2 font-bold">username</p>
            <TextField.Root
              name="username"
              placeholder="your_username"
              className="mb-4"
            />
            <p className="mt-2 font-bold">name</p>
            <TextField.Root
              name="name"
              placeholder="John Doe"
              className="mb-4"
            />
            <p className="mt-2 font-bold">subtitle</p>
            <TextField.Root
              name="subtitle"
              placeholder="graphic designer"
              className="mb-4"
            />{" "}
            <p className="mt-2 font-bold">bio</p>
            <TextArea
              name="bio"
              placeholder="your_description"
              className="mb-4"
            />
            <div className="mt-2 flex justify-center">
              <Button type="submit" variant="solid">
                Save Settings
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
