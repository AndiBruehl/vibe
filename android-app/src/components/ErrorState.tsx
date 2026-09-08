import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.wrap}>
      <Text style={styles.message}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
        <Text style={styles.label}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, alignItems: "center" },
  message: { color: colors.textSoft, textAlign: "center", fontSize: 15, lineHeight: 22 },
  button: { backgroundColor: colors.red, minHeight: 48, paddingHorizontal: 20, borderRadius: 14, justifyContent: "center" },
  label: { color: colors.white, fontWeight: "700" },
});
