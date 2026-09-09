import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MobileNav from "@/app/components/MobileNav";
import DesktopNav from "@/app/components/DesktopNav";
import MessageNotifications from "@/app/components/MessageNotifications";
import NavigationFeedback from "@/app/components/NavigationFeedback";
import { getUnreadMessageStatus } from "@/messages";
import LanguageRuntime from "@/app/components/LanguageRuntime";
import { prisma } from "@/db";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const unreadMessageStatus = await getUnreadMessageStatus(session.user.email);
  const profile = await prisma.profile.upsert({ where: { email: session.user.email }, update: {}, create: { email: session.user.email } });

  return (
    <>
      <DesktopNav unreadConversationCount={unreadMessageStatus.count} />
      <MobileNav unreadConversationCount={unreadMessageStatus.count} />
      <MessageNotifications initialStatus={unreadMessageStatus} />
      <NavigationFeedback />
      <LanguageRuntime initialLanguage={profile.language === "de" ? "de" : "en"} />

      <div className="md:pl-44">
        <main className="min-h-screen p-4 pb-28 md:pb-4">{children}</main>
      </div>
    </>
  );
}
