"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

type ExpandablePostImageProps = {
  src: string;
  alt: string;
};

export default function ExpandablePostImage({
  src,
  alt,
}: ExpandablePostImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="block aspect-square w-full cursor-zoom-in"
        aria-label="Open image preview"
      >
        <span className="relative block h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          {!loaded ? <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-linear-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" /> : null}
          <Image
            src={src}
            alt={alt}
            width={800}
            height={800}
            onLoad={() => setLoaded(true)}
            className={`relative h-full w-full object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
            priority
            unoptimized
          />
        </span>
      </button>

      {isOpen && typeof document !== "undefined" ? createPortal(
        <div
          className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex h-full w-full items-center justify-center p-6 md:pl-55 md:pr-10 md:py-10">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-full w-full cursor-zoom-out items-center justify-center"
              aria-label="Close image preview"
            >
              <Image
                src={src}
                alt={alt}
                width={2000}
                height={2000}
                className="max-h-[90vh] max-w-[88vw] rounded-2xl object-contain md:max-w-[78vw]"
                unoptimized
              />
            </button>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
