import { signIn } from "@/auth";
import { verifyMobileToken } from "@/mobile-auth";
import { NextResponse, type NextRequest } from "next/server";

function loginFallback(request: NextRequest) {
  return NextResponse.redirect(new URL("/join?loginError=mobile", request.url));
}

export function GET(request: NextRequest) {
  return loginFallback(request);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = formData.get("token");

  if (typeof token !== "string" || !verifyMobileToken(token)) {
    return loginFallback(request);
  }

  try {
    return await signIn("mobile", {
      redirectTo: new URL("/home", request.url).toString(),
      token,
    });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    return loginFallback(request);
  }
}
