import { signIn } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = formData.get("token");

  if (typeof token !== "string" || !token) {
    return NextResponse.redirect(new URL("/?loginError=invalid", request.url));
  }

  return signIn("mobile", {
    redirectTo: new URL("/home", request.url).toString(),
    token,
  });
}
