import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/db";
import { normalizeProfileAccent } from "@/profile-personalization";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.profileAccent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.profileAccent)) {
    return NextResponse.json({ error: "Invalid profile accent." }, { status: 400 });
  }

  const profileAccent = normalizeProfileAccent(body.profileAccent);
  await prisma.profile.upsert({
    where: { email: session.user.email },
    update: { profileAccent },
    create: { email: session.user.email, profileAccent },
  });
  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/profile/[username]", "page");
  return NextResponse.json({ profileAccent });
}
