const DEFAULT_ORIGIN = "https://vibe-social-network.vercel.app";
const DESCRIPTION_LIMIT = 160;

export function publicBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || DEFAULT_ORIGIN).replace(/\/$/, "");
}

export function plainTextSummary(value: string | null | undefined, fallback: string, limit = DESCRIPTION_LIMIT) {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

export function absolutePublicUrl(path: string) {
  return `${publicBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function publicImageUrl(value: string | null | undefined) {
  if (!value) return absolutePublicUrl("/logo.svg");
  try { return new URL(value, publicBaseUrl()).toString(); } catch { return absolutePublicUrl("/logo.svg"); }
}
