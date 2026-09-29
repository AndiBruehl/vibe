import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Invalid post" }, { status: 400 });
  try {
    const result = await prisma.post.updateMany({ where: { id, authorEmail: session.user.email }, data: { locationLabel: null, locationLatitude: null, locationLongitude: null, locationUpdatedAt: null } });
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath(`/posts/${id}`);
    revalidatePath(`/posts/${id}/map`);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unavailable" }, { status: 503 }); }
}
