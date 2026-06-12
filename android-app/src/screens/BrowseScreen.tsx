import { useEffect, useState } from "react";
import { FlatList } from "react-native";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import LoadingState from "@/components/LoadingState";
import PostCard from "@/components/PostCard";
import Screen from "@/components/Screen";
import { api, Post } from "@/lib/api";

export default function BrowseScreen() {
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
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<Header title="Browse" subtitle="Explore recent posts" />}
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
