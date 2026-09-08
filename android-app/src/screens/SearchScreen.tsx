import { useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import EmptyState from "@/components/EmptyState";
import PostCard from "@/components/PostCard";
import Screen from "@/components/Screen";
import { api, Post } from "@/lib/api";
import { colors } from "@/theme";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setPosts([]);
    setError(null);
    setIsLoading(Boolean(query.trim()));
    const timer = setTimeout(async () => {
      if (!query.trim()) return;
      try {
        const results = await api.search(query.trim());
        if (active) setPosts(results.posts);
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : "Search failed.");
      } finally {
        if (active) setIsLoading(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, retry]);

  return (
    <Screen>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Search vibes..."
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={isLoading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => setRetry((value) => value + 1)} /> :
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
  list: {
    paddingBottom: 16,
    paddingTop: 4,
  },
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
