import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MobileNav from "@/app/components/MobileNav";
import DesktopNav from "@/app/components/DesktopNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <>
      <DesktopNav />
      <MobileNav />

      <div className="md:pl-48">
        <main className="min-h-screen p-4 pb-28 md:pb-4">{children}</main>
      </div>
    </>
  );
}
