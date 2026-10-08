import { auth } from "@/auth";
import { createMobileToken } from "@/mobile-auth";
import { prisma } from "@/db";
import { mobileLoginCookie, mobileRedirect, matchesMobileAttempt } from "@/mobile-login-return";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const redirect = mobileRedirect(request.nextUrl.searchParams.get("redirectUri"));
  if (!redirect) return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
  const destination = new URL(redirect);
  const store = await cookies();
  if (!matchesMobileAttempt(store.get(mobileLoginCookie)?.value, redirect)) {
    destination.searchParams.set("error", "This sign-in attempt expired. Please start again.");
    return NextResponse.redirect(destination);
  }
  try {
    const session = await auth();
    const email = session?.user?.email;
    const profile = email ? await prisma.profile.findUnique({ where: { email }, select: { id: true, email: true } }) : null;
    // Account creation belongs to OAuth resolution. Never resurrect a deleted profile here.
    if (!profile) destination.searchParams.set("error", "Your session is no longer valid. Please sign in again.");
    else destination.searchParams.set("token", createMobileToken({ email: profile.email, profileId: profile.id }));
  } catch {
    destination.searchParams.set("error", "VIBE could not finish sign-in. Please try again shortly.");
  }
  store.delete(mobileLoginCookie);
  return NextResponse.redirect(destination);
}
