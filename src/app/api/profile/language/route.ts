import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const language = body?.language === "de" ? "de" : body?.language === "en" ? "en" : null;
  if (!language) return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  await prisma.profile.upsert({ where: { email: session.user.email }, update: { language }, create: { email: session.user.email, language } });
  return NextResponse.json({ language });
}
