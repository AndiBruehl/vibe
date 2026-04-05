import { prisma } from "@/db";
import PostGrid from "./PostGrid";

export default async function ProfilePosts({ email }: { email: string }) {
  const posts = await prisma.post.findMany({
    where: {
      author: email,
    },
  });

  return <PostGrid posts={posts} />;
}
