import { getProfileDirectory } from "@/profile-directory";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(await getProfileDirectory(
    request.nextUrl.searchParams.get("q") || "",
    request.nextUrl.searchParams.get("sort") || "newest",
  ));
}
