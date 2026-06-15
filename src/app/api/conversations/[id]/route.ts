import { auth } from '@/auth';
import { prisma } from '@/db';
import { revalidatePath } from 'next/cache';

export async function DELETE(req: Request, context: any) {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) return new Response('Unauthorized', { status: 401 });

  const id = context?.params?.id;
  const currentUser = await prisma.profile.findUnique({ where: { email: userEmail }, select: { id: true } });
  if (!currentUser) return new Response('Profile not found', { status: 404 });

  const conv = await prisma.conversation.findFirst({ where: { id, participants: { some: { profileId: currentUser.id } } } });
  if (!conv) return new Response('Conversation not found or access denied', { status: 404 });

  // delete all related data and the conversation
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversationId: id } }),
    prisma.conversationParticipant.deleteMany({ where: { conversationId: id } }),
    prisma.conversation.delete({ where: { id } }),
  ]);

  revalidatePath('/messages');

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}
