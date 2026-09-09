"use client";

import { useEffect } from "react";

type ScreenWithOrientation = Screen & {
  orientation?: { lock?: (orientation: "portrait") => Promise<void> };
};

export default function OrientationLock() {
  useEffect(() => {
    const orientation = (window.screen as ScreenWithOrientation).orientation;
    void orientation?.lock?.("portrait").catch(() => undefined);
  }, []);

  return null;
}
