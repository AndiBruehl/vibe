import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";

const validThemes = new Set(["light", "dark", "system"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const theme = typeof body?.theme === "string" && validThemes.has(body.theme) ? body.theme : null;
  if (!theme) return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  await prisma.profile.upsert({ where: { email: session.user.email }, update: { theme }, create: { email: session.user.email, theme } });
  return NextResponse.json({ theme });
}
