import { prisma } from "@/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const prefix = searchParams.get("prefix") === "1";

  if (!q) {
    return new Response(JSON.stringify([]), {
      headers: { "content-type": "application/json" },
    });
  }

  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { username: { [prefix ? "startsWith" : "contains"]: q, mode: "insensitive" } },
        { name: { [prefix ? "startsWith" : "contains"]: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
    },
    take: 10,
  });

  return new Response(JSON.stringify(profiles), {
    headers: { "content-type": "application/json" },
  });
}
