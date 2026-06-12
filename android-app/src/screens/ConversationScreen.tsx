import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import LoadingState from "@/components/LoadingState";
import Screen from "@/components/Screen";
import { api, Message } from "@/lib/api";
import { colors } from "@/theme";
import type { RootStackParamList } from "../../App";

type ConversationRoute = RouteProp<RootStackParamList, "Conversation">;

export default function ConversationScreen() {
  const route = useRoute<ConversationRoute>();
  const listRef = useRef<FlatList<Message>>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    const data = await api.getConversation(route.params.conversationId);
    setMessages(data.messages);
  }, [route.params.conversationId]);

  const scrollToLatestMessage = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    loadMessages()
      .catch(console.error)
      .finally(() => setIsLoading(false));

    const interval = setInterval(() => {
      void loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadMessages]);

  async function send() {
    const body = draft.trim();

    if (!body) {
      return;
    }

    setDraft("");
    const message = await api.sendMessage(route.params.conversationId, body);
    setMessages((current) => [...current, message]);
    scrollToLatestMessage();
  }

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
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => scrollToLatestMessage()}
        onLayout={() => scrollToLatestMessage(false)}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.isOwnMessage ? styles.own : styles.theirs]}>
            <Text style={styles.message}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable style={styles.send} onPress={() => void send()}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingVertical: 16,
  },
  bubble: {
    borderRadius: 18,
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  own: {
    alignSelf: "flex-end",
    backgroundColor: colors.red,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
  },
  message: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 21,
  },
  composer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingBottom: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 20,
    color: colors.text,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  send: {
    backgroundColor: colors.red,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  sendText: {
    color: colors.white,
    fontWeight: "900",
  },
});
