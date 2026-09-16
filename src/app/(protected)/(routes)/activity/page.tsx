/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { prisma } from "@/db";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, Heart, MessageCircle, MoveLeft, UserPlus } from "lucide-react";
import ActivityReadControl from "@/app/components/ActivityReadControl";
import ActivityReadOnOpen from "@/app/components/ActivityReadOnOpen";
import img1 from "../profile/default.jpg";

type ActivityItem = {
  id: string;
  type: "follow" | "follow-request" | "like" | "comment" | "message" | "admin";
  title: string;
  body: string;
  href: string;
  createdAt: Date;
  avatar?: string | null;
  image?: string | null;
  context?: string;
  isUnread?: boolean;
};

type ActivityGroup = ActivityItem & { count: number; unreadCount: number };

function activityGroupKey(item: ActivityItem) {
  return item.type === "like" || item.type === "comment" || item.type === "message"
    ? `${item.type}:${item.href}`
    : item.id;
}

function groupedActivityTitle(item: ActivityGroup, de: boolean) {
  if (item.count === 1) return item.title;
  if (item.type === "like") return de ? `${item.count} neue Reaktionen` : `${item.count} new reactions`;
  if (item.type === "comment") return de ? `${item.count} neue Kommentare` : `${item.count} new comments`;
  if (item.type === "message") return de ? `${item.count} neue Nachrichten` : `${item.count} new messages`;
  return item.title;
}

function formatActivityDate(date: Date, language: "en" | "de") {
  return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const className = "size-4";
  if (type === "follow" || type === "follow-request") return <UserPlus className={className} />;
  if (type === "like") return <Heart className={className} />;
  if (type === "message") return <MessageCircle className={className} />;
  return <Bell className={className} />;
}

function adminActivityTitle(kind: string, de: boolean) {
  const titles: Record<string, [string, string]> = {
    report: ["Neuer Bericht", "New report"],
    "report-status": ["Bericht aktualisiert", "Report updated"],
    "report-delete": ["Meldung gelöscht", "Report deleted"],
    note: ["Neue Admin-Notiz", "New admin note"],
    "note-update": ["Admin-Notiz aktualisiert", "Admin note updated"],
    "note-delete": ["Admin-Notiz gelöscht", "Admin note deleted"],
    "note-comment": ["Neuer Kommentar zu einer Admin-Notiz", "New comment on an admin note"],
    "note-vote": ["Abstimmung zu einer Admin-Notiz", "Admin note vote"],
    "admin-role": ["Administratorrolle geändert", "Administrator role changed"],
    "team-message": ["VibeTeam-Nachricht gesendet", "VibeTeam message sent"],
    "user-delete": ["Account gelöscht", "Account deleted"],
    "post-delete": ["Beitrag durch Moderation gelöscht", "Post deleted by moderation"],
    "comment-delete": ["Kommentar durch Moderation gelöscht", "Comment deleted by moderation"],
    "support-ticket": ["Neue Support-Anfrage", "New support request"],
    "support-claim": ["Support-Ticket übernommen", "Support ticket claimed"],
    "support-reply": ["Support-Ticket beantwortet", "Support ticket answered"],
    "support-release": ["Support-Ticket freigegeben", "Support ticket released"],
    "support-close": ["Support-Ticket geschlossen", "Support ticket closed"],
    "support-delete": ["Support-Ticket gelöscht", "Support ticket deleted"],
    restriction: ["Temporäre Restriktion gesetzt", "Temporary restriction applied"],
  };
  const title = titles[kind] ?? ["Neue Admin-Aktivität", "New admin activity"];
  return de ? title[0] : title[1];
}

