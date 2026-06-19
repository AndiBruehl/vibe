#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error(
      "Usage: node scripts/inspect-conversation.mjs <conversationId>",
    );
    process.exit(1);
  }

  console.log(`Inspecting conversation: ${id}`);
  const parts = await prisma.conversationParticipant.findMany({
    where: { conversationId: id },
    include: { profile: true },
  });

  console.log(`Found ${parts.length} participant rows:`);
  for (const p of parts) {
    console.log({ id: p.id, profileId: p.profileId, profile: p.profile });
  }

  const uniqueProfileIds = [...new Set(parts.map((p) => p.profileId))];
  console.log("Unique profile ids:", uniqueProfileIds);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
