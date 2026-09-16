export const DEFAULT_AVATAR_ACCENT = "#f97316";
export const DEFAULT_PROFILE_ACCENT = "#f97316";
export const PROFILE_HEADER_LAYOUTS = ["standard", "compact", "spotlight"] as const;
export type ProfileHeaderLayout = (typeof PROFILE_HEADER_LAYOUTS)[number];
export const PROFILE_HEADER_BACKGROUND_MODES = ["none", "image", "color"] as const;
export type ProfileHeaderBackgroundMode = (typeof PROFILE_HEADER_BACKGROUND_MODES)[number];
export const DEFAULT_PROFILE_HEADER_BACKGROUND_COLOR = "#4f46e5";

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

export function normalizeProfileHeaderLayout(value: unknown): ProfileHeaderLayout {
  return typeof value === "string" && (PROFILE_HEADER_LAYOUTS as readonly string[]).includes(value)
    ? value as ProfileHeaderLayout
    : "standard";
}

export function normalizeProfileHeaderBackgroundMode(value: unknown): ProfileHeaderBackgroundMode {
  return typeof value === "string" && (PROFILE_HEADER_BACKGROUND_MODES as readonly string[]).includes(value)
    ? value as ProfileHeaderBackgroundMode
    : "none";
}

export function normalizeProfileHeaderBackgroundImage(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function profileHeaderBackgroundStyle(mode: unknown, image: unknown, color: unknown, end: unknown) {
  const backgroundMode = normalizeProfileHeaderBackgroundMode(mode);
  const start = normalizeProfileAccent(color ?? DEFAULT_PROFILE_HEADER_BACKGROUND_COLOR);
  const endColor = typeof end === "string" && /^#[0-9a-fA-F]{6}$/.test(end) ? end.toLowerCase() : null;
  if (backgroundMode === "image") {
    const imageUrl = normalizeProfileHeaderBackgroundImage(image);
    if (imageUrl) return { backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.34), rgba(15, 23, 42, 0.68)), url("${imageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (backgroundMode === "color") return { backgroundImage: endColor ? `linear-gradient(135deg, ${start}, ${endColor})` : undefined, backgroundColor: endColor ? undefined : start };
  return undefined;
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
