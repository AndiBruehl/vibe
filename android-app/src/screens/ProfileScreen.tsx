import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import Screen from "@/components/Screen";
import { useAuth } from "@/auth/AuthContext";
import { api, Profile } from "@/lib/api";
import { colors } from "@/theme";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getProfile()
      .then(setProfile)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <EmptyState
          icon="person-outline"
          title="Sign in needed"
          body="Connect auth endpoints to load your profile."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <Text style={styles.name}>{profile.name || "Unknown"}</Text>
          <Text style={styles.subtitle}>{profile.subtitle}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
          <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
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
  signOutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
});
