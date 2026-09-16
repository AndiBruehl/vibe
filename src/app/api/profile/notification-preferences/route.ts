import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";

const preferenceKeys = ["notificationLikes", "notificationComments", "notificationMentions", "notificationFollowRequests", "notificationAdmin"] as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });

  const data = Object.fromEntries(preferenceKeys.map((key) => [key, body[key] !== false]));
  await prisma.profile.upsert({
    where: { email: session.user.email },
    update: data,
    create: { email: session.user.email, ...data },
  });
  return NextResponse.json(data);
}
