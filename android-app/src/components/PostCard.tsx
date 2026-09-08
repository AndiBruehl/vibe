import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import PostLikeButton from "@/components/PostLikeButton";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { Post } from "@/lib/api";
import { colors } from "@/theme";
import PostImages from "@/components/PostImages";

type PostCardProps = {
  compact?: boolean;
  post: Post;
  style?: StyleProp<ViewStyle>;
};

export default function PostCard({ compact = false, post, style }: PostCardProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      style={[styles.card, style]}
      onPress={() => navigation.navigate("PostDetail", { postId: post.id })}
    >
      {compact ? <Image source={{ uri: post.image }} style={styles.image} /> :
        <PostImages key={post.id} image={post.image} images={post.images} description={post.description} />}
      <View style={styles.body}>
        {!compact ? (
          <View style={styles.authorRow}>
            {post.author.avatar ? (
              <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback} />
            )}
            <View style={styles.authorText}>
              <Text style={styles.name} numberOfLines={1}>
                {post.author.name || "Unknown"}
              </Text>
              <Text style={styles.username} numberOfLines={1}>
                @{post.author.username || "user"}
              </Text>
            </View>
          </View>
        ) : null}
        <Text style={[styles.description, compact && styles.compactDescription]} numberOfLines={2}>
          {post.description}
        </Text>
        <View style={styles.metaRow}>
          <PostLikeButton key={post.id} post={post} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
  },
  image: {
    aspectRatio: 1,
    backgroundColor: colors.cardElevated,
    width: "100%",
  },
  body: {
    padding: 12,
  },
  authorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  avatarFallback: {
    backgroundColor: colors.cardElevated,
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  authorText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  username: {
    color: colors.muted,
    fontSize: 12,
  },
  description: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  compactDescription: {
    marginTop: 0,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
});
