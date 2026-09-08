import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import PostLikeButton from "@/components/PostLikeButton";
import ErrorState from "@/components/ErrorState";
import PostImages from "@/components/PostImages";
import { useRemoteData } from "@/hooks/useRemoteData";
import LoadingState from "@/components/LoadingState";
import Screen from "@/components/Screen";
import { api, Post } from "@/lib/api";
import { colors } from "@/theme";
import type { RootStackParamList } from "../../App";

type PostDetailRoute = RouteProp<RootStackParamList, "PostDetail">;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRoute>();
  const load = useCallback(() => api.getPost(route.params.postId), [route.params.postId]);
  const { data: post, isLoading, error, refresh } = useRemoteData<Post | null>(load, null);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen>
        <ErrorState message={error || "This post could not be loaded."} onRetry={() => void refresh()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <PostImages key={post.id} image={post.image} images={post.images} description={post.description} />
          <View style={styles.body}>
            <View style={styles.authorRow}>
              {post.author.avatar ? (
                <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback} />
              )}
              <View style={styles.authorText}>
                <Text style={styles.name}>{post.author.name || "Unknown"}</Text>
                <Text style={styles.username}>
                  @{post.author.username || "user"}
                </Text>
              </View>
            </View>
            {post.description ? (
              <Text style={styles.text}>{post.description}</Text>
            ) : null}
            <View style={styles.metaRow}>
              <PostLikeButton key={post.id} post={post} />
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  authorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  authorText: {
    flex: 1,
  },
  avatar: {
    borderRadius: 23,
    height: 46,
    width: 46,
  },
  avatarFallback: {
    backgroundColor: colors.cardElevated,
    borderRadius: 23,
    height: 46,
    width: 46,
  },
  body: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginTop: 4,
    overflow: "hidden",
  },
  image: {
    aspectRatio: 1,
    width: "100%",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 14,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  text: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  username: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  wrap: {
    paddingBottom: 18,
    paddingTop: 4,
  },
});
