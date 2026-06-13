import { prisma } from "@/db";
import { NextResponse, type NextRequest } from "next/server";

type MobilePostRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export async function GET(_request: NextRequest, { params }: MobilePostRouteProps) {
  const { id } = await params;

  if (!isObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          avatar: true,
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

