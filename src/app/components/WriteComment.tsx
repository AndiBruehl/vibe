import { auth } from "@/auth";
import { prisma } from "@/db";
import { Button, TextArea } from "@radix-ui/themes";
import Image from "next/image";
import defaultImg from "./default.jpg";
import { postComment } from "@/actions";

type WriteCommentProps = {
  postId: string;
};

export default async function WriteComment({ postId }: WriteCommentProps) {
  const session = await auth();

  if (!session?.user?.email) return null;

  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: {
      avatar: true,
      username: true,
      name: true,
    },
  });

  if (!profile) return null;

  return (
    <form
      action={postComment}
      className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
    >
      <input type="hidden" name="postId" value={postId} />

      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <Image
            src={profile.avatar || defaultImg}
            alt={profile.username || profile.name || "user avatar"}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
          />
        </div>

        <div className="flex-1">
          <TextArea
            name="text"
            placeholder="Write a comment..."
            className="w-full"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Post Comment</Button>
      </div>
    </form>
  );
}
