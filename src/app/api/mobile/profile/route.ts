import { getMobileSession } from "@/mobile-auth";
import { prisma } from "@/db";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getMobileSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: {
      email: session.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      avatar: true,
      subtitle: true,
      bio: true,
    },
  });

  return NextResponse.json(profile);
}
