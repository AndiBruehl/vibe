import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  try {
    const topics = await prisma.topic.findMany({ take: 50 });
    console.log("topicCount:", topics.length);
    console.log(JSON.stringify(topics, null, 2));
  } catch (err) {
    console.error("inspect-topics error:", err);
  } finally {
    await prisma.$disconnect();
  }
})();
