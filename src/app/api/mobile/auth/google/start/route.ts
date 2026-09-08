import { signIn } from "@/auth";
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

export async function GET(request: NextRequest) {
  const callbackUrl = new URL(
    "/api/mobile/auth/google/callback",
    request.nextUrl.origin,
  );
  callbackUrl.searchParams.set("redirectUri", getRedirectUri(request));

  try {
    return await signIn("google", {
      redirectTo: callbackUrl.toString(),
    });
  } catch (error) {
    const redirectUrl = new URL(getRedirectUri(request));
    const digest =
      error instanceof Error && "digest" in error
        ? String(error.digest)
        : "";

    if (digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    redirectUrl.searchParams.set("error", "Google sign-in could not start.");
    return NextResponse.redirect(redirectUrl);
  }
}
