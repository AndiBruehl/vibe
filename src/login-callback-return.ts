// Only linking errors return to Settings. Normal sign-in keeps Auth.js behavior.
export function linkingErrorReturn(requestUrl: string, linkToken: string | undefined, location: string | null) {
  const request = new URL(requestUrl);
  if (!/^\/api\/auth\/callback\/(google|discord)$/.test(request.pathname)
    || !linkToken || !/^[a-f0-9]{64}$/.test(linkToken) || !location) return null;
  const destination = new URL(location, request.origin);
  if (destination.origin !== request.origin || !destination.searchParams.has("error")) return null;
  const result = new URL("/settings/login", request.origin);
  result.searchParams.set("notice", destination.searchParams.get("error") === "AccessDenied" ? "cancelled" : "linkfailed");
  return result.toString();
}
