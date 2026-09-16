export const DEFAULT_AVATAR_ACCENT = "#f97316";
export const DEFAULT_PROFILE_ACCENT = "#f97316";

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
export const AVATAR_FRAME_DIRECTIONS = ["to-bottom-right", "to-bottom-left", "to-top-right", "to-top-left"] as const;
export type AvatarFrameDirection = (typeof AVATAR_FRAME_DIRECTIONS)[number];

const AVATAR_FRAME_VALUES = new Set<string>([...AVATAR_ACCENT_PRESETS, ...AVATAR_FRAME_GRADIENTS]);

export function normalizeAvatarAccent(value: unknown): AvatarFrameValue {
  if (typeof value === "string" && AVATAR_FRAME_VALUES.has(value.toLowerCase())) return value.toLowerCase() as AvatarFrameValue;
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toLowerCase() as AvatarFrameValue
    : DEFAULT_AVATAR_ACCENT;
}

export function normalizeProfileAccent(value: unknown) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toLowerCase()
    : DEFAULT_PROFILE_ACCENT;
}

export function normalizeAvatarFrameDirection(value: unknown): AvatarFrameDirection {
  return typeof value === "string" && (AVATAR_FRAME_DIRECTIONS as readonly string[]).includes(value)
    ? value as AvatarFrameDirection
    : "to-bottom-right";
}

export function avatarFrameConfig(value: unknown, end?: unknown, direction?: unknown) {
  if (value === "gradient-orange-yellow") return { start: "#f97316", end: "#eab308", direction: "to-bottom-right" as AvatarFrameDirection };
  if (value === "gradient-yellow-orange") return { start: "#eab308", end: "#f97316", direction: "to-bottom-right" as AvatarFrameDirection };
  const normalizedEnd = typeof end === "string" && /^#[0-9a-fA-F]{6}$/.test(end) ? end.toLowerCase() : null;
  return { start: normalizeAvatarAccent(value), end: normalizedEnd, direction: normalizeAvatarFrameDirection(direction) };
}

export function avatarFrameStyle(value: unknown, end?: unknown, direction?: unknown) {
  const frame = avatarFrameConfig(value, end, direction);
  if (frame.end) {
    const cssDirection: Record<AvatarFrameDirection, string> = { "to-bottom-right": "135deg", "to-bottom-left": "225deg", "to-top-right": "45deg", "to-top-left": "315deg" };
    return { backgroundImage: `linear-gradient(${cssDirection[frame.direction]}, ${frame.start}, ${frame.end})` };
  }
  return { backgroundColor: frame.start };
}
