import { auth } from "@/auth";
import { getUnreadInteractionStatus, markActivityRead } from "@/notifications";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { commentCount: 0, replyCount: 0, likeCount: 0, mentionCount: 0, latestUnreadAt: null },
      { status: 401 },
    );
  }

  return NextResponse.json(await getUnreadInteractionStatus(session.user.email));
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markActivityRead(session.user.email);
  return NextResponse.json({ ok: true });
}
