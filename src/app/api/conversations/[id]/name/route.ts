import { auth } from "@/auth";
import { prisma } from "@/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, context: any) {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) return new Response("Unauthorized", { status: 401 });

  const id = context?.params?.id;
  const body = await req.json();
  const name = (body.name || "").trim();
  if (!name) return new Response("Name required", { status: 400 });

  const currentUser = await prisma.profile.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!currentUser) return new Response("Profile not found", { status: 404 });

  const conv = await prisma.conversation.findFirst({
    where: { id, participants: { some: { profileId: currentUser.id } } },
  });
  if (!conv)
    return new Response("Conversation not found or access denied", {
      status: 404,
    });

  await prisma.conversation.update({ where: { id }, data: { name } });
  revalidatePath(`/messages/${id}`);
  revalidatePath("/messages");

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
