import { prisma } from "@/db";
import { pinata } from "@/pinata_config";

function cidFromUrl(value: string) {
  return value.match(/\/ipfs\/([a-zA-Z0-9]+)(?:[/?#]|$)/)?.[1] ?? null;
}

export async function cleanupExpiredStories() {
  if (!process.env.PINATA_JWT) throw new Error("Pinata cleanup is not configured");
  const now = new Date();
  const expired = await prisma.story.findMany({
    where: { expiresAt: { lte: now } },
    include: { slides: true }, orderBy: { expiresAt: "asc" }, take: 20,
  });
  let deleted = 0;
  for (const story of expired) {
    // Keep the database records until storage deletion succeeds, allowing retries.
    for (const cid of new Set<string>(story.slides.map((slide) => cidFromUrl(slide.imageUrl)).filter((cid): cid is string => Boolean(cid)))) {
      const [posts, profiles, messages, activeSlides] = await Promise.all([
        prisma.post.count({ where: { OR: [{ image: { contains: cid } }, { images: { hasSome: story.slides.filter((slide) => cidFromUrl(slide.imageUrl) === cid).map((slide) => slide.imageUrl) } }] } }),
        prisma.profile.count({ where: { avatar: { contains: cid } } }),
        prisma.message.count({ where: { imageUrl: { contains: cid } } }),
        prisma.storySlide.count({ where: { imageUrl: { contains: cid }, story: { expiresAt: { gt: now } } } }),
      ]);
      // Gallery images can use a different gateway for the same CID.
      const galleries = await prisma.post.findMany({ select: { images: true } });
      if (posts || profiles || messages || activeSlides || galleries.some((post) => post.images.some((url) => cidFromUrl(url) === cid))) continue;
      const files = await pinata.files.public.list().cid(cid).all();
      for (const file of files) await pinata.files.public.delete([file.id]);
      if ((await pinata.files.public.list().cid(cid).all()).length) throw new Error("Pinata deletion incomplete; cleanup will retry");
    }
    await prisma.$transaction([
      prisma.storyView.deleteMany({ where: { storyId: story.id } }),
      prisma.storySlide.deleteMany({ where: { storyId: story.id } }),
      prisma.story.deleteMany({ where: { id: story.id, expiresAt: { lte: now } } }),
    ]);
    deleted++;
  }
  return { deleted };
}
