export const DEFAULT_AVATAR_ACCENT = "#f97316";

export const AVATAR_ACCENT_PRESETS = [
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#eab308",
] as const;

export function normalizeAvatarAccent(value: unknown) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toLowerCase()
    : DEFAULT_AVATAR_ACCENT;
}
