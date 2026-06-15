import { auth } from "@/auth";
import { prisma } from "@/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const name = (form.get("name") as string) || "";
  const participantUsernames =
    (form.get("participantUsernames") as string) || "";
  const initialMessage = (form.get("initialMessage") as string) || "";

  if (!name.trim()) return new Response("Group name required", { status: 400 });
  if (!participantUsernames.trim())
    return new Response("Participants required", { status: 400 });

  const rawUsernames = participantUsernames
    .split(",")
    .map((u) => (u || "").trim())
    .filter(Boolean);

  const currentUserProfile = await prisma.profile.findUnique({
    where: { email: userEmail },
    select: { id: true, username: true },
  });
  if (!currentUserProfile)
    return new Response("Profile not found", { status: 404 });

  const participantUsernamesFiltered = Array.from(new Set(rawUsernames)).filter(
    (u) => u !== currentUserProfile.username && u !== userEmail,
  );

  if (participantUsernamesFiltered.length < 1) {
    return new Response("A group chat needs at least one other participant.", {
      status: 400,
    });
  }

  const participants = await prisma.profile.findMany({
    where: {
      username: { in: participantUsernamesFiltered, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (participants.length !== participantUsernamesFiltered.length) {
    return new Response("One or more usernames could not be found", {
      status: 400,
    });
  }

    const directKey =
      typeof globalThis !== "undefined" &&
      typeof (globalThis as any).crypto?.randomUUID === "function"
        ? (globalThis as any).crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const conversation = await prisma.conversation.create({
      data: {
        name: name.trim(),
        isGroup: true,
        directKey,
        participants: {
          create: [
            { profileId: currentUserProfile.id },
            ...participants.map((p) => ({ profileId: p.id })),
          ],
        },
      },
      select: { id: true },
    });

  if (initialMessage && initialMessage.trim()) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: currentUserProfile.id,
        body: initialMessage.trim(),
      },
    });
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/group/${conversation.id}`);
  revalidatePath(`/messages/${conversation.id}`);

  return new Response(JSON.stringify({ id: conversation.id }), {
    headers: { "content-type": "application/json" },
  });
  } catch (err: any) {
    console.error("/api/conversations/create error:", err);
    const body = {
      error: err?.message || "Unknown error",
      stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
    };
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
