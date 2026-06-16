import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({ select: { email: true } });
  const emails = profiles.map((p) => p.email);

  const orphanPosts = await prisma.post.findMany({
    where: { authorEmail: { notIn: emails } },
    select: { id: true, authorEmail: true, createdAt: true },
  });

  console.log(`Found ${orphanPosts.length} orphan posts.`);
  if (orphanPosts.length === 0) return;

  for (const p of orphanPosts) {
    console.log(
      `- id=${p.id} authorEmail=${p.authorEmail} createdAt=${p.createdAt}`,
    );
  }

  const mode = process.env.FIX;
  if (!mode) {
    console.log(
      "\nDry run complete. To act, run with env `FIX=delete` or `FIX=reassign`.",
    );
    return;
  }

  if (mode === "delete") {
    console.log("\nDeleting orphan posts...");
    for (const p of orphanPosts) {
      await prisma.post.delete({ where: { id: p.id } });
    }
    console.log("Deleted orphan posts.");
    return;
  }

  if (mode === "reassign") {
    console.log("\nReassigning orphan posts to placeholder profile...");
    const placeholderEmail = "deleted@vibe.local";
    const placeholder = await prisma.profile.upsert({
      where: { email: placeholderEmail },
      update: {},
      create: { email: placeholderEmail, name: "Deleted User" },
    });

    const uniqueEmails = Array.from(
      new Set(orphanPosts.map((p) => p.authorEmail)),
    );
    const res = await prisma.post.updateMany({
      where: { authorEmail: { in: uniqueEmails } },
      data: { authorEmail: placeholder.email },
    });

    console.log(`Reassigned ${res.count} posts to ${placeholder.email}`);
    return;
  }

  console.log("Unknown FIX mode:", mode);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
