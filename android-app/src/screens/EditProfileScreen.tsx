import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import Screen from "@/components/Screen";
import { colors } from "@/theme";

function imageType(uri: string) { return uri.endsWith(".png") ? "image/png" : uri.endsWith(".webp") ? "image/webp" : "image/jpeg"; }
function cid(value: any) { return value?.IpfsHash || value?.cid || value?.data?.IpfsHash || value?.data?.cid || null; }

export default function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, "EditProfile">>();
  const { updateProfile } = useAuth();
  const [name, setName] = useState(params.profile.name || "");
  const [username, setUsername] = useState(params.profile.username || "");
  const [subtitle, setSubtitle] = useState(params.profile.subtitle || "");
  const [bio, setBio] = useState(params.profile.bio || "");
  const [avatar, setAvatar] = useState(params.profile.avatar || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function chooseAvatar() {
    if (saving) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.9 });
      if (result.canceled) return;
      setSaving(true); setError(null);
      const asset = result.assets[0];
      const signed = await api.getUploadUrl();
      const form = new FormData();
      form.append("file", { uri: asset.uri, type: imageType(asset.uri), name: asset.fileName || `avatar-${Date.now()}.jpg` } as any);
      const response = await fetch(signed.url, { method: "POST", body: form });
      const uploaded = await response.json().catch(() => null);
      const hash = cid(uploaded);
      if (!response.ok || !hash) throw new Error("Avatar upload failed. Please try again.");
      setAvatar(`${signed.gatewayBaseUrl}/${hash}`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Avatar upload failed."); }
    finally { setSaving(false); }
  }
  async function save() {
    if (saving) return;
    setSaving(true); setError(null);
    try {
      const profile = await api.updateProfile({ name, username, subtitle, bio, avatar });
      await updateProfile(profile);
      navigation.goBack();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Profile could not be saved."); }
    finally { setSaving(false); }
  }
  const input = { backgroundColor: colors.cardElevated, borderRadius: 12, color: colors.text, minHeight: 48, paddingHorizontal: 14, fontSize: 16 } as const;
  return <Screen><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={{ paddingVertical: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
    <View style={{ alignItems: "center", gap: 10 }}>{avatar ? <Image source={{ uri: avatar }} style={{ width: 96, height: 96, borderRadius: 48 }} /> : <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.cardElevated }} />}
      <Pressable accessibilityRole="button" onPress={() => void chooseAvatar()} disabled={saving} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.card }}><Text style={{ color: colors.text, fontWeight: "700" }}>Change avatar</Text></Pressable></View>
    <Text style={{ color: colors.text, fontWeight: "700" }}>Username</Text><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} maxLength={30} style={input} placeholder="your_username" placeholderTextColor={colors.muted} />
    <Text style={{ color: colors.text, fontWeight: "700" }}>Name</Text><TextInput value={name} onChangeText={setName} maxLength={80} style={input} placeholder="Your name" placeholderTextColor={colors.muted} />
    <Text style={{ color: colors.text, fontWeight: "700" }}>Subtitle</Text><TextInput value={subtitle} onChangeText={setSubtitle} maxLength={160} style={input} placeholder="What do you do?" placeholderTextColor={colors.muted} />
    <Text style={{ color: colors.text, fontWeight: "700" }}>Bio</Text><TextInput value={bio} onChangeText={setBio} maxLength={500} multiline textAlignVertical="top" style={[input, { minHeight: 130, paddingVertical: 12 }]} placeholder="Tell people about yourself" placeholderTextColor={colors.muted} />
    {error ? <Text accessibilityRole="alert" style={{ color: colors.textSoft }}>{error}</Text> : null}
    <Pressable accessibilityRole="button" onPress={() => void save()} disabled={saving} style={{ minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.red, opacity: saving ? 0.55 : 1 }}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={{ color: colors.white, fontSize: 16, fontWeight: "800" }}>Save profile</Text>}</Pressable>
  </ScrollView></KeyboardAvoidingView></Screen>;
}
