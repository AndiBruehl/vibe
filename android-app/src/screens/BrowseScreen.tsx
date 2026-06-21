import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import PostCard from "@/components/PostCard";
import Screen from "@/components/Screen";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { api, Post } from "@/lib/api";

export default function BrowseScreen() {
  const { gridColumns } = useAdaptiveLayout();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getBrowsePosts()
      .then(setPosts)
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
        key={gridColumns}
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={gridColumns}
        columnWrapperStyle={gridColumns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <PostCard compact={gridColumns > 1} post={item} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="grid-outline"
            title="Nothing to browse"
            body="Published posts will appear here."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    flex: 1,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
    paddingTop: 4,
  },
  row: {
    gap: 12,
  },
});
