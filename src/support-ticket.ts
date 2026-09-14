import { prisma } from "@/db";
import { VIBE_SUPPORT_EMAIL } from "@/system-profile";

/** Records a user reply in the active Support@Vibe ticket and alerts admins. */
export async function appendSupportTicketMessage(requesterEmail: string, body: string) {
  const existing = await prisma.supportTicket.findFirst({
    where: { requesterEmail, status: { not: "closed" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  const ticket = existing
    ? await prisma.supportTicket.update({ where: { id: existing.id }, data: { status: "open" } })
    : await prisma.supportTicket.create({ data: { requesterEmail, assignedAdminEmail: null, assignedAt: null } });

  await prisma.$transaction([
    prisma.supportTicketMessage.create({ data: { ticketId: ticket.id, senderType: "user", body } }),
    prisma.supportTicket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } }),
    prisma.adminActivity.create({
      data: {
        actorEmail: VIBE_SUPPORT_EMAIL,
        kind: "support-ticket",
        detail: "New message for Support@Vibe",
      },
    }),
  ]);
  return ticket;
}