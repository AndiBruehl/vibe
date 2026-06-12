import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

export default function EmptyState({ icon, title, body }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.white} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    marginTop: 16,
    padding: 28,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
});
