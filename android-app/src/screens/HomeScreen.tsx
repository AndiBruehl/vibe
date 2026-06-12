import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
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
        ListHeaderComponent={<Header title="Vibe" subtitle="Fresh posts from the network" />}
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
