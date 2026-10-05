import { PrismaClient } from "@prisma/client";

function withLocalDatabaseTimeouts(databaseUrl: string | undefined) {
  if (!databaseUrl || process.env.NODE_ENV === "production") return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    const timeoutMs = process.env.VIBE_DEV_DB_TIMEOUT_MS ?? "3000";

    url.searchParams.set("serverSelectionTimeoutMS", timeoutMs);
    url.searchParams.set("connectTimeoutMS", timeoutMs);
    url.searchParams.set("socketTimeoutMS", process.env.VIBE_DEV_DB_SOCKET_TIMEOUT_MS ?? "5000");

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || process.env.NODE_ENV === "production" || process.env.VIBE_DEV_ATLAS_DIRECT !== "1") {
    return withLocalDatabaseTimeouts(databaseUrl);
  }

  // Some local Windows DNS resolvers intermittently time out on Atlas SRV records.
  // Keep production on its managed SRV URL, while development uses the same Atlas
  // replica set through the three public hosts returned by that SRV record.
  const match = databaseUrl.match(/^mongodb\+srv:\/\/([^@]+)@cluster0\.umrt40s\.mongodb\.net\/([^?]+)(?:\?.*)?$/);
  if (!match) return withLocalDatabaseTimeouts(databaseUrl);

  const [, credentials, database] = match;
  const hosts = [
    "ac-cuhg6qp-shard-00-00.umrt40s.mongodb.net:27017",
    "ac-cuhg6qp-shard-00-01.umrt40s.mongodb.net:27017",
    "ac-cuhg6qp-shard-00-02.umrt40s.mongodb.net:27017",
  ].join(",");

  return withLocalDatabaseTimeouts(`mongodb://${credentials}@${hosts}/${database}?authSource=admin&replicaSet=atlas-rb5ljs-shard-0&tls=true&retryWrites=true&w=majority`);
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
