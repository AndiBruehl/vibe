import { RouteProp, useRoute } from "@react-navigation/native";
import { Image, StyleSheet, Text, View } from "react-native";
import Header from "@/components/Header";
import Screen from "@/components/Screen";
import { colors } from "@/theme";
import type { RootStackParamList } from "../../App";

type PostDetailRoute = RouteProp<RootStackParamList, "PostDetail">;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRoute>();

  return (
    <Screen>
      <Header title="Post" subtitle={`Post ID: ${route.params.postId}`} />
      <View style={styles.card}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900" }}
          style={styles.image}
        />
        <Text style={styles.text}>
          This detail screen is ready for `/api/mobile/posts/{route.params.postId}`.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: "hidden",
  },
  image: {
    aspectRatio: 1,
    width: "100%",
  },
  text: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
    padding: 16,
  },
});
