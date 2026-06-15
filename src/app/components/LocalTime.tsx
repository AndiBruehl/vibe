"use client";

import { useEffect, useMemo, useState } from "react";

type LocalTimeProps = {
  iso?: string | null;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
};

export default function LocalTime({ iso, options, fallback }: LocalTimeProps) {
  const opts = useMemo(() => options || {}, [options]);
  const [text, setText] = useState<string>(fallback ?? "");

  useEffect(() => {
    if (!iso) {
      setText(fallback ?? "");
      return;
    }
    try {
      const d = new Date(iso);
      setText(d.toLocaleString(undefined, opts));
    } catch {
      setText(fallback ?? "");
    }
  }, [iso, opts, fallback]);

  return <>{text}</>;
}
