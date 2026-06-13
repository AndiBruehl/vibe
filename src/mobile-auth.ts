import { auth } from "@/auth";
import { prisma } from "@/db";
import crypto from "crypto";
import { NextRequest } from "next/server";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

type MobileTokenPayload = {
  email: string;
  exp: number;
  sub: string;
};

export type MobileSession = {
  email: string;
  profileId: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set.");
  }

  return secret;
}

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function sign(value: string) {
  return base64UrlEncode(
    crypto.createHmac("sha256", getSecret()).update(value).digest(),
  );
}

export function createMobileToken(payload: { email: string; profileId: string }) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(
    JSON.stringify({
      email: payload.email,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
      sub: payload.profileId,
    } satisfies MobileTokenPayload),
  );
  const unsignedToken = `${header}.${body}`;

  return `${unsignedToken}.${sign(unsignedToken)}`;
}

function verifyMobileToken(token: string) {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    return null;
  }

  const unsignedToken = `${header}.${body}`;
  const expectedSignature = sign(unsignedToken);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (
    !crypto.timingSafeEqual(
      signatureBuffer,
      expectedSignatureBuffer,
    )
  ) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(body)) as MobileTokenPayload;

  if (!payload.email || !payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function getMobileSession(request: NextRequest): Promise<MobileSession | null> {
  const webSession = await auth();

  if (webSession?.user?.email) {
    const profile = await prisma.profile.findUnique({
      where: { email: webSession.user.email },
      select: { id: true, email: true },
    });

    return profile ? { email: profile.email, profileId: profile.id } : null;
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return null;
  }

  const payload = verifyMobileToken(token);

  if (!payload) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: { email: payload.email },
    select: { id: true, email: true },
  });

  if (!profile || profile.id !== payload.sub) {
    return null;
  }

  return { email: profile.email, profileId: profile.id };
}
