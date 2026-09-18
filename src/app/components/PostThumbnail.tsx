import Link from "next/link";
import ProgressiveImage from "./ProgressiveImage";
import { VIDEO_MEDIA_TYPE } from "@/post-images";

export default function PostThumbnail({ href, src, mediaType, alt, className = "" }: { href: string; src: string; mediaType?: string; alt: string; className?: string }) {
  return <Link href={href} className={`block ${className}`}>
    {mediaType === VIDEO_MEDIA_TYPE ? <video src={src} muted playsInline preload="metadata" className="size-full bg-slate-950 object-cover" aria-label={alt} /> : <ProgressiveImage src={src} alt={alt} lockAspectRatio="1 / 1" containerClassName="size-full" className="object-cover transition duration-300 group-hover:scale-[1.03]" />}
  </Link>;
}
