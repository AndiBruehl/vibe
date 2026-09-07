export default function PostImageCount({
  images,
}: {
  images?: string[] | null;
}) {
  if (!images || images.length < 2) return null;
  return (
    <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-slate-900/80 px-2 py-1 text-xs font-medium text-white">
      {images.length} images
    </span>
  );
}
