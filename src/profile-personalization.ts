export const DEFAULT_AVATAR_ACCENT = "#f97316";

export const AVATAR_ACCENT_PRESETS = [
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#eab308",
] as const;

export const AVATAR_FRAME_GRADIENTS = [
  "gradient-orange-yellow",
  "gradient-yellow-orange",
] as const;

export type AvatarFrameValue = (typeof AVATAR_ACCENT_PRESETS)[number] | (typeof AVATAR_FRAME_GRADIENTS)[number];

const AVATAR_FRAME_VALUES = new Set<string>([...AVATAR_ACCENT_PRESETS, ...AVATAR_FRAME_GRADIENTS]);

export function normalizeAvatarAccent(value: unknown): AvatarFrameValue {
  if (typeof value === "string" && AVATAR_FRAME_VALUES.has(value.toLowerCase())) return value.toLowerCase() as AvatarFrameValue;
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toLowerCase() as AvatarFrameValue
    : DEFAULT_AVATAR_ACCENT;
}

export function avatarFrameStyle(value: unknown) {
  const frame = normalizeAvatarAccent(value);
  if (frame === "gradient-orange-yellow") return { backgroundImage: "linear-gradient(135deg, #f97316, #eab308)" };
  if (frame === "gradient-yellow-orange") return { backgroundImage: "linear-gradient(135deg, #eab308, #f97316)" };
  return { backgroundColor: frame };
}
