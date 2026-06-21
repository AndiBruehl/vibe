import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import Screen from "@/components/Screen";
import { api, Post } from "@/lib/api";
import { colors } from "@/theme";
import type { RootStackParamList } from "../../App";

type PostDetailRoute = RouteProp<RootStackParamList, "PostDetail">;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRoute>();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPost(route.params.postId)
      .then(setPost)
      .catch((nextError) => {
        console.error(nextError);
        setError("This post could not be loaded.");
      })
      .finally(() => setIsLoading(false));
  }, [route.params.postId]);

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
        <EmptyState
          icon="image-outline"
          title="Post unavailable"
          body={error || "This post could not be loaded."}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Image source={{ uri: post.image }} style={styles.image} />
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
              <Ionicons name="heart-outline" color={colors.red} size={18} />
              <Text style={styles.metaText}>{post.likesCount} likes</Text>
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
