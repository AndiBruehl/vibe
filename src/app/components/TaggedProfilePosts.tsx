import Link from "next/link";
import { getPostMediaTypes } from "@/post-images";
import MentionText from "@/app/components/MentionText";
import PostImageCount from "@/app/components/PostImageCount";
import PostThumbnail from "@/app/components/PostThumbnail";
import { getVisibleTaggedProfilePosts } from "@/tagged-profile-posts";

type TaggedProfilePostsProps = {
  profileId: string;
  profileUsername?: string | null;
  viewerEmail: string | null;
  language?: "de" | "en";
};

export default async function TaggedProfilePosts({ profileId, profileUsername, viewerEmail, language = "en" }: TaggedProfilePostsProps) {
  const result = await getVisibleTaggedProfilePosts({ profileId, profileUsername, viewerEmail });
  const posts = result.posts;
  if (result.failed && posts.length === 0) {
    return <div role="status" className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-md shadow-gray-200 dark:bg-gray-800 dark:text-slate-300 dark:shadow-gray-900">{language === "de" ? "Markierte Beiträge konnten gerade nicht geladen werden. Bitte versuche es erneut." : "Tagged posts could not be loaded right now. Please try again."}</div>;
  }

  if (!posts.length) {
    return <div className="rounded-2xl bg-white p-8 text-center shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900"><p className="text-slate-600 dark:text-slate-300">{language === "de" ? "Beiträge, in denen du markiert oder erwähnt wirst, erscheinen hier, sofern du sie sehen darfst." : "Posts that tag or mention you appear here when you are allowed to view them."}</p></div>;
  }

  return <>
    {result.failed && <div role="status" className="mb-4 rounded-2xl bg-white p-4 text-center text-sm text-slate-600 shadow-md shadow-gray-200 dark:bg-gray-800 dark:text-slate-300 dark:shadow-gray-900">{language === "de" ? "Einige markierte Beiträge konnten gerade nicht geladen werden." : "Some tagged posts could not be loaded right now."}</div>}
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
    {posts.map((post) => <article key={post.id} className="group overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 transition hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800 dark:shadow-gray-900">
      <div className="relative aspect-square w-full overflow-hidden">
        <PostImageCount images={post.images}/>
        <PostThumbnail href={`/posts/${post.id}`} src={post.image} mediaType={getPostMediaTypes(post)[0]} alt={post.description || "Post media"}/>
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200"><MentionText text={post.description || (language === "de" ? "Ohne Beschreibung" : "No description")}/></p>
        {post.topics.length > 0 && <div className="flex flex-wrap gap-2">{post.topics.map(({ id, topic }) => <Link key={id} href={`/topics/${topic.slug}`} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 no-underline hover:underline dark:bg-slate-700 dark:text-slate-200">#{topic.name}</Link>)}</div>}
        <Link href={`/posts/${post.id}`} className="block text-xs text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <span>{post.author?.email === viewerEmail ? (language === "de" ? "Dein Beitrag" : "Your post") : (language === "de" ? "Beitrag öffnen" : "Open post")}</span>
          <span className="float-right">{new Date(post.createdAt).toLocaleDateString(language === "de" ? "de-DE" : "en-US")}</span>
        </Link>
      </div>
    </article>)}
    </div>
  </>;
}
