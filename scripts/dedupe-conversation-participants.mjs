#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error(
      "Usage: node scripts/dedupe-conversation-participants.mjs <conversationId>",
    );
    process.exit(1);
  }

  console.log(`Dedupe participants for conversation: ${id}`);
  const parts = await prisma.conversationParticipant.findMany({
    where: { conversationId: id },
    orderBy: { id: "asc" },
  });

  const map = new Map();
  for (const p of parts) {
    const arr = map.get(p.profileId) || [];
    arr.push(p.id);
    map.set(p.profileId, arr);
  }

  const deletes = [];
  for (const [profileId, ids] of map.entries()) {
    if (ids.length > 1) {
      // keep the first id, delete the rest
      const toRemove = ids.slice(1);
      deletes.push(...toRemove);
      console.log(`Will remove duplicates for profile ${profileId}:`, toRemove);
    }
  }

  if (deletes.length === 0) {
    console.log("No duplicate participant rows found.");
    await prisma.$disconnect();
    return;
  }

  const res = await prisma.conversationParticipant.deleteMany({
    where: { id: { in: deletes } },
  });

  console.log(`Deleted ${res.count} duplicate participant rows.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
