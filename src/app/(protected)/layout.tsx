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
import { isVibeAdminEmail } from "@/admin";
import AdminPreviewMode from "@/app/components/AdminPreviewMode";
import RestrictionNotice from "@/app/components/RestrictionNotice";
import { getActiveRestriction } from "@/restrictions";
import { claimWelcomeAndSend } from "@/system-profile";
import ActionButtonFeedback from "@/app/components/ActionButtonFeedback";
import QuickSettings from "@/app/components/QuickSettings";
import ProfileThemeRuntime from "@/app/components/ProfileThemeRuntime";
import PageTransition from "@/app/components/PageTransition";

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
    getUnreadMessageStatus(session.user.email).catch(() => ({ count: 0, latestUnreadAt: null })),
    getUnreadInteractionStatus(session.user.email).catch(() => ({ commentCount: 0, replyCount: 0, likeCount: 0, mentionCount: 0, followRequestCount: 0, adminCount: 0, latestUnreadAt: null })),
  ]);

  const emailBase =
    session.user.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 20) || "user";

  const generatedUsername = `${emailBase}-${randomUUID().slice(0, 8)}`;

  let existingProfile: { id: string } | null;
  let profile: Awaited<ReturnType<typeof prisma.profile.upsert>>;
  try {
    existingProfile = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
    profile = await prisma.profile.upsert({
      where: { email: session.user.email },
      update: isVibeAdminEmail(session.user.email) ? { isAdmin: true } : {},
      create: { email: session.user.email, username: generatedUsername, name: session.user.name || null, isAdmin: isVibeAdminEmail(session.user.email) },
    });
  } catch {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
      <section className="max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">VIBE</p>
        <h1 className="mt-3 text-2xl font-bold">Verbindung wird wiederhergestellt</h1>
        <p className="mt-3 text-sm text-slate-300">Die Datenbank ist gerade nicht erreichbar. Deine Daten sind sicher – versuche es gleich erneut.</p>
        <a href="/" className="mt-6 inline-block rounded-xl bg-orange-500 px-4 py-2 font-bold text-white">Erneut versuchen</a>
      </section>
    </main>;
  }

  // Only profiles created in this request receive this fallback; existing accounts must never receive it again.
  if (!existingProfile) await claimWelcomeAndSend(profile).catch(() => undefined);

  const activeRestriction = await getActiveRestriction(profile.id).catch(() => null);

  return (
    <>
      <RestrictionNotice restriction={activeRestriction ? { endsAt: activeRestriction.endsAt.toISOString(), blocksMessages: activeRestriction.blocksMessages, blocksComments: activeRestriction.blocksComments, blocksPosts: activeRestriction.blocksPosts } : null} language={profile.language === "de" ? "de" : "en"} />
      <AdminPreviewMode />
      <DesktopNav
        unreadConversationCount={unreadMessageStatus.count}
        unreadActivityCount={unreadInteractionStatus.commentCount + unreadInteractionStatus.replyCount + unreadInteractionStatus.likeCount + unreadInteractionStatus.mentionCount + unreadInteractionStatus.followRequestCount + unreadInteractionStatus.adminCount}
        initialLanguage={profile.language === "de" ? "de" : "en"}
      />
      <MobileNav
        unreadConversationCount={unreadMessageStatus.count}
        unreadActivityCount={unreadInteractionStatus.commentCount + unreadInteractionStatus.replyCount + unreadInteractionStatus.likeCount + unreadInteractionStatus.mentionCount + unreadInteractionStatus.followRequestCount + unreadInteractionStatus.adminCount}
        initialLanguage={profile.language === "de" ? "de" : "en"}
      />
      <MessageNotifications
        initialStatus={unreadMessageStatus}
        initialInteractionStatus={unreadInteractionStatus}
      />
      <NavigationFeedback />
      <LanguageRuntime
        initialLanguage={profile.language === "de" ? "de" : "en"}
      />
      <ProfileThemeRuntime initialTheme={profile.theme === "light" || profile.theme === "dark" ? profile.theme : "system"} />
      <ActionButtonFeedback />
      <QuickSettings initialLanguage={profile.language === "de" ? "de" : "en"} initialTheme={profile.theme === "light" || profile.theme === "dark" ? profile.theme : "system"} />

      <a href="#vibe-main-content" className="vibe-skip-link">{profile.language === "de" ? "Zum Inhalt springen" : "Skip to content"}</a>
      <div data-vibe-protected-content className="md:pl-44">
        <main id="vibe-main-content" data-vibe-protected-main tabIndex={-1} className="min-h-screen p-4 pb-28 md:pb-4"><PageTransition>{children}</PageTransition></main>
      </div>
    </>
  );
}
