export const profileSortOptions = [
  { value: "newest", label: "Newest to oldest" },
  { value: "oldest", label: "Oldest to newest" },
  { value: "az", label: "A to Z" },
  { value: "za", label: "Z to A" },
] as const;

export type PublicProfile = {
  id: string; name: string | null; username: string | null;
  avatar: string | null; subtitle: string | null; bio: string | null;
};

export function sortProfiles<T extends Pick<PublicProfile, "id" | "name" | "username">>(profiles: T[], sort: string) {
  const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
  return [...profiles].sort((a, b) => {
    if (sort === "az" || sort === "za") {
      const order = collator.compare(a.name?.trim() || a.username || "Unnamed profile", b.name?.trim() || b.username || "Unnamed profile");
      return (sort === "za" ? -order : order) || a.id.localeCompare(b.id);
    }
    // MongoDB ObjectIds preserve profile creation order without a schema migration.
    return sort === "oldest" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
  });
}
