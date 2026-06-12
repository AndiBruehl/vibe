import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import Screen from "@/components/Screen";
import { colors } from "@/theme";

export default function CreateScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");

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

  return (
    <Screen>
      <Header title="Create" subtitle="Draft a new post for Vibe" />
      <View style={styles.wrap}>
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
        <Pressable style={[styles.button, !imageUri && styles.buttonDisabled]} disabled={!imageUri}>
          <Ionicons name="send-outline" color={colors.white} size={18} />
          <Text style={styles.buttonText}>Publish</Text>
        </Pressable>
        <Text style={styles.note}>
          Mobile publishing is wired as UI first. The production upload endpoint uses signed Pinata URLs and can be connected here next.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
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
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
