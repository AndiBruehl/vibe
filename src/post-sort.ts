export const POST_SORT_OPTIONS = [
  ["newest", "Newest to oldest"],
  ["oldest", "Oldest to newest"],
  ["az", "A to Z"],
  ["za", "Z to A"],
] as const;
export type PostSort = (typeof POST_SORT_OPTIONS)[number][0];
export type SortablePost = {
  id: string;
  description?: string | null;
  createdAt: Date | string;
};
const collator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});
export function sortPostIndices(posts: SortablePost[], order: PostSort) {
  return posts
    .map((_, i) => i)
    .sort((a, b) => {
      const first = posts[a],
        second = posts[b];
      const comparison =
        order === "az" || order === "za"
          ? collator.compare(
              first.description?.trim() || "",
              second.description?.trim() || "",
            ) * (order === "az" ? 1 : -1)
          : (new Date(first.createdAt).getTime() -
              new Date(second.createdAt).getTime()) *
            (order === "oldest" ? 1 : -1);
      return comparison || first.id.localeCompare(second.id);
    });
}
