import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Screen from "@/components/Screen";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import type { RootStackParamList } from "../../App";

function getImageType(uri: string) {
  const extension = uri.split(".").pop()?.toLowerCase();

  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "avif") return "image/avif";

  return "image/jpeg";
}

function getFileName(uri: string) {
  return uri.split("/").pop() || `vibe-${Date.now()}.jpg`;
}

function extractCid(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, any>;

  return (
    record.IpfsHash ||
    record.cid ||
    record.data?.IpfsHash ||
    record.data?.cid ||
    record.value?.cid ||
    null
  );
}

export default function CreateScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const topicCount = topics
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean).length;
  const tooManyTopics = topicCount > 5;

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string) {
    const signedUpload = await api.getUploadUrl();
    const formData = new FormData();

    formData.append("file", {
      name: getFileName(uri),
      type: getImageType(uri),
      uri,
    } as any);

    const response = await fetch(signedUpload.url, {
      body: formData,
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Image upload failed.");
    }

    const payload = await response.json().catch(() => null);
    const cid = extractCid(payload);

    if (!cid) {
      throw new Error("Image upload did not return an IPFS hash.");
    }

    return `${signedUpload.gatewayBaseUrl}/${cid}`;
  }

  async function publish() {
    if (!imageUri || tooManyTopics || isPublishing) {
      return;
    }

    setError(null);
    setIsPublishing(true);

    try {
      const image = await uploadImage(imageUri);
      const post = await api.createPost({
        description: description.trim(),
        image,
        topics: topics.trim(),
      });

      setImageUri(null);
      setDescription("");
      setTopics("");
      navigation.navigate("PostDetail", { postId: post.id });
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Could not publish this post.";
      setError(message);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <Screen maxWidth={640}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.wrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.imageBox} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="cloud-upload-outline" color={colors.white} size={28} />
                <Text style={styles.placeholderText}>Choose image</Text>
              </View>
            )}
          </Pressable>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your image..."
            placeholderTextColor={colors.muted}
            style={styles.textarea}
            multiline
          />
          <TextInput
            value={topics}
            onChangeText={setTopics}
            placeholder="Topics, comma separated"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          {tooManyTopics ? (
            <Text style={styles.reminder}>
              Please keep it to 5 topics per post.
            </Text>
          ) : null}
          <Pressable
            style={[
              styles.button,
              (!imageUri || tooManyTopics || isPublishing) && styles.buttonDisabled,
            ]}
            disabled={!imageUri || tooManyTopics || isPublishing}
            onPress={() => void publish()}
          >
            {isPublishing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="send-outline" color={colors.white} size={18} />
                <Text style={styles.buttonText}>Publish</Text>
              </>
            )}
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  wrap: {
    gap: 14,
    paddingBottom: 16,
    paddingTop: 4,
  },
  imageBox: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: colors.cardElevated,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  placeholderText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  textarea: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    minHeight: 130,
    padding: 14,
    textAlignVertical: "top",
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    padding: 14,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "900",
  },
  error: {
    color: "#fecaca",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  reminder: {
    color: "#fed7aa",
    fontSize: 13,
    lineHeight: 18,
  },
});
