import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { Profile } from "@/lib/api";

const TOKEN_KEY = "vibe.mobileToken";
const PROFILE_KEY = "vibe.profile";

export async function getStoredToken() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) return token;
  const legacy = await AsyncStorage.getItem(TOKEN_KEY);
  if (legacy) {
    await SecureStore.setItemAsync(TOKEN_KEY, legacy);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
  return legacy;
}

export async function getStoredProfile() {
  const value = await AsyncStorage.getItem(PROFILE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Profile;
  } catch {
    await AsyncStorage.removeItem(PROFILE_KEY);
    return null;
  }
}

export async function storeSession(token: string, profile: Profile) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function storeToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.multiRemove([TOKEN_KEY, PROFILE_KEY]);
}
