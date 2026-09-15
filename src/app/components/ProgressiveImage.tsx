"use client";

import { useEffect, useState } from "react";

type ProgressiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: "eager" | "lazy";
};

/** Keeps the reserved media area stable while a remote image is loading. */
export default function ProgressiveImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  loading = "lazy",
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setAspectRatio(null);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-900 ${containerClassName}`}
      style={{ aspectRatio: aspectRatio ?? "4 / 3" }}
    >
      {!loaded && !failed ? (
        <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-linear-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
      ) : null}
      {failed ? (
        <div className="absolute inset-0 grid place-items-center text-sm font-medium text-slate-400 dark:text-slate-500">VIBE</div>
      ) : null}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={(event) => {
          const { naturalHeight, naturalWidth } = event.currentTarget;
          if (naturalWidth && naturalHeight) setAspectRatio(`${naturalWidth} / ${naturalHeight}`);
          setLoaded(true);
        }}
        onError={() => setFailed(true)}
        className={`relative h-full w-full transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      />
    </div>
  );
}
