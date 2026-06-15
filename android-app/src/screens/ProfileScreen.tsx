import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import LoadingState from "@/components/LoadingState";
import Screen from "@/components/Screen";
import { api, Profile } from "@/lib/api";
import { colors } from "@/theme";

export default function ProfileScreen() {
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
        <Header title="Profile" />
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
      <Header title="Profile" subtitle={`@${profile.username || "user"}`} />
      <View style={styles.card}>
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <Text style={styles.name}>{profile.name || "Unknown"}</Text>
        <Text style={styles.subtitle}>{profile.subtitle}</Text>
        <Text style={styles.bio}>{profile.bio}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
});
