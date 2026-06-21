import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Profile } from "@/lib/api";

const TOKEN_KEY = "vibe.mobileToken";
const PROFILE_KEY = "vibe.profile";

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredProfile() {
  const value = await AsyncStorage.getItem(PROFILE_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as Profile;
}

export async function storeSession(token: string, profile: Profile) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [PROFILE_KEY, JSON.stringify(profile)],
  ]);
}

export async function storeToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, PROFILE_KEY]);
}
