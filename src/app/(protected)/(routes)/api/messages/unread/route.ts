import { auth } from "@/auth";
import { getUnreadMessageStatus } from "@/messages";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        count: 0,
        latestUnreadAt: null,
      },
      {
        status: 401,
      },
    );
  }

  const status = await getUnreadMessageStatus(session.user.email);

  return NextResponse.json(status);
}
