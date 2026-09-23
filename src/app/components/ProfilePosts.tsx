import PostImageCount from "@/app/components/PostImageCount";
import SortablePosts from "./SortablePosts";
import { prisma } from "@/db";
import Link from "next/link"; // Re-enable topic chips
import ProgressiveImage from "./ProgressiveImage";
import PostThumbnail from "./PostThumbnail";
import { getPostMediaTypes } from "@/post-images";
import PinnedProfilePosts from "./PinnedProfilePosts";

export default async function ProfilePosts({ email, language = "en", canManagePins = false }: { email: string; language?: "de" | "en"; canManagePins?: boolean }) {
  let posts: Awaited<ReturnType<typeof prisma.post.findMany>> = [];
  let postLoadFailed = false;
  try {
    posts = await prisma.post.findMany({
      where: { authorEmail: email, isArchived: false },
      orderBy: { createdAt: "desc" },
      include: { topics: { include: { topic: true } } },
    });
  } catch {
    // The pin section and normal feed fail independently, so one transient query
    // failure does not hide otherwise available profile content.
    postLoadFailed = true;
  }

  if (posts.length === 0 && !canManagePins && !postLoadFailed) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
        <p className="text-slate-600 dark:text-slate-300">{language === "de" ? "Noch keine Beiträge." : "No posts yet."}</p>
      </div>
    );
  }

  return (
    <>
    <PinnedProfilePosts email={email} language={language} canManage={canManagePins} />
    {postLoadFailed ? <div role="status" className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-md shadow-gray-200 dark:bg-gray-800 dark:text-slate-300 dark:shadow-gray-900">{language === "de" ? "Beiträge konnten gerade nicht geladen werden. Bitte versuche es erneut." : "Posts could not be loaded right now. Please try again."}</div> : posts.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900"><p className="text-slate-600 dark:text-slate-300">{language === "de" ? "Noch keine Beiträge." : "No posts yet."}</p></div> : <SortablePosts posts={posts.map((post) => ({ id: post.id, description: post.description, createdAt: post.createdAt }))} className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {posts.map((post) => (
        <article
          key={post.id}
          className="group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900"
        >
          <div>
            <div className="relative aspect-square w-full overflow-hidden">
              <PostImageCount images={post.images}/>
              <PostThumbnail href={`/posts/${post.id}`} src={post.image} mediaType={getPostMediaTypes(post)[0]} alt={post.description || "Post media"} />
            </div>

            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                {post.description || "No description"}
              </p>
            </div>
          </div>

          <div className="space-y-2 px-3 pb-3">
            {post.topics?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.topics.map((postTopic) => (
                  <Link
                    key={postTopic.id}
                    href={`/topics/${postTopic.topic.slug}`}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 no-underline hover:underline"
                  >
                    #{postTopic.topic.name}
                  </Link>
                ))}
              </div>
            )}

            <Link href={`/posts/${post.id}`} className="block">
              <div className="flex items-center justify-between text-xs text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <span>{post.likesCount} likes</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          </div>
        </article>
      ))}
    </SortablePosts>}
    </>
  );
}
