import { signIn } from "@/auth";
import { availableLoginProviders } from "@/auth-options";
import { mobileLoginCookie, mobileRedirect } from "@/mobile-login-return";
import { cookies } from "next/headers";
import { prisma } from "@/db";
import { secretDigest } from "@/auth-security";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider") || "google";
  const redirectUri = mobileRedirect(request.nextUrl.searchParams.get("redirectUri"));
  if (!redirectUri || !["google", "discord"].includes(provider)) return NextResponse.json({ error: "Invalid sign-in request" }, { status: 400 });
  const failure = (message: string) => {
    const url = new URL(redirectUri);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  };
  if (!availableLoginProviders().some(p => p.id === provider && p.enabled)) return failure("This sign-in method is currently unavailable. Please try again later.");
  const store = await cookies();
  const linkToken = request.nextUrl.searchParams.get("linkToken");
  if (linkToken) {
    if (!/^[a-f0-9]{64}$/.test(linkToken)) return failure("This linking attempt is invalid. Please start again in Settings.");
    let proof;
    try {
      proof = await prisma.loginProof.findUnique({ where: { id: secretDigest(linkToken) } });
    } catch {
      return failure("VIBE could not check this linking attempt right now. Please retry from Settings.");
    }
    if (!proof || proof.kind !== "link" || proof.provider !== provider || proof.expiresAt <= new Date()) return failure("This linking attempt expired. Please start again in Settings.");
    store.set("vibe-link", linkToken, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/api/auth", maxAge: 600 });
  } else {
    store.set("vibe-link", "", { httpOnly: true, path: "/api/auth", maxAge: 0 });
  }
  store.set(mobileLoginCookie, JSON.stringify({ provider, redirectUri, startedAt: Date.now(), linking: Boolean(linkToken) }), {
    httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 600,
  });
  const callback = new URL("/api/mobile/auth/google/callback", request.nextUrl.origin);
  callback.searchParams.set("redirectUri", redirectUri);
  try {
    return await signIn(provider, { redirectTo: callback.toString() });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    store.delete(mobileLoginCookie);
    return failure("Sign-in could not start. Check your connection and try again.");
  }
}
