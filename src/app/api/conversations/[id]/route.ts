import { auth } from "@/auth";
import { prisma } from "@/db";
import { revalidatePath } from "next/cache";

function isObjectId(value: unknown) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export async function DELETE(req: Request, context: any) {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) return new Response("Unauthorized", { status: 401 });

  let id: unknown = context?.params?.id;
  // If params are missing (observed in some dev requests), try to
  // extract the id from the request URL as a fallback.
  if (!id) {
    try {
      const urlObj = new URL(req.url);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      const maybe = segments[segments.length - 1];
      if (maybe) {
        console.warn(
          "DELETE /api/conversations/[id]: params.id missing — extracted from URL:",
          maybe,
        );
        id = maybe;
      }
    } catch (e) {
      // ignore URL parsing errors — we'll handle validation below
    }
  }

  // handle possible shapes (string, array, numeric);
  if (Array.isArray(id)) id = id[0];
  if (typeof id !== "string") id = String(id ?? "");
  if (!isObjectId(id)) {
    console.warn(
      "DELETE /api/conversations/[id]: invalid id param:",
      context?.params?.id,
      "request url:",
      req.url,
    );
    // TEMP: return full debug text so the client can copy/paste the exact
    // received params and request URL for debugging. Remove this before
    // deploying to production.
    const debugText = JSON.stringify(
      { received: context?.params, url: req.url },
      null,
      2,
    );
    return new Response(
      JSON.stringify({
        ok: false,
        reason: "Invalid conversation id",
        received: context?.params,
        errorText: debugText,
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

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

  try {
    // delete all related data and the conversation; return counts for debugging
    const [msgRes, partsRes] = await Promise.all([
      prisma.message.deleteMany({ where: { conversationId: id as string } }),
      prisma.conversationParticipant.deleteMany({
        where: { conversationId: id as string },
      }),
    ]);

    // finally remove the conversation record
    await prisma.conversation.delete({ where: { id: id as string } });

    // revalidate messages index and group page
    revalidatePath("/messages");
    revalidatePath(`/messages/group/${id}`);

    return new Response(
      JSON.stringify({
        ok: true,
        deletedMessages: msgRes.count,
        deletedParticipants: partsRes.count,
      }),
      { headers: { "content-type": "application/json" } },
    );
  } catch (err) {
    console.error("DELETE /api/conversations/[id] error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
