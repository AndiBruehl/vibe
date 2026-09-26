"use client";

import { useEffect, useMemo, useState } from "react";

type LocalTimeProps = {
  iso?: string | null;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
  format?: "compact-date-time";
};

export default function LocalTime({ iso, options, fallback, format }: LocalTimeProps) {
  const opts = useMemo(() => options || {}, [options]);
  const [text, setText] = useState<string>(fallback ?? "");

  useEffect(() => {
    if (!iso) {
      setText(fallback ?? "");
      return;
    }
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
      if (format === "compact-date-time") {
        const two = (value: number) => String(value).padStart(2, "0");
        setText(`${two(d.getFullYear() % 100)}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`);
        return;
      }
      setText(d.toLocaleString(undefined, opts));
    } catch {
      setText(fallback ?? "");
    }
  }, [iso, opts, fallback, format]);

  return <>{text}</>;
}
