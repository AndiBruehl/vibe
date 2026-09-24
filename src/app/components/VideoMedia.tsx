"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";

export default function VideoMedia({ src, poster, className = "", alt = "Video", controls = true }: { src: string; poster?: string | null; className?: string; alt?: string; controls?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewed = useRef(false);
  const [playing, setPlaying] = useState(false);

  function choosePreviewFrame() {
    const video = videoRef.current;
    if (!video || poster || previewed.current || !Number.isFinite(video.duration)) return;
    previewed.current = true;
    video.currentTime = video.duration >= 5 ? 3 : Math.max(0, video.duration / 2);
  }

  return <div className="relative size-full bg-slate-950">
    <video ref={videoRef} src={src} poster={poster || undefined} controls={controls} playsInline preload="metadata" onLoadedMetadata={choosePreviewFrame} onPlay={(event) => { if (previewed.current) { event.currentTarget.currentTime = 0; previewed.current = false; } setPlaying(true); }} onPause={() => setPlaying(false)} className={className} aria-label={alt} />
    {!playing && <span aria-hidden="true" className="pointer-events-none absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-black/70 text-white shadow-lg ring-1 ring-white/35"><Play size={17} fill="currentColor" /></span>}
  </div>;
}
