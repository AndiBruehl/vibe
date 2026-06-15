import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import LoadingState from "@/components/LoadingState";
import Screen from "@/components/Screen";
import { ActivityItem, api } from "@/lib/api";
import { colors } from "@/theme";

const iconByType: Record<ActivityItem["type"], keyof typeof Ionicons.glyphMap> = {
  comment: "chatbubble-outline",
  follow: "person-add-outline",
  like: "heart-outline",
  message: "mail-outline",
};

export default function ActivityScreen() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getActivity()
      .then(setItems)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Header title="Activity" subtitle="What happened around you" />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No activity yet"
            body="Likes, comments, follows and messages will appear here."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            {item.avatar ? <Image source={{ uri: item.avatar }} style={styles.avatar} /> : <View style={styles.avatar} />}
            <View style={styles.iconWrap}>
              <Ionicons name={iconByType[item.type]} color={colors.red} size={16} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
            {item.image ? <Image source={{ uri: item.image }} style={styles.preview} /> : null}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    padding: 12,
  },
  avatar: {
    backgroundColor: colors.cardElevated,
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  preview: {
    borderRadius: 8,
    height: 48,
    width: 48,
  },
});
