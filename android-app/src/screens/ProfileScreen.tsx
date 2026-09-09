import { useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import ErrorState from "@/components/ErrorState";
import { useRemoteData } from "@/hooks/useRemoteData";
import LoadingState from "@/components/LoadingState";
import Screen from "@/components/Screen";
import { useAuth } from "@/auth/AuthContext";
import { api, Profile } from "@/lib/api";
import { colors } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut, profile: cachedProfile } = useAuth();
  const { data: profile, isLoading, isRefreshing, error, refresh } = useRemoteData<Profile | null>(api.getProfile, cachedProfile);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (isLoading && !profile) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <ErrorState message={error || "Your profile could not be loaded."} onRetry={() => void refresh()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} tintColor={colors.red} colors={[colors.red]} />}>
        {error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}
        <View style={styles.card}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <Text style={styles.name}>{profile.name || "Unknown"}</Text>
          <Text style={styles.subtitle}>{profile.subtitle}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
          <Pressable accessibilityRole="button" style={styles.editButton} onPress={() => navigation.navigate("EditProfile", { profile })}>
            <Text style={styles.signOutText}>Edit profile</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.signOutButton} onPress={() => void signOut().catch(() => setSignOutError("Could not sign out. Please try again."))}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
          {signOutError ? <Text accessibilityRole="alert" style={styles.bio}>{signOutError}</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 16,
    paddingTop: 4,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 24,
  },
  avatar: {
    backgroundColor: colors.cardElevated,
    borderRadius: 52,
    height: 104,
    width: 104,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 16,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  bio: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  signOutButton: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  editButton: {
    backgroundColor: colors.red,
    borderRadius: 14,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  signOutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
});
