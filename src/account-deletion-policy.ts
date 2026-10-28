export type SelfDeletionProfile = { email: string; isSystem: boolean };
export type SelfDeletionBlocker = "unauthenticated" | "unconfirmed" | "missing-profile" | "not-owner" | "protected-account";

export function getSelfDeletionBlocker(
  actorEmail: string | null | undefined,
  confirmation: unknown,
  target: SelfDeletionProfile | null,
  isProtectedAdmin: (email: string) => boolean,
): SelfDeletionBlocker | null {
  if (!actorEmail) return "unauthenticated";
  if (confirmation !== "DELETE") return "unconfirmed";
  if (!target) return "missing-profile";
  if (target.email.toLowerCase() !== actorEmail.toLowerCase()) return "not-owner";
  if (target.isSystem || isProtectedAdmin(target.email.toLowerCase())) return "protected-account";
  return null;
}
