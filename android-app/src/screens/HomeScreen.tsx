import ErrorState from "@/components/ErrorState";
import { useRemoteData } from "@/hooks/useRemoteData";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import PostCard from "@/components/PostCard";
import Screen from "@/components/Screen";
import { api, Post } from "@/lib/api";
import { colors } from "@/theme";

export default function HomeScreen() {
  const { data: posts, isLoading, isRefreshing, error, refresh } = useRemoteData<Post[]>(api.getHomePosts, []);

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
        ListHeaderComponent={error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={error ? null :
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
            onRefresh={() => void refresh()}
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
