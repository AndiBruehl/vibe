import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { colors } from "@/theme";

type ScreenProps = {
  children: ReactNode;
  maxWidth?: number;
};

export default function Screen({ children, maxWidth }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { horizontalGutter, maxContentWidth } = useAdaptiveLayout();
  const resolvedMaxWidth = maxWidth ?? maxContentWidth;

  return (
    <View
      style={[
        styles.safe,
        {
          paddingLeft: horizontalGutter,
          paddingRight: horizontalGutter,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
    >
      <View
        style={[
          styles.container,
          resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : null,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    alignSelf: "center",
    flex: 1,
    width: "100%",
  },
});
