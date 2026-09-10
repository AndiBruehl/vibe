import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MobileNav from "@/app/components/MobileNav";
import DesktopNav from "@/app/components/DesktopNav";
import MessageNotifications from "@/app/components/MessageNotifications";
import NavigationFeedback from "@/app/components/NavigationFeedback";
import { getUnreadMessageStatus } from "@/messages";
import { getUnreadInteractionStatus } from "@/notifications";
import LanguageRuntime from "@/app/components/LanguageRuntime";
import { prisma } from "@/db";
import { randomUUID } from "crypto";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const [unreadMessageStatus, unreadInteractionStatus] = await Promise.all([
    getUnreadMessageStatus(session.user.email),
    getUnreadInteractionStatus(session.user.email),
  ]);

  const emailBase =
    session.user.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 20) || "user";

  const generatedUsername = `${emailBase}-${randomUUID().slice(0, 8)}`;

  const profile = await prisma.profile.upsert({
    where: {
      email: session.user.email,
    },
    update: {},
    create: {
      email: session.user.email,
      username: generatedUsername,
      name: session.user.name || null,
    },
  });

  return (
    <>
      <DesktopNav
        unreadConversationCount={unreadMessageStatus.count}
        unreadActivityCount={unreadInteractionStatus.commentCount + unreadInteractionStatus.replyCount}
      />
      <MobileNav
        unreadConversationCount={unreadMessageStatus.count}
        unreadActivityCount={unreadInteractionStatus.commentCount + unreadInteractionStatus.replyCount}
      />
      <MessageNotifications
        initialStatus={unreadMessageStatus}
        initialInteractionStatus={unreadInteractionStatus}
      />
      <NavigationFeedback />
      <LanguageRuntime
        initialLanguage={profile.language === "de" ? "de" : "en"}
      />

      <div className="md:pl-44">
        <main className="min-h-screen p-4 pb-28 md:pb-4">{children}</main>
      </div>
    </>
  );
}
