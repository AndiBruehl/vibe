import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db";
import { normalizeProfileHeaderLayout, PROFILE_HEADER_LAYOUTS } from "@/profile-personalization";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.profileHeaderLayout !== "string" || !(PROFILE_HEADER_LAYOUTS as readonly string[]).includes(body.profileHeaderLayout)) {
    return NextResponse.json({ error: "Invalid profile header layout." }, { status: 400 });
  }

  const profileHeaderLayout = normalizeProfileHeaderLayout(body.profileHeaderLayout);
  await prisma.profile.upsert({
    where: { email: session.user.email },
    update: { profileHeaderLayout },
    create: { email: session.user.email, profileHeaderLayout },
  });
  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/profile/[username]", "page");
  return NextResponse.json({ profileHeaderLayout });
}
