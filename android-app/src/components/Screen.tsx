import { ReactNode, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { colors } from "@/theme";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";

type ScreenProps = {
  children: ReactNode;
  maxWidth?: number;
  insetTop?: boolean;
};

export default function Screen({ children, maxWidth, insetTop = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const { horizontalGutter, maxContentWidth } = useAdaptiveLayout();
  const resolvedMaxWidth = maxWidth ?? maxContentWidth;

  return (
    <View
      style={[
        styles.safe,
        {
          paddingLeft: Math.max(horizontalGutter, insets.left),
          paddingRight: Math.max(horizontalGutter, insets.right),
          paddingBottom: tabBarHeight === undefined ? Math.max(insets.bottom, 12) : 0,
          paddingTop: insetTop ? Math.max(insets.top, 12) : 0,
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
