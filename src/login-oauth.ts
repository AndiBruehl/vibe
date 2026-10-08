import { prisma } from "@/db";
import { identityId, credentialId, issueProof, loginRate } from "@/login-store";
import { normalizeEmail, secretDigest } from "@/auth-security";
import { randomUUID } from "node:crypto";

export async function resolveOAuth(provider: string, accountId: string, emailInput: unknown, verified: boolean, linkToken?: string, name?: string | null) {
  const id = identityId(provider, accountId);
  const identity = await prisma.loginIdentity.findUnique({ where: { id } });
  if (linkToken && !/^[a-f0-9]{64}$/.test(linkToken)) return { redirect: "/settings/login?notice=expired" };
  if (linkToken && /^[a-f0-9]{64}$/.test(linkToken)) {
    const proofId = secretDigest(linkToken);
    const proof = await prisma.loginProof.findUnique({ where: { id: proofId } });
    if (proof?.kind === "link" && proof.provider === provider && proof.expiresAt > new Date()) {
      const linked = await prisma.$transaction(async (tx) => {
        if (identity && identity.email !== proof.email) {
          const otherOwner = await tx.profile.findUnique({ where: { email: identity.email }, select: { id: true } });
          if (otherOwner) return false;
        }
        const claimed = await tx.loginProof.deleteMany({ where: { id: proofId, expiresAt: { gt: new Date() } } });
        if (claimed.count !== 1) throw Error("Link expired");
        const owner = await tx.profile.findUnique({ where: { email: proof.email }, select: { id: true } });
        if (!owner) throw Error("Account missing");
        if (identity) await tx.loginIdentity.update({ where: { id }, data: { email: proof.email } });
        else await tx.loginIdentity.create({ data: { id, email: proof.email, provider } });
        return true;
      });
      return { redirect: linked ? "/settings/login?notice=linked" : "/settings/login?notice=conflict" };
    }
    // An expired linking attempt must never silently create a separate account.
    return { redirect: "/settings/login?notice=expired" };
  }
  if (identity) {
    const owner = await prisma.profile.findUnique({ where: { email: identity.email }, select: { email: true } });
    if (owner) return { email: owner.email };
    // The stored email belongs to the former VIBE owner, not necessarily the
    // provider (explicit linking supports different emails). After deletion,
    // register against the provider's currently verified email instead.
    if (!verified || !normalizeEmail(emailInput)) {
      return { redirect: "/join?notice=email" };
    }
    await prisma.loginIdentity.deleteMany({ where: { id, email: identity.email } });
  }
  const email = normalizeEmail(emailInput);
  if (!email) return { redirect: "/join?notice=email" };
  const existing = await prisma.profile.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { email: true } });
  if (existing) {
    // A second provider must be explicitly linked from the signed-in account.
    // Only bootstrap old Google-only profiles that predate identity records.
    const known = await prisma.loginIdentity.findFirst({ where: { email: existing.email }, select: { id: true } });
    const password = await prisma.loginCredential.findUnique({ where: { id: credentialId(email) }, select: { id: true } });
    if (provider !== "google" || !verified || known || password) return { redirect: "/join?notice=link" };
    await prisma.loginIdentity.create({ data: { id, provider, email: existing.email } });
    return { email: existing.email };
  }
  if (!verified) {
    if (provider !== "microsoft-entra-id") return { redirect: "/join?notice=email" };
    if (await loginRate(`oauth-mail:${email}`, 3)) await issueProof(email, "oauth", false, { provider, identityId: id });
    return { redirect: "/join?notice=verify" };
  }
  await prisma.$transaction(async (tx) => {
    const base = email.split("@")[0].replace(/[^a-z0-9_-]/g, "").slice(0, 20) || "user";
    await tx.profile.create({ data: { email, name: name || null, username: `${base}-${randomUUID().slice(0, 8)}` } });
    await tx.loginIdentity.create({ data: { id, provider, email } });
  });
  return { email };
}
