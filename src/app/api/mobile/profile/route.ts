import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      subtitle: true,
      bio: true,
    },
  });

  return NextResponse.json(profile);
}
