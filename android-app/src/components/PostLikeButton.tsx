import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, type Post } from "@/lib/api";
import { colors } from "@/theme";

export default function PostLikeButton({ post }: { post: Post }) {
  const [state, setState] = useState({ liked: !!post.liked, likes: post.likesCount });
  const [source, setSource] = useState(post);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);
  if (source !== post) {
    setSource(post);
    if (!pending) setState({ liked: !!post.liked, likes: post.likesCount });
  }
  async function toggle() {
    if (busy.current) return;
    busy.current = true;
    const previous = state;
    const liked = !state.liked;
    setState({ liked, likes: Math.max(0, state.likes + (liked ? 1 : -1)) });
    setPending(true);
    setError(false);
    try { setState(await api.setPostLiked(post.id, liked)); }
    catch { setState(previous); setError(true); }
    finally { busy.current = false; setPending(false); }
  }
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={state.liked ? "Unlike post" : "Like post"}
      accessibilityState={{ selected: state.liked, disabled: pending }} disabled={pending}
      onPress={event => { event.stopPropagation(); void toggle(); }}
      style={{ flexDirection: "row", alignItems: "center", gap: 7, minHeight: 44 }}>
      <Ionicons name={state.liked ? "heart" : "heart-outline"} color={state.liked ? colors.red : colors.muted} size={24} />
      <Text style={{ color: colors.textSoft }}>{state.likes} likes</Text>
    </Pressable>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.textSoft }}>Like could not be saved. Please try again.</Text> : null}
  </View>;
}
