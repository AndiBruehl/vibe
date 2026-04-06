import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserHome from "@/app/components/UserHome";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return <UserHome session={session} />;
}
