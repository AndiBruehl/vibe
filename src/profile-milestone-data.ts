export const PROFILE_MILESTONES = [
  { key: "first-post", title: "First post", criterion: "Publish your first post." },
  { key: "first-story", title: "First story", criterion: "Share your first story." },
  { key: "hundred-likes", title: "100 likes", criterion: "Receive 100 likes across your posts." },
  { key: "one-year", title: "One year on VIBE", criterion: "Be part of VIBE for one year." },
] as const;
export type ProfileMilestone = typeof PROFILE_MILESTONES[number]["key"];
export function isProfileMilestone(value: unknown): value is ProfileMilestone { return typeof value === "string" && PROFILE_MILESTONES.some((item) => item.key === value); }
