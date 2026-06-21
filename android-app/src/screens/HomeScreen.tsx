import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import PostCard from "@/components/PostCard";
import Screen from "@/components/Screen";
import { api, Post } from "@/lib/api";
import { colors } from "@/theme";

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    const data = await api.getHomePosts();
    setPosts(data);
  }, []);

  useEffect(() => {
    loadPosts()
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [loadPosts]);

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
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="images-outline"
            title="No posts yet"
            body="When people publish new vibes, they will show up here."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.red}
            onRefresh={() => {
              setIsRefreshing(true);
              loadPosts()
                .catch(console.error)
                .finally(() => setIsRefreshing(false));
            }}
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
});
