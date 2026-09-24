export const CURATED_PROFILE_BADGES = [
  { key: "early-member", label: "EARLY MEMBER", labelDe: "EARLY MEMBER" },
  { key: "community-star", label: "COMMUNITY STAR", labelDe: "COMMUNITY STAR" },
  { key: "creator", label: "CREATOR", labelDe: "CREATOR" },
] as const;

export type CuratedProfileBadge = typeof CURATED_PROFILE_BADGES[number]["key"];

export function isCuratedProfileBadge(value: unknown): value is CuratedProfileBadge {
  return typeof value === "string" && CURATED_PROFILE_BADGES.some((badge) => badge.key === value);
}

export type CustomProfileBadge = { id: string; icon: string; label: string };
export function parseCustomProfileBadge(value: unknown): CustomProfileBadge | null {
  if (typeof value !== "string" || !value.startsWith("custom:")) return null;
  const [, id, icon, ...labelParts] = value.split(":");
  const label = labelParts.join(":").trim();
  return /^[a-z0-9-]{4,32}$/i.test(id || "") && icon && Array.from(icon).length <= 8 && label.length > 0 && label.length <= 32 ? { id: id!, icon, label } : null;
}
