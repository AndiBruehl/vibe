import { prisma } from "@/db";
import { identityId, credentialId, issueProof, loginRate } from "@/login-store";
import { normalizeEmail, secretDigest } from "@/auth-security";

export async function resolveOAuth(provider: string, accountId: string, emailInput: unknown, verified: boolean, linkToken?: string) {
  const id = identityId(provider, accountId);
  const identity = await prisma.loginIdentity.findUnique({ where: { id } });
  if (linkToken && /^[a-f0-9]{64}$/.test(linkToken)) {
    const proofId = secretDigest(linkToken);
    const proof = await prisma.loginProof.findUnique({ where: { id: proofId } });
    if (proof?.kind === "link" && proof.provider === provider && proof.expiresAt > new Date()) {
      if (identity && identity.email !== proof.email) return { redirect: "/settings/login?notice=conflict" };
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.loginProof.deleteMany({ where: { id: proofId, expiresAt: { gt: new Date() } } });
        if (claimed.count !== 1) throw Error("Link expired");
        const owner = await tx.profile.findUnique({ where: { email: proof.email }, select: { id: true } });
        if (!owner) throw Error("Account missing");
        if (!identity) await tx.loginIdentity.create({ data: { id, email: proof.email, provider } });
      });
      return { redirect: "/settings/login?notice=linked" };
    }
  }
  if (identity) {
    const owner = await prisma.profile.findUnique({ where: { email: identity.email }, select: { email: true } });
    return owner ? { email: owner.email } : { redirect: "/?notice=unavailable" };
  }
  const email = normalizeEmail(emailInput);
  if (!email) return { redirect: "/?notice=email" };
  const existing = await prisma.profile.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { email: true } });
  if (existing) {
    // Bootstrap only legacy Google accounts. Never merge new providers by email.
    const known = await prisma.loginIdentity.findFirst({ where: { email: existing.email }, select: { id: true } });
    const password = await prisma.loginCredential.findUnique({ where: { id: credentialId(email) }, select: { id: true } });
    if (provider !== "google" || !verified || known || password) return { redirect: "/?notice=link" };
    await prisma.loginIdentity.create({ data: { id, provider, email: existing.email } });
    return { email: existing.email };
  }
  if (!verified) {
    if (provider !== "microsoft-entra-id") return { redirect: "/?notice=email" };
    if (await loginRate(`oauth-mail:${email}`, 3)) await issueProof(email, "oauth", false, { provider, identityId: id });
    return { redirect: "/?notice=verify" };
  }
  await prisma.loginIdentity.create({ data: { id, provider, email } });
  return { email };
}
