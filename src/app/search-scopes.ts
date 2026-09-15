export const searchScopes = ["all", "profiles", "posts", "tags", "admins"] as const;

export type SearchScope = (typeof searchScopes)[number];
