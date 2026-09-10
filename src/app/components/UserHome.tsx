import HomePosts from "./../components/HomePosts";
import StoriesBar from "./StoriesBar";
import { prisma } from "@/db";
import { Session } from "next-auth";

type UserHomeProps = {
  session: Session;
  feedMode: "following" | "for-you";
};

export default async function UserHome({ session, feedMode }: UserHomeProps) {
  const viewerEmail = session.user?.email;

  if (!viewerEmail) {
    return null;
  }

  const viewerProfile = await prisma.profile.findUnique({
    where: {
      email: viewerEmail,
    },
  });

  if (!viewerProfile) {
    return null;
  }

  const follows = await prisma.follow.findMany({
    where: {
      followerId: viewerProfile.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const followedProfileIds = follows.map((follow) => follow.followingId);

  const profiles =
    followedProfileIds.length > 0
      ? await prisma.profile.findMany({
          where: {
            id: {
              in: followedProfileIds,
            },
          },
        })
      : [];

  const storyEmails = [...new Set([viewerEmail, ...profiles.map((profile) => profile.email).filter((email): email is string => Boolean(email))])];
  const activeStories = await prisma.story.findMany({
    where: { authorEmail: { in: storyEmails }, expiresAt: { gt: new Date() } },
    include: { slides: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  const seenStories = activeStories.length
    ? await prisma.storyView.findMany({ where: { viewerEmail, storyId: { in: activeStories.map((story) => story.id) } }, select: { storyId: true } })
    : [];
  const profilesByEmail = new Map([viewerProfile, ...profiles].map((profile) => [profile.email, profile]));
  const seenStoryIds = new Set(seenStories.map((view) => view.storyId));
  const groupedStories = new Map<string, {
    id: string;
    authorEmail: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string | null;
    slides: { id: string; storyId: string; imageUrl: string }[];
    storyIds: string[];
  }>();
  // Multiple uploads by the same person belong to one visible story ring.
  for (const story of [...activeStories].reverse()) {
    const author = profilesByEmail.get(story.authorEmail);
    if (!author) continue;
    const group = groupedStories.get(story.authorEmail) ?? {
      id: story.authorEmail,
      authorEmail: story.authorEmail,
      authorName: author.name || "VIBE member",
      authorUsername: author.username || "",
      authorAvatar: author.avatar,
      slides: [] as { id: string; storyId: string; imageUrl: string }[],
      storyIds: [] as string[],
    };
    group.storyIds.push(story.id);
    group.slides.push(...story.slides.map((slide) => ({ id: slide.id, storyId: story.id, imageUrl: slide.imageUrl })));
    groupedStories.set(story.authorEmail, group);
  }
  const stories = [...groupedStories.values()].map((story) => ({
    ...story,
    seen: story.storyIds.every((id) => seenStoryIds.has(id)),
  }));

  return (
    <div className="flex flex-col gap-8">
      <StoriesBar stories={stories} viewerEmail={viewerEmail} />
      <HomePosts follows={follows} profiles={profiles} feedMode={feedMode} />
    </div>
  );
}
