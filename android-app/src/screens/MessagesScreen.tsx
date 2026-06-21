import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import Screen from "@/components/Screen";
import { api, ConversationSummary } from "@/lib/api";
import { colors } from "@/theme";
import type { RootStackParamList } from "../../App";

export default function MessagesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getConversations()
      .then(setConversations)
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
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="No messages yet"
            body="Start a conversation from a profile."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, item.unread && styles.unread]}
            onPress={() =>
              navigation.navigate("Conversation", {
                conversationId: item.id,
                title: item.title,
              })
            }
          >
            {item.avatar ? <Image source={{ uri: item.avatar }} style={styles.avatar} /> : <View style={styles.avatar} />}
            <View style={styles.textWrap}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={1}>
                {item.latestMessage || "Start the conversation."}
              </Text>
            </View>
            {item.unread ? <View style={styles.dot} /> : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 16,
    paddingTop: 4,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  unread: {
    borderColor: colors.red,
    borderWidth: 1,
  },
  avatar: {
    backgroundColor: colors.cardElevated,
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  dot: {
    backgroundColor: colors.red,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
