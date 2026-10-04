import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { guestDestination, isGuestPage, isPublicAsset } from "@/guest-access";

export const proxy = auth(async (request) => {
  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  if (request.auth?.user?.email || isPublicAsset(path)) return NextResponse.next();
  // Auth endpoints validate their own OAuth state, CSRF tokens or mobile token.
  if (path.startsWith("/api/auth/") || path.startsWith("/api/mobile/auth/")) return NextResponse.next();
  if (path.startsWith("/api/mobile/")) {
    try {
      const { verifyMobileToken } = await import("@/mobile-auth");
      const header = request.headers.get("authorization") || "";
      if (header.startsWith("Bearer ") && verifyMobileToken(header.slice(7))) return NextResponse.next();
    } catch { /* Invalid tokens or unavailable verification must fail closed. */ }
  }
  if (path === "/api/cron/stories" && process.env.CRON_SECRET && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`) return NextResponse.next();
  const read = request.method === "GET" || request.method === "HEAD";
  if (path === "/api/releases/latest" && read) return NextResponse.next();
  if (path.startsWith("/api/") || !read) {
    return NextResponse.json({ error: "Unauthorized", loginUrl: "/join" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const destination = guestDestination(path);
  if (destination) {
    const url = request.nextUrl.clone(); url.pathname = destination;
    return NextResponse.rewrite(url, { headers: { "Cache-Control": "private, no-store" } });
  }
  if (isGuestPage(path)) return NextResponse.next({ headers: { "Cache-Control": "private, no-store" } });
  return NextResponse.redirect(new URL("/join", request.url));
});
