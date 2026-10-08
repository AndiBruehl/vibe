import { handlers } from "@/auth";
import type { NextRequest } from "next/server";
import { linkingErrorReturn } from "@/login-callback-return";
import { mobileErrorReturn, mobileLoginCookie } from "@/mobile-login-return";

async function handle(request: NextRequest, method: "GET" | "POST") {
  const linkToken = request.cookies.get("vibe-link")?.value;
  const response = await handlers[method](request);
  const mobileReturn = mobileErrorReturn(request.url, request.cookies.get(mobileLoginCookie)?.value, response.headers.get("location"));
  const returnTo = mobileReturn || linkingErrorReturn(request.url, linkToken, response.headers.get("location"));
  if (!returnTo) return response;
  const headers = new Headers(response.headers);
  headers.set("location", returnTo);
  headers.append("set-cookie", "vibe-link=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax");
  if (mobileReturn) headers.append("set-cookie", `${mobileLoginCookie}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return new Response(response.body, { status: response.status, headers });
}

export function GET(request: NextRequest) { return handle(request, "GET"); }
export function POST(request: NextRequest) { return handle(request, "POST"); }
