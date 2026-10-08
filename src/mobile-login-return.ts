export const mobileLoginCookie = "vibe-mobile-login";

export function mobileRedirect(value: string | null) {
  try {
    const url = new URL(value || "");
    if (url.protocol !== "vibe:" || url.hostname !== "auth" || (url.pathname && url.pathname !== "/") || url.username || url.password || url.port) return null;
    const state = url.searchParams.get("state");
    if (!state || !/^[a-zA-Z0-9_-]{16,128}$/.test(state)) return null;
    return `vibe://auth?state=${encodeURIComponent(state)}`;
  } catch { return null; }
}

export function mobileErrorReturn(requestUrl: string, cookie: string | undefined, location: string | null, now = Date.now()) {
  if (!cookie || !location) return null;
  try {
    const request = new URL(requestUrl);
    const pending = JSON.parse(cookie);
    if (!['google', 'discord'].includes(pending.provider) || request.pathname !== `/api/auth/callback/${pending.provider}` ||
      !Number.isFinite(pending.startedAt) || now < pending.startedAt || now - pending.startedAt > 600000) return null;
    const redirect = mobileRedirect(pending.redirectUri);
    const destination = new URL(location, request.origin);
    if (!redirect || destination.origin !== request.origin || !(destination.searchParams.has('error') || destination.searchParams.has('notice'))) return null;
    const reason = destination.searchParams.get('notice') || destination.searchParams.get('error');
    const result = new URL(redirect);
    if (reason === 'linked') {
      if (!pending.linking) return null;
      result.searchParams.set('linked', '1');
      return result.toString();
    }
    result.searchParams.set('error', reason === 'AccessDenied' ? 'Sign-in was cancelled. Please try again.' :
      reason === 'conflict' ? 'This sign-in method belongs to another VIBE profile. Your existing profile was kept.' :
      reason === 'expired' ? 'This linking attempt expired. Please start again in Settings.' :
      reason === 'link' ? 'This account already exists. Sign in with its existing method, then link the other provider in Settings.' :
      'Sign-in could not be completed. Please try again.');
    return result.toString();
  } catch { return null; }
}

export function matchesMobileAttempt(cookie: string | undefined, redirect: string, now = Date.now()) {
  try {
    const pending = JSON.parse(cookie || '');
    return ['google', 'discord'].includes(pending.provider) && !pending.linking && Number.isFinite(pending.startedAt) &&
      now >= pending.startedAt && now - pending.startedAt <= 600000 && mobileRedirect(pending.redirectUri) === redirect;
  } catch { return false; }
}
