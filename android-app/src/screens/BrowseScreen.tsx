import ErrorState from "@/components/ErrorState";
import { useRemoteData } from "@/hooks/useRemoteData";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { colors } from "@/theme";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import PostCard from "@/components/PostCard";
import Screen from "@/components/Screen";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { api, Post } from "@/lib/api";

export default function BrowseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { gridColumns } = useAdaptiveLayout();
  const { data: posts, isLoading, isRefreshing, error, refresh } = useRemoteData<Post[]>(api.getBrowsePosts, []);

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Profiles")}
        style={{ minHeight: 48, justifyContent: "center", backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, marginVertical: 12 }}>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Browse profiles →</Text>
      </Pressable>
      <FlatList
        refreshing={isRefreshing}
        onRefresh={() => void refresh()}
        ListHeaderComponent={error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}
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
        ListEmptyComponent={isLoading ? <LoadingState /> : error ? null :
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
