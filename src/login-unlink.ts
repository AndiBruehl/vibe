import { prisma } from "@/db";
import { availableLoginProviders, emailAuthAvailable } from "@/auth-options";
import { secretDigest } from "@/auth-security";

export async function unlinkProvider(email: string, provider: string) {
  if (!["google", "discord"].includes(provider)) return "Invalid";
  const enabled = availableLoginProviders().filter((item) => item.enabled).map((item) => item.id);
  return prisma.$transaction(async (tx) => {
    // A shared write serializes concurrent removals, even of different providers.
    const id = secretDigest(`unlink-lock:${email.toLowerCase()}`);
    await tx.loginRate.upsert({ where: { id }, create: { id, count: 1, expiresAt: new Date() }, update: { count: { increment: 1 } } });
    const owner = await tx.profile.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true, email: true } });
    if (!owner) return "Unauthorized";
    const identities = await tx.loginIdentity.findMany({ where: { email: { equals: owner.email, mode: "insensitive" } }, select: { provider: true } });
    if (!identities.some((item) => item.provider === provider)) return "ok";
    const anotherProvider = identities.some((item) => item.provider !== provider && enabled.includes(item.provider));
    const password = emailAuthAvailable() ? await tx.loginCredential.findFirst({ where: { email: { equals: owner.email, mode: "insensitive" } }, select: { id: true } }) : null;
    if (!anotherProvider && !password) return "LastMethod";
    await tx.loginIdentity.deleteMany({ where: { email: { equals: owner.email, mode: "insensitive" }, provider } });
    await tx.loginProof.deleteMany({ where: { email: { equals: owner.email, mode: "insensitive" }, provider, kind: "link" } });
    return "ok";
  });
}
