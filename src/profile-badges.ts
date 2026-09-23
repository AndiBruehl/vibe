export const CURATED_PROFILE_BADGES = [
  { key: "early-member", label: "EARLY MEMBER", labelDe: "EARLY MEMBER" },
  { key: "community-star", label: "COMMUNITY STAR", labelDe: "COMMUNITY STAR" },
  { key: "creator", label: "CREATOR", labelDe: "CREATOR" },
] as const;

export type CuratedProfileBadge = typeof CURATED_PROFILE_BADGES[number]["key"];

export function isCuratedProfileBadge(value: unknown): value is CuratedProfileBadge {
  return typeof value === "string" && CURATED_PROFILE_BADGES.some((badge) => badge.key === value);
}
