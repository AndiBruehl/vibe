import { auth } from "@/auth";
import { prisma } from "@/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, context: any) {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) return new Response("Unauthorized", { status: 401 });

  // Next.js App Router provides `context.params` as a Promise in dynamic API
  // routes — await it before accessing properties to avoid runtime errors.
  const params = await context?.params;
  const id = params?.id;
  console.debug(
    "POST /api/conversations/[id]/members - params:",
    params,
    "req.url:",
    req.url,
  );
  // normalize id for logging
  let resolvedId = id;
  if (Array.isArray(resolvedId)) resolvedId = resolvedId[0];
  if (typeof resolvedId !== "string") resolvedId = String(resolvedId ?? "");
  console.debug(
    "POST /api/conversations/[id]/members - resolved id:",
    resolvedId,
  );
  const body = await req.json();
  const usernames: string[] = body.usernames || [];
  if (!usernames.length)
    return new Response("No usernames provided", { status: 400 });

  const currentUser = await prisma.profile.findUnique({
    where: { email: userEmail },
    select: { id: true, username: true },
  });
  if (!currentUser) return new Response("Profile not found", { status: 404 });

  const conv = await prisma.conversation.findFirst({
    where: { id, participants: { some: { profileId: currentUser.id } } },
  });
  if (!conv)
    return new Response("Conversation not found or access denied", {
      status: 404,
    });

  const raw = Array.from(
    new Set(usernames.map((u) => (u || "").trim()).filter(Boolean)),
  );
  const filtered = raw.filter(
    (u) => u !== currentUser.username && u !== userEmail,
  );
  if (!filtered.length)
    return new Response("No valid usernames to add", { status: 400 });

  console.debug(
    "POST /api/conversations/[id]/members - filtered usernames:",
    filtered,
  );

  const profiles = await prisma.profile.findMany({
    // use simple "in" lookup (case-sensitive). Frontend sends exact
    // usernames from the search suggestions so this is sufficient and
    // avoids Prisma/Mongo `mode: "insensitive"` compatibility issues.
    where: { username: { in: filtered } },
    select: { id: true, username: true, name: true, avatar: true },
  });
  console.debug(
    "POST /api/conversations/[id]/members - matched profiles:",
    profiles.map((p) => ({ id: p.id, username: p.username })),
  );
  // exclude users already in the conversation
  const existingParts = await prisma.conversationParticipant.findMany({
    where: { conversationId: id },
    select: { profileId: true },
  });
  console.debug(
    "POST /api/conversations/[id]/members - existing participant ids:",
    existingParts.map((p) => p.profileId),
  );
  const existingIds = new Set(existingParts.map((p) => p.profileId));
  const toAdd = profiles.filter((p) => !existingIds.has(p.id));
  if (!toAdd.length)
    return new Response(
      JSON.stringify({
        ok: false,
        reason: "All provided users are already members",
        filtered,
        profiles: profiles.map((p) => ({
          id: p.id,
          username: p.username,
          name: p.name,
        })),
        existingParticipantIds: existingParts.map((p) => p.profileId),
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  const foundUsernames = profiles
    .map((p) => p.username?.toLowerCase())
    .filter(Boolean as any);
  const missing = filtered.filter(
    (u) => !foundUsernames.includes(u.toLowerCase()),
  );
  if (missing.length)
    return new Response(
      JSON.stringify({
        ok: false,
        reason: `Usernames not found: ${missing.join(", ")}`,
        missing,
        filtered,
        profiles: profiles.map((p) => p.username),
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );

  // add participants (only those not already present)
  await prisma.conversation.update({
    where: { id },
    data: {
      participants: { create: toAdd.map((p) => ({ profileId: p.id })) },
    },
  });
  // revalidate both conversation and group pages
  revalidatePath(`/messages/${id}`);
  revalidatePath(`/messages/group/${id}`);
  revalidatePath("/messages");

  return new Response(JSON.stringify(toAdd), {
    headers: { "content-type": "application/json" },
  });
}

export async function DELETE(req: Request, context: any) {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) return new Response("Unauthorized", { status: 401 });

  const params = await context?.params;
  const id = params?.id;
  const body = await req.json();
  const profileId: string | undefined = body.profileId;
  if (!profileId) return new Response("profileId required", { status: 400 });

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

  await prisma.conversationParticipant.deleteMany({
    where: { conversationId: id, profileId },
  });
  revalidatePath(`/messages/${id}`);
  revalidatePath("/messages");

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
