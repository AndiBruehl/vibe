import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { api, type Profile } from "@/lib/api";
import Screen from "@/components/Screen";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import { useRemoteData } from "@/hooks/useRemoteData";
import { colors } from "@/theme";

const sorts = [
  ["newest", "Newest to oldest"], ["oldest", "Oldest to newest"],
  ["az", "A to Z"], ["za", "Z to A"],
] as const;

function ProfileContent({ profile, full = false }: { profile: Profile; full?: boolean }) {
  return <View style={{ flexDirection: "row", gap: 14, padding: 16 }}>
    {profile.avatar ? <Image source={{ uri: profile.avatar }} style={{ width: 60, height: 60, borderRadius: 30 }} /> :
      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.cardElevated, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text, fontSize: 24 }}>{(profile.name || profile.username || "?").slice(0, 1).toUpperCase()}</Text>
      </View>}
    <View style={{ flex: 1, gap: 5 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{profile.name || profile.username || "Unnamed profile"}</Text>
      {profile.username ? <Text style={{ color: colors.muted }}>@{profile.username}</Text> : null}
      {profile.subtitle ? <Text numberOfLines={full ? undefined : 3} style={{ color: colors.textSoft, lineHeight: 21 }}>{profile.subtitle}</Text> : null}
      {full && profile.bio ? <Text style={{ color: colors.textSoft, lineHeight: 23, marginTop: 12 }}>{profile.bio}</Text> : null}
    </View>
  </View>;
}

function FollowButton({ profile }: { profile: Profile }) {
  const [following, setFollowing] = useState(!!profile.isFollowing);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);
  async function toggle() {
    if (busy.current) return;
    busy.current = true;
    const previous = following;
    setFollowing(!previous);
    setError(false);
    setPending(true);
    try { setFollowing((await api.setProfileFollowing(profile.id, !previous)).following); }
    catch { setFollowing(previous); setError(true); }
    finally { busy.current = false; setPending(false); }
  }
  if (profile.isSelf) return null;
  return <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={following ? "Unfollow profile" : "Follow profile"}
      accessibilityState={{ selected: following, disabled: pending }} onPress={() => void toggle()} disabled={pending}
      style={{ minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: following ? colors.cardElevated : colors.red }}>
      <Text style={{ color: colors.white, fontWeight: "700" }}>{following ? "Following" : "Follow"}</Text>
    </Pressable>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.textSoft }}>Follow could not be saved. Please try again.</Text> : null}
  </View>;
}

export function PublicProfileScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, "PublicProfile">>();
  return <Screen><ScrollView><View style={{ backgroundColor: colors.card, borderRadius: 16, marginVertical: 12 }}>
    <ProfileContent profile={params.profile} full />
    <FollowButton profile={params.profile} />
  </View></ScrollView></Screen>;
}

export default function ProfilesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const load = useCallback(() => api.getProfiles(search, sort), [search, sort]);
  const { data, isLoading, isRefreshing, error, refresh } = useRemoteData<Profile[]>(load, []);
  return <Screen>
    <FlatList data={data} keyExtractor={profile => profile.id}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      refreshing={isRefreshing} onRefresh={() => void refresh()}
      contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
      ListHeaderComponent={<View style={{ gap: 12 }}>
        <Text style={{ color: colors.textSoft }}>Find people and discover their vibes.</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Name, username or subtitle"
          accessibilityLabel="Search profiles" maxLength={200} autoCapitalize="none" autoCorrect={false}
          returnKeyType="search" onSubmitEditing={() => setSearch(query.trim())} placeholderTextColor={colors.muted}
          style={{ backgroundColor: colors.card, color: colors.text, borderRadius: 14, minHeight: 48, paddingHorizontal: 14, fontSize: 16 }} />
        <Text style={{ color: colors.text, fontWeight: "600" }}>Sort by</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {sorts.map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: sort === value }}
            onPress={() => setSort(value)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12, backgroundColor: sort === value ? colors.red : colors.card }}>
            <Text style={{ color: colors.text, fontWeight: sort === value ? "700" : "400" }}>{label}</Text>
          </Pressable>)}
        </View>
        <Text style={{ color: colors.muted }}>{data.length} {data.length === 1 ? "profile" : "profiles"}</Text>
        {error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}
      </View>}
      ListEmptyComponent={isLoading ? <LoadingState /> : error ? null : <EmptyState icon="people-outline" title={search ? "No matching profiles" : "No profiles yet"} body={search ? "Try another name or username." : "Profiles will appear here when people join."} />}
      renderItem={({ item }) => <View style={{ backgroundColor: colors.card, borderRadius: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View profile: ${item.name || item.username || "Unnamed profile"}`}
          onPress={() => navigation.navigate("PublicProfile", { profile: item })}><ProfileContent profile={item} /></Pressable>
        <FollowButton profile={item} />
      </View>} />
  </Screen>;
}
