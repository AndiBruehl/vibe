import { prisma } from "@/db";
import type { Prisma } from ".prisma/client";
import { captionLinksToProfile } from "@/caption-links";
import { canViewTaggedPost } from "@/profile-tag-visibility";
import { readListWithFallback } from "@/read-list-fallback";

export const taggedPostInclude = {
  author: { select: { id: true, email: true, isPrivate: true } },
  topics: { include: { topic: true } },
} satisfies Prisma.PostInclude;

export type TaggedProfilePost = Prisma.PostGetPayload<{ include: typeof taggedPostInclude }>;

const taggedProfilePostInclude = { post: { include: taggedPostInclude } } satisfies Prisma.PostProfileTagInclude;
const taggedCommentMentionInclude = { comment: { include: { post: { include: taggedPostInclude } } } } satisfies Prisma.CommentMentionInclude;

type TaggedProfileTag = Prisma.PostProfileTagGetPayload<{ include: typeof taggedProfilePostInclude }>;
type TaggedCommentMention = Prisma.CommentMentionGetPayload<{ include: typeof taggedCommentMentionInclude }>;

export async function getVisibleTaggedProfilePosts({
  profileId,
  profileUsername,
  viewerEmail,
}: {
  profileId: string;
  profileUsername?: string | null;
  viewerEmail: string | null;
}): Promise<{ posts: TaggedProfilePost[]; failed: boolean }> {
  const [tagSource, captionSource, commentSource] = await Promise.all([
    readListWithFallback<TaggedProfileTag>(() => prisma.postProfileTag.findMany({
        where: { profileId },
        orderBy: { createdAt: "desc" },
        include: taggedProfilePostInclude,
      })),
    profileUsername ? readListWithFallback<TaggedProfilePost>(() => prisma.post.findMany({
        where: { isArchived: false, description: { contains: `@${profileUsername}`, mode: "insensitive" } },
        include: taggedPostInclude,
      })) : Promise.resolve({ rows: [] as TaggedProfilePost[], failed: false }),
    readListWithFallback<TaggedCommentMention>(() => prisma.commentMention.findMany({
        where: { profileId },
        include: taggedCommentMentionInclude,
      })),
  ]);
  const tags = tagSource.rows;
  const mentionedPosts = captionSource.rows;
  const commentMentions = commentSource.rows;
  let failed = tagSource.failed || captionSource.failed || commentSource.failed;

  const postsById = new Map<string, TaggedProfilePost>();
  for (const { post } of tags) postsById.set(post.id, post);
  for (const post of mentionedPosts) {
    if (captionLinksToProfile(post.description, profileUsername)) postsById.set(post.id, post);
  }
  for (const mention of commentMentions) postsById.set(mention.comment.post.id, mention.comment.post);
  const sourcePosts = [...postsById.values()].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  const authors = [...new Map(sourcePosts.flatMap((post) => post.author ? [[post.author.id, post.author] as const] : [])).values()];
  let viewer: { id: string } | null = null;
  if (viewerEmail) {
    try {
      viewer = await prisma.profile.findUnique({ where: { email: viewerEmail }, select: { id: true } });
      if (!viewer) failed = true;
    } catch {
      failed = true;
    }
  }
  const otherAuthorIds = authors.filter((author) => author.email !== viewerEmail).map((author) => author.id);
  let blockSource: { rows: { blockerId: string; blockedId: string }[]; failed: boolean } = { rows: [], failed: false };
  let followSource: { rows: { followingId: string }[]; failed: boolean } = { rows: [], failed: false };
  if (viewer && otherAuthorIds.length) {
    [blockSource, followSource] = await Promise.all([
        readListWithFallback<{ blockerId: string; blockedId: string }>(() => prisma.block.findMany({
          where: { OR: [
            { blockerId: viewer.id, blockedId: { in: otherAuthorIds } },
            { blockerId: { in: otherAuthorIds }, blockedId: viewer.id },
          ] },
          select: { blockerId: true, blockedId: true },
        })),
        readListWithFallback<{ followingId: string }>(() => prisma.follow.findMany({ where: { followerId: viewer.id, followingId: { in: otherAuthorIds } }, select: { followingId: true } })),
      ]);
  }
  if (blockSource.failed || followSource.failed) failed = true;
  const blocks = blockSource.failed && viewer
    ? authors.map((author) => ({ blockerId: viewer.id, blockedId: author.id }))
    : blockSource.rows;
  const followedAuthorIds = new Set(followSource.rows.map((follow) => follow.followingId));
  const blockedAuthorIds = new Set(blocks.flatMap((block) => [block.blockerId, block.blockedId]));

  return {
    posts: sourcePosts.filter((post) => {
      const author = post.author;
      return canViewTaggedPost({
        archived: post.isArchived,
        authorId: author?.id ?? null,
        authorEmail: author?.email ?? post.authorEmail,
        authorIsPrivate: author?.isPrivate,
      }, {
        email: viewerEmail,
        isGuest: !viewerEmail,
        isBlocked: Boolean(viewerEmail && !viewer) || Boolean(author && author.email !== viewerEmail && blockedAuthorIds.has(author.id)),
        followsAuthor: Boolean(author && followedAuthorIds.has(author.id)),
      });
    }),
    failed,
  };
}
