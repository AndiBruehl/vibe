import { auth } from '@/auth';
import { prisma } from '@/db';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request, context: any) {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) return new Response('Unauthorized', { status: 401 });

  const id = context?.params?.id;
  const body = await req.json();
  const usernames: string[] = body.usernames || [];
  if (!usernames.length) return new Response('No usernames provided', { status: 400 });

  const currentUser = await prisma.profile.findUnique({ where: { email: userEmail }, select: { id: true, username: true } });
  if (!currentUser) return new Response('Profile not found', { status: 404 });

  const conv = await prisma.conversation.findFirst({ where: { id, participants: { some: { profileId: currentUser.id } } } });
  if (!conv) return new Response('Conversation not found or access denied', { status: 404 });

  const raw = Array.from(new Set(usernames.map((u) => (u || '').trim()).filter(Boolean)));
  const filtered = raw.filter((u) => u !== currentUser.username && u !== userEmail);
  if (!filtered.length) return new Response('No valid usernames to add', { status: 400 });

  const profiles = await prisma.profile.findMany({ where: { username: { in: filtered, mode: 'insensitive' } }, select: { id: true, username: true, name: true, avatar: true } });
  const foundUsernames = profiles.map((p) => p.username?.toLowerCase()).filter(Boolean as any);
  const missing = filtered.filter((u) => !foundUsernames.includes(u.toLowerCase()));
  if (missing.length) return new Response(`Usernames not found: ${missing.join(', ')}`, { status: 400 });

  // add participants
  await prisma.conversation.update({ where: { id }, data: { participants: { create: profiles.map((p) => ({ profileId: p.id })) } } });
  revalidatePath(`/messages/${id}`);
  revalidatePath('/messages');

  return new Response(JSON.stringify(profiles), { headers: { 'content-type': 'application/json' } });
}

export async function DELETE(req: Request, context: any) {
  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) return new Response('Unauthorized', { status: 401 });

  const id = context?.params?.id;
  const body = await req.json();
  const profileId: string | undefined = body.profileId;
  if (!profileId) return new Response('profileId required', { status: 400 });

  const currentUser = await prisma.profile.findUnique({ where: { email: userEmail }, select: { id: true } });
  if (!currentUser) return new Response('Profile not found', { status: 404 });

  const conv = await prisma.conversation.findFirst({ where: { id, participants: { some: { profileId: currentUser.id } } } });
  if (!conv) return new Response('Conversation not found or access denied', { status: 404 });

  await prisma.conversationParticipant.deleteMany({ where: { conversationId: id, profileId } });
  revalidatePath(`/messages/${id}`);
  revalidatePath('/messages');

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}
