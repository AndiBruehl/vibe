import { auth } from "@/auth";
import { prisma } from "@/db";
import PostLocationMap from "@/app/components/PostLocationMap";
import { notFound, redirect } from "next/navigation";

export default async function PostMapPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const { id } = await params;
  const [viewer, post] = await Promise.all([
    prisma.profile.findUnique({ where: { email: session.user.email }, select: { language: true } }),
    prisma.post.findUnique({ where: { id }, select: { id: true, authorEmail: true, isArchived: true, locationLabel: true, locationLatitude: true, locationLongitude: true } }),
  ]);

  if (!post || (!post.locationLabel && post.locationLatitude === null)) notFound();
  if (post.isArchived && post.authorEmail !== session.user.email) notFound();

  const de = viewer?.language === "de";
  const label = post.locationLabel || (de ? "Geteilter Ort" : "Shared location");
  let latitude = Number.isFinite(post.locationLatitude) ? post.locationLatitude : null;
  let longitude = Number.isFinite(post.locationLongitude) ? post.locationLongitude : null;
  if ((latitude === null || longitude === null) && post.locationLabel) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(post.locationLabel)}`, { headers: { "User-Agent": "VIBE-Social/0.2 post map" }, signal: AbortSignal.timeout(5000), cache: "no-store" });
      if (!response.ok) throw new Error("Geocoder unavailable");
      const result = (await response.json()) as Array<{ lat?: string; lon?: string }>;
      const lat = Number(result[0]?.lat);
      const lng = Number(result[0]?.lon);
      if (Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lng) && Math.abs(lng) <= 180) { latitude = lat; longitude = lng; }
    } catch { /* The map component keeps its text-search fallback. */ }
  }

  return <main className="mx-auto w-full max-w-5xl pb-24 md:pb-8">
    <PostLocationMap de={de} postId={post.id} label={label} latitude={latitude} longitude={longitude} />
  </main>;
}
