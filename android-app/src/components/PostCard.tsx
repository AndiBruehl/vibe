import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { Post } from "@/lib/api";
import { colors } from "@/theme";

type PostCardProps = {
  post: Post;
};

export default function PostCard({ post }: PostCardProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate("PostDetail", { postId: post.id })}
    >
      <Image source={{ uri: post.image }} style={styles.image} />
      <View style={styles.body}>
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
        <Text style={styles.description} numberOfLines={2}>
          {post.description}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="heart-outline" color={colors.red} size={16} />
          <Text style={styles.metaText}>{post.likesCount} likes</Text>
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
