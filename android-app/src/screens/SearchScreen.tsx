import { useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import Screen from "@/components/Screen";
import { api, Post } from "@/lib/api";
import { colors } from "@/theme";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  async function runSearch(value: string) {
    setQuery(value);

    if (!value.trim()) {
      setPosts([]);
      return;
    }

    const results = await api.search(value);
    setPosts(results.posts);
  }

  return (
    <Screen>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={
          <View>
            <Header title="Search" subtitle="Find people and posts" />
            <TextInput
              value={query}
              onChangeText={(value) => void runSearch(value)}
              placeholder="Search vibes..."
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={query ? "No results" : "Start typing"}
            body={query ? "Try another search term." : "Search posts by description."}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
