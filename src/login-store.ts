import { prisma } from "@/db";
import { hashPassword, newSecret, normalizeEmail, secretDigest, validPassword, verifyPassword } from "@/auth-security";
import { sendLoginMail } from "@/auth-mail";

export const credentialId = (email: string) => secretDigest(`password:${email.toLowerCase()}`);
export const identityId = (provider: string, account: string) => secretDigest(`${provider}:${account}`);

export async function loginRate(key: string, limit: number) {
  const id = secretDigest(key);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  await prisma.loginRate.updateMany({ where: { id, expiresAt: { lte: now } }, data: { count: 0, expiresAt } });
  let rate;
  try { rate = await prisma.loginRate.upsert({ where: { id }, create: { id, count: 1, expiresAt }, update: { count: { increment: 1 } } }); }
  catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    rate = await prisma.loginRate.update({ where: { id }, data: { count: { increment: 1 } } });
  }
  return rate.count <= limit;
}

export async function passwordLogin(emailInput: unknown, password: unknown) {
  const email = normalizeEmail(emailInput);
  if (!email || !validPassword(password) || !await loginRate(`login:${email}`, 10)) return null;
  const credential = await prisma.loginCredential.findUnique({ where: { id: credentialId(email) } });
  if (!await verifyPassword(password, credential?.passwordHash ?? null)) return null;
  const profile = await prisma.profile.findUnique({ where: { email: credential.email }, select: { id: true, email: true, name: true } });
  return profile ? { ...profile, authVersion: credential.version } : null;
}

export async function issueProof(email: string, kind: string, de: boolean, extra: { version?: number; provider?: string; identityId?: string } = {}) {
  const token = newSecret();
  const id = secretDigest(token);
  await prisma.loginProof.create({ data: { id, email, kind, ...extra, expiresAt: new Date(Date.now() + 20 * 60 * 1000) } });
  try { await sendLoginMail(email, token, kind, de); }
  catch (error) { await prisma.loginProof.deleteMany({ where: { id } }); throw error; }
}

export async function requestPasswordEmail(email: string, kind: "register" | "reset" | "setup", de: boolean) {
  const credential = await prisma.loginCredential.findUnique({ where: { id: credentialId(email) } });
  const profile = await prisma.profile.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { email: true } });
  if (kind === "reset") {
    if (credential && profile) await issueProof(credential.email, kind, de, { version: credential.version });
  } else if (!credential && (kind === "setup" ? Boolean(profile) : !profile)) {
    await issueProof(profile?.email || email, kind, de);
  }
}

export async function completeProof(token: string, password: unknown) {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const id = secretDigest(token);
  const proof = await prisma.loginProof.findUnique({ where: { id } });
  if (!proof || proof.expiresAt <= new Date() || proof.kind === "link") return false;
  if (proof.kind !== "oauth" && !validPassword(password)) return false;
  const passwordHash = proof.kind === "oauth" ? null : await hashPassword(password as string);
  // The one-time proof and credential change commit atomically.
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.loginProof.deleteMany({ where: { id, expiresAt: { gt: new Date() } } });
    if (claimed.count !== 1) throw Error("Expired proof");
    const profile = await tx.profile.findUnique({ where: { email: proof.email }, select: { id: true } });
    if (proof.kind === "oauth") {
      if (profile || !proof.identityId || !proof.provider) throw Error("Account already exists");
      await tx.profile.create({ data: { email: proof.email, username: `user-${newSecret().slice(0, 12)}` } });
      await tx.loginIdentity.create({ data: { id: proof.identityId, email: proof.email, provider: proof.provider } });
    } else if (proof.kind === "reset") {
      const changed = await tx.loginCredential.updateMany({ where: { id: credentialId(proof.email), version: proof.version }, data: { passwordHash, version: { increment: 1 } } });
      if (changed.count !== 1) throw Error("Expired reset");
    } else {
      if (proof.kind === "register" && profile) throw Error("Account already exists");
      if (proof.kind === "setup" && !profile) throw Error("Account missing");
      if (!profile) await tx.profile.create({ data: { email: proof.email, username: `user-${newSecret().slice(0, 12)}` } });
      await tx.loginCredential.create({ data: { id: credentialId(proof.email), email: proof.email, passwordHash } });
    }
    await tx.loginProof.deleteMany({ where: { email: proof.email, kind: { in: ["register", "reset", "setup", "oauth"] } } });
    return true;
  });
}
