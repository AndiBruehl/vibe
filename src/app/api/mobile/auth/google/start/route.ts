import { NextResponse, type NextRequest } from "next/server";

function getRedirectUri(request: NextRequest) {
  const redirectUri = request.nextUrl.searchParams.get("redirectUri");

  if (
    redirectUri?.startsWith("vibe://") ||
    redirectUri?.startsWith("com.vibe.social:/")
  ) {
    return redirectUri;
  }

  return "vibe://auth";
}

export function GET(request: NextRequest) {
  const callbackUrl = new URL(
    "/api/mobile/auth/google/callback",
    request.nextUrl.origin,
  );
  callbackUrl.searchParams.set("redirectUri", getRedirectUri(request));

  const signInUrl = new URL("/api/auth/signin/google", request.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", callbackUrl.toString());

  return NextResponse.redirect(signInUrl);
}
