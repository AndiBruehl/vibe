import HomePosts from "./../components/HomePosts";
import HomeTopRow from "./../components/HomeTopRow";
import { prisma } from "@/db";
import { Session } from "next-auth";

type UserHomeProps = {
  session: Session;
};

export default async function UserHome({ session }: UserHomeProps) {
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

  return (
    <div className="flex flex-col gap-8">
      <HomeTopRow follows={follows} profiles={profiles} />
      <HomePosts follows={follows} profiles={profiles} />
    </div>
  );
}
