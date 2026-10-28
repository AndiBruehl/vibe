export type TaggedPostVisibilityInput = {
  archived: boolean;
  authorId: string | null;
  authorEmail: string | null;
  authorIsPrivate: boolean | null | undefined;
};

export type TaggedPostViewer = {
  email: string | null;
  isGuest: boolean;
  isBlocked: boolean;
  followsAuthor: boolean;
};

export function canViewTaggedPost(post: TaggedPostVisibilityInput, viewer: TaggedPostViewer): boolean {
  if (post.archived || !post.authorId || !post.authorEmail || viewer.isBlocked) return false;
  if (viewer.isGuest) return post.authorIsPrivate === false;
  if (viewer.email === post.authorEmail) return true;
  if (post.authorIsPrivate === true) return viewer.followsAuthor;
  return true;
}
