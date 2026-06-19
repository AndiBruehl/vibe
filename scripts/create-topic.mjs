#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const [, , nameArg, slugArg, ...postIds] = process.argv;
  if (!nameArg) {
    console.error(
      'Usage: node scripts/create-topic.mjs <name> [slug] [postId...]\nExample: node scripts/create-topic.mjs "My Topic" my-topic 6a3507bd285d17abbac11667',
    );
    process.exit(1);
  }

  const name = nameArg;
  const slug = slugArg || slugify(name);

  console.log(`Upserting topic: name="${name}" slug="${slug}"`);

  const topic = await prisma.topic.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });

  console.log("Topic upserted:", {
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
  });

  if (postIds && postIds.length) {
    console.log("Linking to posts:", postIds);
    for (const postId of postIds) {
      const exists = await prisma.postTopic.findFirst({
        where: { postId, topicId: topic.id },
      });
      if (exists) {
        console.log(`Post ${postId} already linked to topic ${topic.id}`);
        continue;
      }
      try {
        const pt = await prisma.postTopic.create({
          data: { postId, topicId: topic.id },
        });
        console.log(`Linked post ${postId} -> postTopic ${pt.id}`);
      } catch (err) {
        console.error(`Failed to link post ${postId}:`, err?.message || err);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
