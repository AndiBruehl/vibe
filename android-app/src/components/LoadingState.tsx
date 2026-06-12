import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "@/theme";

export default function LoadingState() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.red} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
