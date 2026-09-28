import { PrismaClient } from "@prisma/client";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || process.env.NODE_ENV === "production" || process.env.VIBE_DEV_ATLAS_DIRECT !== "1") {
    return databaseUrl;
  }

  // Some local Windows DNS resolvers intermittently time out on Atlas SRV records.
  // Keep production on its managed SRV URL, while development uses the same Atlas
  // replica set through the three public hosts returned by that SRV record.
  const match = databaseUrl.match(/^mongodb\+srv:\/\/([^@]+)@cluster0\.umrt40s\.mongodb\.net\/([^?]+)(?:\?.*)?$/);
  if (!match) return databaseUrl;

  const [, credentials, database] = match;
  const hosts = [
    "ac-cuhg6qp-shard-00-00.umrt40s.mongodb.net:27017",
    "ac-cuhg6qp-shard-00-01.umrt40s.mongodb.net:27017",
    "ac-cuhg6qp-shard-00-02.umrt40s.mongodb.net:27017",
  ].join(",");

  return `mongodb://${credentials}@${hosts}/${database}?authSource=admin&replicaSet=atlas-rb5ljs-shard-0&tls=true&retryWrites=true&w=majority`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    datasourceUrl: getDatabaseUrl(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
