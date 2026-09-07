import { toggleFollow } from "@/actions";

type FollowButtonProps = {
  targetProfileId: string;
  targetUsername: string;
  isFollowing: boolean;
};

export default function FollowButton({
  targetProfileId,
  targetUsername,
  isFollowing,
}: FollowButtonProps) {
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="targetProfileId" value={targetProfileId} />
      <input type="hidden" name="targetUsername" value={targetUsername} />

      <button
        type="submit"
        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
          isFollowing
            ? "border border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            : "bg-linear-to-r from-red-500 to-yellow-500 text-white hover:scale-[1.02]"
        }`}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </form>
  );
}
