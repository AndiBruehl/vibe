import Link from "next/link";
import { Follow, Profile } from "@prisma/client";
import { Avatar } from "@radix-ui/themes";
import { PlusIcon } from "lucide-react";

type HomeTopRowProps = {
  follows: Follow[];
  profiles: Profile[];
};

export default async function HomeTopRow({
  follows,
  profiles,
}: HomeTopRowProps) {
  const followedProfiles =
    follows.length > 0
      ? follows
          .map((follow) =>
            profiles.find((profile) => profile.id === follow.followingId),
          )
          .filter((profile): profile is Profile => Boolean(profile))
      : profiles;

  return (
    <section className="-mx-4 px-4 md:mx-0 md:px-0">
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4 md:gap-5">
          <div className="flex w-24 shrink-0 flex-col items-center">
            <button
              type="button"
              className="group flex size-[88px] items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-red-500 to-yellow-500 text-white shadow-lg shadow-black/20 transition duration-200 hover:scale-[1.03] hover:shadow-xl"
            >
              <PlusIcon
                size={34}
                className="transition duration-200 group-hover:rotate-90"
              />
            </button>
            <p className="mt-2 text-center text-xs font-medium text-zinc-400">
              New Story
            </p>
          </div>

          {followedProfiles.map((profile) => (
            <Link
              key={profile.id}
              href={profile.username ? `/profile/${profile.username}` : "#"}
              className="group flex w-24 shrink-0 flex-col items-center"
            >
              <div className="rounded-full bg-gradient-to-br from-red-500 to-yellow-500 p-[3px] shadow-md shadow-black/20 transition duration-200 group-hover:scale-[1.04]">
                <div className="rounded-full bg-white p-1 dark:bg-black">
                  <Avatar
                    size="6"
                    radius="full"
                    fallback={(profile.username?.[0] || "?").toUpperCase()}
                    src={profile.avatar || ""}
                    className="rounded-full object-cover"
                  />
                </div>
              </div>

              <p className="mt-2 w-full truncate px-1 text-center text-xs font-medium text-zinc-400 transition duration-200 group-hover:text-white">
                {profile.username || profile.name || "Unknown"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
