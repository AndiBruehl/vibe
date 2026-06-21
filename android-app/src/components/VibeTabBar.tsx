import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { colors } from "@/theme";
import type { TabParamList } from "../../App";

const iconByRoute: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  Activity: "notifications-outline",
  Search: "search-outline",
  Create: "camera-outline",
  Browse: "grid-outline",
  Messages: "chatbubble-ellipses-outline",
  Profile: "person-outline",
};

function routeTint(isFocused: boolean) {
  return isFocused ? colors.red : colors.muted;
}

export default function VibeTabBar({
  descriptors,
  navigation,
  state,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isExpanded } = useAdaptiveLayout();

  function renderButton(routeIndex: number, isCreate = false) {
    const route = state.routes[routeIndex];
    const options = descriptors[route.key].options;
    const isFocused = state.index === routeIndex;

    function onPress() {
      const event = navigation.emit({
        canPreventDefault: true,
        target: route.key,
        type: "tabPress",
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    }

    return (
      <Pressable
        accessibilityLabel={options.tabBarAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        key={route.key}
        onPress={onPress}
        style={({ pressed }) => [
          isCreate ? styles.createButton : styles.iconButton,
          isFocused && !isCreate ? styles.iconButtonActive : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <Ionicons
          color={isCreate ? colors.white : routeTint(isFocused)}
          name={iconByRoute[route.name as keyof TabParamList]}
          size={isCreate ? 28 : 27}
        />
      </Pressable>
    );
  }

  if (isExpanded) {
    return (
      <View
        style={[
          styles.rail,
          {
            paddingBottom: Math.max(insets.bottom, 18),
            paddingTop: Math.max(insets.top, 18),
          },
        ]}
      >
        {state.routes.map((_, index) => renderButton(index, state.routes[index].name === "Create"))}
      </View>
    );
  }

  return (
    <View style={[styles.bottomWrap, { paddingBottom: insets.bottom }]}>
      <View style={styles.bottomRow}>
        <View style={[styles.bottomSegment, styles.leftSegment]}>
          {[0, 1, 2].map((index) => renderButton(index))}
        </View>
        <View style={styles.centerSlot}>{renderButton(3, true)}</View>
        <View style={[styles.bottomSegment, styles.rightSegment]}>
          {[4, 5, 6].map((index) => renderButton(index))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    height: 78,
  },
  bottomSegment: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-around",
    paddingTop: 6,
  },
  bottomWrap: {
    backgroundColor: colors.background,
  },
  centerSlot: {
    alignItems: "center",
    backgroundColor: colors.background,
    height: 78,
    justifyContent: "flex-start",
    width: 88,
  },
  createButton: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderColor: colors.background,
    borderRadius: 33,
    borderWidth: 7,
    height: 66,
    justifyContent: "center",
    shadowColor: colors.red,
    shadowOpacity: 0.38,
    shadowRadius: 16,
    width: 66,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 24,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  iconButtonActive: {
    backgroundColor: colors.card,
  },
  leftSegment: {
    borderTopRightRadius: 24,
  },
  pressed: {
    opacity: 0.72,
  },
  rail: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRightWidth: 1,
    gap: 8,
    justifyContent: "center",
    width: 86,
  },
  rightSegment: {
    borderTopLeftRadius: 24,
  },
});
