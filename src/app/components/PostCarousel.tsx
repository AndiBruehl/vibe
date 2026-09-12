"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import ExpandablePostImage from "./ExpandablePostImage";
import { likePost } from "@/actions";

export default function PostCarousel({
  images,
  alt,
  href,
  initialIndex = 0,
  postId,
}: {
  images: string[];
  alt: string;
  href?: string;
  initialIndex?: number;
  postId?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, Math.min(initialIndex, images.length - 1)));
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);
  const pendingNavigation = useRef<number | null>(null);
  useEffect(() => () => {
    if (pendingNavigation.current !== null) window.clearTimeout(pendingNavigation.current);
  }, []);
  function go(next: number) {
    const el = track.current;
    if (el)
      el.scrollTo({
        left: next * el.clientWidth,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }
  useEffect(() => {
    const next = Math.max(0, Math.min(initialIndex, images.length - 1));
    setIndex(next);
    requestAnimationFrame(() => go(next));
  // The image set defines the available range; go only changes scroll position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex, images.length]);
  async function likeFromGesture() {
    if (!postId) return;
    const data = new FormData();
    data.set("postId", postId);
    try {
      await likePost(data);
      setShowHeart(true);
      window.setTimeout(() => setShowHeart(false), 650);
    } catch { /* The visible Like button remains available if the request fails. */ }
  }
  function handlePointerUp(event: React.PointerEvent) {
    if (!postId || href) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      event.preventDefault();
      void likeFromGesture();
      lastTap.current = 0;
    } else lastTap.current = now;
  }
  function handleLinkedImageClick(event: React.MouseEvent<HTMLAnchorElement>, target: string) {
    if (!postId) return;
    event.preventDefault();
    if (pendingNavigation.current !== null) {
      window.clearTimeout(pendingNavigation.current);
      pendingNavigation.current = null;
      void likeFromGesture();
      return;
    }
    pendingNavigation.current = window.setTimeout(() => {
      pendingNavigation.current = null;
      window.location.assign(target);
    }, 260);
  }
  return (
    <section
      aria-label="Post images"
      aria-roledescription="carousel"
      className="group relative min-w-0 w-full"
    >
      <div
        ref={track}
        className="flex min-w-0 w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => {
          const el = event.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            go(Math.min(images.length - 1, index + 1));
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(Math.max(0, index - 1));
          }
        }}
        onPointerUp={handlePointerUp}
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            role="group"
            aria-label={`Image ${i + 1} of ${images.length}`}
            inert={i !== index}
            className="w-full shrink-0 snap-center bg-slate-100 dark:bg-slate-900"
          >
            {href ? (
              <Link
                href={`${href}${href.includes("?") ? "&" : "?"}image=${i + 1}`}
                onClick={(event) => handleLinkedImageClick(event, `${href}${href.includes("?") ? "&" : "?"}image=${i + 1}`)}
                tabIndex={i === index ? 0 : -1}
                className="block"
              >
                <img
                  src={src}
                  alt={`${alt} (${i + 1}/${images.length})`}
                  loading={i ? "lazy" : "eager"}
                  className="aspect-square w-full object-contain"
                />
              </Link>
            ) : (
              <ExpandablePostImage
                src={src}
                alt={`${alt} (${i + 1}/${images.length})`}
              />
            )}
          </div>
        ))}
      </div>
      {showHeart && <Heart aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-30 size-20 -translate-x-1/2 -translate-y-1/2 fill-white text-white drop-shadow-lg motion-safe:animate-ping" />}
      {images.length > 1 && (
        <>
          <span
            className="pointer-events-none absolute right-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-white"
            aria-live="polite"
          >
            {index + 1}/{images.length}
          </span>
          <button
            type="button"
            aria-label="Previous image"
            disabled={index === 0}
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-slate-900 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100 disabled:invisible"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            disabled={index === images.length - 1}
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-slate-900 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100 disabled:invisible"
          >
            <ChevronRight size={20} />
          </button>
          <div className="flex justify-center gap-1 bg-white py-2 dark:bg-gray-800">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show image ${i + 1}`}
                aria-current={index === i ? "true" : undefined}
                onClick={() => go(i)}
                className="flex size-7 items-center justify-center"
              >
                <span
                  className={`size-2 rounded-full ${index === i ? "bg-red-600" : "bg-slate-300 dark:bg-slate-600"}`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
