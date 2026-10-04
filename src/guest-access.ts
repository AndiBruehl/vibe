// An allowlist keeps new member routes private by default.
export function guestDestination(path: string): string | null {
  if (path === "/home") return "/guest";
  const profile = /^\/profile\/([^/]+)$/.exec(path);
  if (profile) return `/guest/profile/${profile[1]}`;
  const post = /^\/posts\/([a-f\d]{24})$/i.exec(path);
  if (post) return `/guest/posts/${post[1]}`;
  return null;
}

export function isGuestPage(path: string) {
  return path === "/" || path === "/join" || path === "/account/confirm" || path === "/guest" || /^\/guest\/(profile\/[^/]+|posts\/[a-f\d]{24})$/i.test(path);
}

export function isPublicAsset(path: string) {
  return path.startsWith("/_next/") || path.startsWith("/releases/") || /^\/(logo[^/]*\.(svg|png)|default\.jpg|secret-x-cursor\.svg|favicon\.ico|robots\.txt|sitemap\.xml)$/.test(path);
}
