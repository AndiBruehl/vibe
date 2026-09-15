import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const language = body?.language === "de" ? "de" : body?.language === "en" ? "en" : null;
  if (!language) return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  await prisma.profile.upsert({ where: { email: session.user.email }, update: { language }, create: { email: session.user.email, language } });
  // The preference is consumed by server-rendered routes and the protected
  // layout. Invalidate them before the client performs its single soft refresh.
  revalidatePath("/", "layout");
  return NextResponse.json({ language });
}