function adminActivityDetail(kind: string, de: boolean) {
  const details: Record<string, [string, string]> = {
    report: ["Eine neue Meldung wartet auf Prüfung.", "A new report is waiting for review."],
    "report-status": ["Der Status einer Meldung wurde geändert.", "A report status was changed."],
    "report-delete": ["Eine erledigte Meldung wurde gelöscht.", "A completed report was deleted."],
    note: ["Es wurde eine interne Notiz erstellt.", "An internal note was created."],
    "note-update": ["Eine interne Notiz wurde aktualisiert.", "An internal note was updated."],
    "note-delete": ["Eine interne Notiz wurde gelöscht.", "An internal note was deleted."],
    "note-comment": ["Es gibt einen neuen Kommentar zu einer internen Notiz.", "There is a new comment on an internal note."],
    "note-vote": ["Für eine interne Notiz wurde abgestimmt.", "An internal note received a vote."],
    "admin-role": ["Eine Administratorrolle wurde geändert.", "An administrator role was changed."],
    "team-message": ["Eine VibeTeam-Nachricht wurde gesendet.", "A VibeTeam message was sent."],
    "user-delete": ["Ein Benutzerkonto wurde gelöscht.", "A user account was deleted."],
    "post-delete": ["Ein Beitrag wurde durch die Moderation gelöscht.", "A post was deleted by moderation."],
    "comment-delete": ["Ein Kommentar wurde durch die Moderation gelöscht.", "A comment was deleted by moderation."],
    "support-ticket": ["Eine neue Nachricht an Support@Vibe wartet auf Bearbeitung.", "A new Support@Vibe message is waiting for handling."],
    "support-claim": ["Ein Admin bearbeitet ein Support-Ticket exklusiv.", "An admin is handling a support ticket exclusively."],
    "support-reply": ["Ein Admin hat als Support@Vibe geantwortet.", "An admin replied as Support@Vibe."],
    "support-release": ["Ein Support-Ticket wurde wieder freigegeben.", "A support ticket was released again."],
    "support-close": ["Ein Support-Ticket wurde geschlossen.", "A support ticket was closed."],
    "support-delete": ["Ein abgeschlossenes Support-Ticket wurde gelöscht.", "A closed support ticket was deleted."],
    restriction: ["Für ein Profil wurde eine zeitlich begrenzte Restriktion gesetzt.", "A time-limited restriction was applied to a profile."],
  };
  const detail = details[kind] ?? ["Es gibt eine neue Admin-Aktivität.", "There is new admin activity."];
  return de ? detail[0] : detail[1];
}

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.email) notFound();

  const currentUserProfile = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, language: true, isAdmin: true, activityReadAt: true },
  });

  if (!currentUserProfile) notFound();
  const de = currentUserProfile.language === "de";

  // Historic data can contain comments whose post was deleted. Excluding those
  // records prevents Prisma from failing the complete activity query.
  const validPosts = await prisma.post.findMany({ select: { id: true } });
  const validPostIds = validPosts.map((post) => post.id);

  const [follows, followRequests, postLikes, comments, commentLikes, conversations, mentions, adminActivities] = await Promise.all([
    // Safe Follows
    prisma.follow
      .findMany({
        where: { followingId: currentUserProfile.id },
        include: {
          follower: {
            select: { name: true, username: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
      .catch(() => []), // fallback if error

    prisma.followRequest
      .findMany({
        where: { followingId: currentUserProfile.id },
        include: { follower: { select: { name: true, username: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
      .catch(() => []),

    // Safe Post Likes
    prisma.postLike
      .findMany({
        where: {
          authorEmail: { not: currentUserProfile.email },
          post: { authorEmail: currentUserProfile.email },
        },
        include: {
          author: { select: { name: true, username: true, avatar: true } },
          post: { select: { id: true, image: true, description: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
      .catch(() => []),

    // Safe Comments
    prisma.comment
      .findMany({
        where: {
          authorEmail: { not: currentUserProfile.email },
          postId: { in: validPostIds },
          OR: [
            { post: { authorEmail: currentUserProfile.email } },
            { parentComment: { authorEmail: currentUserProfile.email } },
          ],
        },
        include: {
          author: { select: { name: true, username: true, avatar: true } },
          post: { select: { id: true, image: true, description: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
      .catch(() => []),

    // Query scalar IDs first so historic orphaned relations cannot break Activity.
    prisma.commentLike
      .findMany({
        where: { authorEmail: { not: currentUserProfile.email } },
        select: { id: true, authorEmail: true, commentId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 40,
      })
      .catch(() => []),

    // Safe Conversations
    prisma.conversation
      .findMany({
        where: {
          participants: { some: { profileId: currentUserProfile.id } },
        },
        include: {
          participants: {
            include: {
              profile: {
                select: { id: true, name: true, username: true, avatar: true },
              },
            },
          },
          messages: {
            where: { senderId: { not: currentUserProfile.id } },
            include: {
              sender: { select: { name: true, username: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 15,
      })
      .catch(() => []),

    prisma.commentMention
      .findMany({
        where: { profileId: currentUserProfile.id },
        select: { id: true, commentId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
      .catch(() => []),
    currentUserProfile.isAdmin ? prisma.adminActivity.findMany({ where: { actorEmail: { not: currentUserProfile.email } }, orderBy: { createdAt: "desc" }, take: 15 }).catch(() => []) : [],
  ]);

  const directCommentIds = new Set(comments.map((comment) => comment.id));
  const mentionCommentIds = [...new Set(
    mentions
      .map((mention) => mention.commentId)
      .filter((commentId) => !directCommentIds.has(commentId)),
  )];
  const mentionedComments = (mentionCommentIds.length
    ? await prisma.comment.findMany({
        where: { id: { in: mentionCommentIds }, authorEmail: { not: currentUserProfile.email } },
        select: { id: true, text: true, postId: true, authorEmail: true, parentCommentId: true },
      }).catch(() => [])
    : []) as Array<{ id: string; text: string; postId: string; authorEmail: string; parentCommentId: string | null }>;
  const mentionedCommentsById = new Map(mentionedComments.map((comment) => [comment.id, comment]));
  const mentionedPostIds = [...new Set(mentionedComments.map((comment) => comment.postId))];
  const mentionedPosts = (mentionedPostIds.length
    ? await prisma.post.findMany({ where: { id: { in: mentionedPostIds } }, select: { id: true, image: true, description: true } }).catch(() => [])
    : []) as Array<{ id: string; image: string; description: string }>;
  const mentionedPostsById = new Map(mentionedPosts.map((post) => [post.id, post]));
  const mentionAuthorEmails = [...new Set(mentionedComments.map((comment) => comment.authorEmail))];
  const mentionAuthors = (mentionAuthorEmails.length
    ? await prisma.profile.findMany({ where: { email: { in: mentionAuthorEmails } }, select: { email: true, name: true, username: true, avatar: true } }).catch(() => [])
    : []) as Array<{ email: string; name: string | null; username: string | null; avatar: string | null }>;
  const mentionAuthorsByEmail = new Map(mentionAuthors.map((author) => [author.email, author]));

  const likedCommentIds = commentLikes.map((like) => like.commentId);
  const likedComments = likedCommentIds.length
    ? await prisma.comment.findMany({
        where: { id: { in: likedCommentIds } },
        select: { id: true, text: true, postId: true, authorEmail: true },
      })
    : [];
  const likedCommentsById = new Map<
    string,
    { id: string; text: string; postId: string; authorEmail: string }
  >(likedComments.map((comment) => [comment.id, comment]));
  const likedPostIds = [...new Set(likedComments.map((comment) => comment.postId))];
  const likedPosts = likedPostIds.length
    ? await prisma.post.findMany({
        where: { id: { in: likedPostIds } },
        select: { id: true, image: true, description: true },
      })
    : [];
  const likedPostsById = new Map<
    string,
    { id: string; image: string; description: string }
  >(likedPosts.map((post) => [post.id, post]));
  const likeAuthorEmails = [...new Set(commentLikes.map((like) => like.authorEmail))];
  const likeAuthors = likeAuthorEmails.length
    ? await prisma.profile.findMany({
        where: { email: { in: likeAuthorEmails } },
        select: { email: true, name: true, username: true, avatar: true },
      })
    : [];
  const likeAuthorsByEmail = new Map<
    string,
    { email: string; name: string | null; username: string | null; avatar: string | null }
  >(likeAuthors.map((author) => [author.email, author]));

  const items: ActivityItem[] = [
    ...adminActivities.map((activity) => ({ id: `admin-${activity.id}`, type: "admin" as const, title: adminActivityTitle(activity.kind, de), body: adminActivityDetail(activity.kind, de), context: "VIBE ADMIN", href: activity.kind.startsWith("support-") ? "/admin?tab=support" : "/admin", createdAt: activity.createdAt })),
    ...followRequests
      .filter((request: any) => request.follower)
      .map((request: any) => ({
        id: `follow-request-${request.id}`,
        type: "follow-request" as const,
        title: `${request.follower.name || request.follower.username || (de ? "Jemand" : "Someone")} ${de ? "möchte dir folgen" : "wants to follow you"}`,
        body: request.follower.username ? `@${request.follower.username}` : "",
        context: de ? "Follow-Anfrage" : "Follow request",
        href: "/profile#follow-requests",
        createdAt: request.createdAt,
        avatar: request.follower.avatar,
      })),

    // Safe Follows
    ...follows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((f: any) => f.follower) // ← Safety
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((follow: any) => ({
        id: `follow-${follow.id}`,
        type: "follow" as const,
        title: `${follow.follower.name || follow.follower.username || (de ? "Jemand" : "Someone")} ${de ? "folgt dir" : "followed you"}`,
        body: follow.follower.username ? `@${follow.follower.username}` : "",
        context: de ? "Profilaktivität" : "Profile activity",
        href: follow.follower.username
          ? `/profile/${encodeURIComponent(follow.follower.username)}`
          : "/profile",
        createdAt: follow.createdAt,
        avatar: follow.follower.avatar,
      })),

    // Safe Likes
    ...postLikes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((l: any) => l.author)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((like: any) => ({
        id: `like-${like.id}`,
        type: "like" as const,
        title: `${like.author.name || like.author.username || (de ? "Jemand" : "Someone")} ${de ? "gefällt dein Beitrag" : "liked your post"}`,
        body: like.post.description || (de ? "Beitrag ansehen" : "View post"),
        context: `${de ? "Zu deinem Beitrag" : "On your post"}: ${like.post.description || (de ? "Unbenannter Beitrag" : "Untitled post")}`,
        href: `/posts/${like.post.id}`,
        createdAt: like.createdAt,
        avatar: like.author.avatar,
        image: like.post.image,
      })),

    // Likes on the current user's comments
    ...commentLikes.flatMap((like) => {
      const comment = likedCommentsById.get(like.commentId);
      const author = likeAuthorsByEmail.get(like.authorEmail);
      const post = comment ? likedPostsById.get(comment.postId) : null;
      if (!comment || !author || !post || comment.authorEmail !== currentUserProfile.email) {
        return [];
      }

      return [{
        id: `comment-like-${like.id}`,
        type: "like" as const,
        title: `${author.name || author.username || (de ? "Jemand" : "Someone")} ${de ? "gefällt dein Kommentar" : "liked your comment"}`,
        body: comment.text,
        context: `${de ? "Zu deinem Kommentar" : "On your comment"}: ${comment.text || (de ? "Unbenannter Kommentar" : "Untitled comment")}`,
        href: `/posts/${post.id}`,
        createdAt: like.createdAt,
        avatar: author.avatar,
        image: post.image,
      }];
    }),

    // Safe Comments
    ...comments
      .filter((c: any) => c.author)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((comment: any) => ({
        id: `comment-${comment.id}`,
        type: "comment" as const,
        title: `${comment.author.name || comment.author.username || (de ? "Jemand" : "Someone")} ${comment.parentCommentId ? (de ? "hat auf deinen Kommentar geantwortet" : "replied to your comment") : (de ? "hat deinen Beitrag kommentiert" : "commented on your post")}`,
        body: comment.text,
        context: comment.parentCommentId
          ? (de ? "Antwort auf deinen Kommentar" : "Reply to your comment")
          : `${de ? "Zu deinem Beitrag" : "On your post"}: ${comment.post.description || (de ? "Unbenannter Beitrag" : "Untitled post")}`,
        href: `/posts/${comment.post.id}#comment-${comment.parentCommentId || comment.id}`,
        createdAt: comment.createdAt,
        avatar: comment.author.avatar,
        image: comment.post.image,
      })),

    // Mentions that are not already shown as a comment/reply on the user's own post.
    ...mentions.flatMap((mention) => {
      const comment = mentionedCommentsById.get(mention.commentId);
      const author = comment ? mentionAuthorsByEmail.get(comment.authorEmail) : null;
      const post = comment ? mentionedPostsById.get(comment.postId) : null;
      if (!comment || !author || !post) return [];

      return [{
        id: `mention-${mention.id}`,
        type: "comment" as const,
        title: `${author.name || author.username || (de ? "Jemand" : "Someone")} ${de ? `hat dich in ${comment.parentCommentId ? "einer Antwort" : "einem Kommentar"} erwähnt` : `mentioned you in a ${comment.parentCommentId ? "reply" : "comment"}`}`,
        body: comment.text,
        context: comment.parentCommentId ? (de ? "Antwort mit Erwähnung" : "Reply mentioning you") : `${de ? "Zu einem Beitrag" : "On a post"}: ${post.description || (de ? "Unbenannter Beitrag" : "Untitled post")}`,
        href: `/posts/${post.id}#comment-${comment.parentCommentId || comment.id}`,
        createdAt: mention.createdAt,
        avatar: author.avatar,
        image: post.image,
      }];
    }),

    // Safe Messages
    ...conversations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((conv: any) => conv.messages.length > 0)
      .map((conversation: any) => {
        const message = conversation.messages[0];
        const otherParticipant = conversation.participants.find(
          (p: any) => p.profileId !== currentUserProfile.id,
        );
        const profile = message.sender || otherParticipant?.profile;

        return {
          id: `message-${message.id}`,
          type: "message" as const,
          title: `${profile?.name || profile?.username || (de ? "Jemand" : "Someone")} ${de ? "hat dir eine Nachricht gesendet" : "sent you a message"}`,
          body: message.body,
          context: `${de ? "Unterhaltung" : "Conversation"}: ${conversation.name || profile?.name || profile?.username || (de ? "Unterhaltung" : "Conversation")}`,
          href: `/messages/${conversation.id}`,
          createdAt: message.createdAt,
          avatar: profile?.avatar,
        };
      }),
  ];

  const sortedItems = items
    .map((item) => ({ ...item, isUnread: !currentUserProfile.activityReadAt || item.createdAt > currentUserProfile.activityReadAt }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 40);
  const unreadCount = sortedItems.filter((item) => item.isUnread).length;
  const groupedItems = sortedItems.reduce<ActivityGroup[]>((groups, item) => {
    const previous = groups.find((group) => activityGroupKey(group) === activityGroupKey(item));
    if (previous) {
      previous.count += 1;
      previous.unreadCount += item.isUnread ? 1 : 0;
    } else {
      groups.push({ ...item, count: 1, unreadCount: item.isUnread ? 1 : 0 });
    }
    return groups;
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl pb-24 md:pb-8">
      <ActivityReadOnOpen />
      <section className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="justify-self-start">
          <Link
            href="/home"
            className="group inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-slate-800 no-underline transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <MoveLeft />
            <span className="hidden sm:inline opacity-0 transition-opacity group-hover:opacity-100">
              {de ? "Zurück zur Startseite" : "Back to Home"}
            </span>
          </Link>
        </div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {de ? "Aktivität" : "Activity"}
        </h1>
        <div className="justify-self-end">
          <ActivityReadControl unreadCount={unreadCount} de={de} />
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
        {groupedItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-red-500 text-white">
              <Bell size={24} />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {de ? "Noch keine Aktivitäten." : "No activity yet."}
            </p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {de ? "Sobald jemand mit dir oder deinen Beiträgen interagiert, erscheint es hier." : "When someone interacts with you or your posts, it will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {groupedItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-gray-700 ${item.unreadCount ? "bg-orange-50/60 dark:bg-orange-500/5" : ""}`}
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <Image
                    src={item.avatar || img1.src}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                      <ActivityIcon type={item.type} />
                    </span>
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {groupedActivityTitle(item, de)}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {item.body}
                  </p>
                  {item.context ? (
                    <p className="mt-1 truncate text-xs font-medium text-slate-400 dark:text-slate-500">
                      {item.context}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {formatActivityDate(item.createdAt, de ? "de" : "en")}
                  </p>
                </div>

                {item.count > 1 && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{item.count}</span>}

                {item.image && (
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-slate-200 dark:bg-slate-700">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
