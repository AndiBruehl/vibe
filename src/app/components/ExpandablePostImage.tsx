"use client";

import { useEffect, useState } from "react";
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
        className="block w-full cursor-zoom-in"
        aria-label="Open image preview"
      >
        <Image
          src={src}
          alt={alt}
          width={800}
          height={800}
          className="h-auto w-full object-contain"
          priority
          unoptimized
        />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm md:left-[200px]"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex h-full w-full items-center justify-center p-6 md:p-10">
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
        </div>
      ) : null}
    </>
  );
}
