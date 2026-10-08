export type PendingLogin = { state: string; startedAt: number; linking?: boolean };

export function parseLoginCallback(value: string, pending: PendingLogin | null, now = Date.now()) {
  const url = new URL(value);
  if (url.protocol !== "vibe:" || url.hostname !== "auth" || (url.pathname && url.pathname !== "/")) {
    throw new Error("The sign-in response was invalid. Please try again.");
  }
  if (!pending || !Number.isFinite(pending.startedAt) || typeof pending.state !== "string" || !pending.state || now - pending.startedAt > 10 * 60 * 1000 || now < pending.startedAt ||
      url.searchParams.get("state") !== pending.state) {
    throw new Error("This sign-in attempt has expired. Please start again.");
  }
  const error = url.searchParams.get("error");
  if (error) throw new Error(error);
  if (pending.linking && url.searchParams.get("linked") === "1") return "linked";
  const token = url.searchParams.get("token");
  if (!token) throw new Error("VIBE did not return a mobile session. Please try again.");
  return token;
}
