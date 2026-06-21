import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export function useAdaptiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const shortestSide = Math.min(width, height);
    const isTablet = shortestSide >= 600;
    const isExpanded = width >= 840;
    const horizontalGutter = isExpanded ? 24 : 16;
    const maxContentWidth = isExpanded ? 760 : undefined;
    const gridColumns = width >= 1100 ? 4 : width >= 840 ? 3 : width >= 600 ? 2 : 1;

    return {
      gridColumns,
      height,
      horizontalGutter,
      isExpanded,
      isTablet,
      maxContentWidth,
      width,
    };
  }, [height, width]);
}
