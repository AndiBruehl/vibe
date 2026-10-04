import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { availableLoginProviders, emailAuthAvailable } from "@/auth-options";
import { newSecret, normalizeEmail, secretDigest } from "@/auth-security";
import { completeProof, loginRate, requestPasswordEmail } from "@/login-store";

export async function POST(request: Request) {
  // Browser-only account mutations: reject cross-origin and oversized requests.
  const origin = new URL(process.env.AUTH_URL || request.url).origin;
  if (request.headers.get("origin") !== origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 4096) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  try {
    const body = JSON.parse(raw);
    const action = body?.action;
    if (action === "link") {
      const session = await auth();
      if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const profile = await prisma.profile.findFirst({ where: { email: { equals: session.user.email, mode: "insensitive" } }, select: { email: true } });
      if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (!availableLoginProviders().some((p) => p.id === body.provider && p.enabled)) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
      if (!await loginRate(`link:${profile.email}`, 10)) return NextResponse.json({ error: "RateLimited" }, { status: 429 });
      const token = newSecret();
      await prisma.loginProof.create({ data: { id: secretDigest(token), email: profile.email, provider: body.provider, kind: "link", expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
      const response = NextResponse.json({ ok: true });
      const secure = origin.startsWith("https:");
      response.cookies.set("vibe-link", token, { httpOnly: true, secure, sameSite: secure ? "none" : "lax", path: "/api/auth", maxAge: 600 });
      return response;
    }
    if (!emailAuthAvailable()) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
    if (action === "confirm") {
      if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token)) return NextResponse.json({ error: "Expired" }, { status: 400 });
      if (!await loginRate(`proof:${secretDigest(body.token)}`, 5)) return NextResponse.json({ error: "RateLimited" }, { status: 429 });
      const ok = await completeProof(body.token, body.password);
      return NextResponse.json(ok ? { ok: true } : { error: "Expired" }, { status: ok ? 200 : 400 });
    }
    if (!["register", "reset", "setup"].includes(action)) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    let email = normalizeEmail(body.email);
    if (action === "setup") {
      const session = await auth();
      if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      email = session.user.email;
    }
    if (!email) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    if (!await loginRate(`mail:${email.toLowerCase()}`, 3)) return NextResponse.json({ error: "RateLimited" }, { status: 429 });
    await requestPasswordEmail(email, action, body.language === "de");
    return NextResponse.json({ ok: true }); // Same response for unknown/existing accounts.
  } catch { return NextResponse.json({ error: "Unavailable" }, { status: 503 }); }
}
