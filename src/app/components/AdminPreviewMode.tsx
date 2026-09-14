"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AdminPreviewMode() {
  const searchParams = useSearchParams();
  const enabled = searchParams.get("adminPreview") === "1";

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("vibe-admin-preview");
    return () => document.body.classList.remove("vibe-admin-preview");
  }, [enabled]);

  return null;
}
