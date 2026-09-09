import { auth } from "@/auth";
import { getUnreadInteractionStatus } from "@/notifications";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { commentCount: 0, replyCount: 0, latestUnreadAt: null },
      { status: 401 },
    );
  }

  return NextResponse.json(await getUnreadInteractionStatus(session.user.email));
}
