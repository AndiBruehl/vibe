import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserHome from "@/app/components/UserHome";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const { feed } = await searchParams;
  const feedMode = feed === "for-you" ? "for-you" : "following";

  return <UserHome session={session} feedMode={feedMode} />;
}
