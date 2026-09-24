import Link from "next/link";
import ProgressiveImage from "./ProgressiveImage";
import { VIDEO_MEDIA_TYPE } from "@/post-images";
import VideoMedia from "./VideoMedia";

export default function PostThumbnail({ href, src, mediaType, poster, alt, className = "" }: { href: string; src: string; mediaType?: string; poster?: string | null; alt: string; className?: string }) {
  return <Link href={href} className={`block ${className}`}>
    {mediaType === VIDEO_MEDIA_TYPE ? <VideoMedia src={src} poster={poster} controls={false} className="size-full bg-slate-950 object-cover" alt={alt} /> : <ProgressiveImage src={src} alt={alt} lockAspectRatio="1 / 1" containerClassName="size-full" className="object-cover transition duration-300 group-hover:scale-[1.03]" />}
  </Link>;
}
