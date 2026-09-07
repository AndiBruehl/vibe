"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ExpandablePostImage from "./ExpandablePostImage";

export default function PostCarousel({
  images,
  alt,
  href,
}: {
  images: string[];
  alt: string;
  href?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
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
  return (
    <section
      aria-label="Post images"
      aria-roledescription="carousel"
      className="relative min-w-0 w-full"
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
                href={href}
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
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-slate-900 shadow disabled:invisible"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            disabled={index === images.length - 1}
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-slate-900 shadow disabled:invisible"
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
