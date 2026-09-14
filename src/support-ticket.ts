import { prisma } from "@/db";
import { ensureVibeSupportProfile, VIBE_SUPPORT_EMAIL } from "@/system-profile";
import { supportTemplateText } from "@/support-templates";

/** Records a user reply in the active Support@Vibe ticket and alerts admins. */
export async function appendSupportTicketMessage(requesterEmail: string, body: string) {
  const existing = await prisma.supportTicket.findFirst({
    where: { requesterEmail, status: { not: "closed" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  const hadClosedTicket = !existing && Boolean(await prisma.supportTicket.findFirst({ where: { requesterEmail, status: "closed" }, select: { id: true } }));
  const ticket = existing
    ? await prisma.supportTicket.update({ where: { id: existing.id }, data: { status: "open" } })
    : await prisma.supportTicket.create({ data: { requesterEmail, assignedAdminEmail: null, assignedAt: null } });

  await prisma.$transaction([
    prisma.supportTicketMessage.create({ data: { ticketId: ticket.id, senderType: "user", body } }),
    prisma.supportTicket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } }),
    prisma.adminActivity.create({ data: { actorEmail: VIBE_SUPPORT_EMAIL, kind: "support-ticket", detail: "New message for Support@Vibe" } }),
  ]);
  return { ticket, created: !existing, hadClosedTicket };
}

/** Sends the automatic first-response message in the requester's language. */
export async function sendSupportAcknowledgement(ticketId: string, requesterEmail: string) {
  const requester = await prisma.profile.findUnique({ where: { email: requesterEmail }, select: { id: true, language: true, isSystem: true } });
  if (!requester || requester.isSystem) return;
  const body = supportTemplateText("acknowledgement", requester.language === "de");
  if (!body) return;
  const support = await ensureVibeSupportProfile();
  const directKey = [support.id, requester.id].sort().join(":");
  const conversation = await prisma.conversation.upsert({
    where: { directKey }, update: {}, create: { directKey, participants: { create: [{ profileId: support.id }, { profileId: requester.id }] } }, select: { id: true },
  });
  const now = new Date();
  await prisma.$transaction([
    prisma.supportTicketMessage.create({ data: { ticketId, senderType: "support", body } }),
    prisma.supportTicket.update({ where: { id: ticketId }, data: { updatedAt: now } }),
    prisma.message.create({ data: { conversationId: conversation.id, senderId: support.id, body } }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: now } }),
    prisma.conversationParticipant.update({ where: { conversationId_profileId: { conversationId: conversation.id, profileId: support.id } }, data: { lastReadAt: now } }),
  ]);
}
