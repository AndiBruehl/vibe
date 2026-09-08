import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { parseLoginCallback, type PendingLogin } from "@/lib/loginCallback";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Screen from "@/components/Screen";
import VibeLogo from "@/components/VibeLogo";
import { useAuth } from "@/auth/AuthContext";
import { apiUrl } from "@/lib/api";
import { colors } from "@/theme";

WebBrowser.maybeCompleteAuthSession();
const PENDING_LOGIN_KEY = "vibe.pendingLogin";

export default function LoginScreen() {
  const { signInWithMobileToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const signingIn = useRef(false);
  const completing = useRef(false);

  const completeLogin = useCallback(async (url: string) => {
    if (completing.current) return;
    completing.current = true;
    setIsSigningIn(true);
    try {
      const stored = await SecureStore.getItemAsync(PENDING_LOGIN_KEY);
      const pending = stored ? JSON.parse(stored) as PendingLogin : null;
      const token = parseLoginCallback(url, pending);
      await signInWithMobileToken(token);
      await SecureStore.deleteItemAsync(PENDING_LOGIN_KEY);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Google sign-in failed.");
    } finally {
      completing.current = false;
      setIsSigningIn(false);
    }
  }, [signInWithMobileToken]);

  useEffect(() => {
    // The browser promise is lost if Android terminates the app during sign-in.
    void Linking.getInitialURL().then(url => {
      if (url?.startsWith("vibe://auth")) void completeLogin(url);
    }).catch(() => setError("Could not resume sign-in. Please try again."));
  }, [completeLogin]);

  async function startGoogleLogin() {
    if (signingIn.current) return;
    signingIn.current = true;
    setError(null);
    setIsSigningIn(true);

    try {
      const state = Crypto.randomUUID();
      await SecureStore.setItemAsync(PENDING_LOGIN_KEY, JSON.stringify({ state, startedAt: Date.now() }));
      const redirectUri = `vibe://auth?state=${encodeURIComponent(state)}`;
      const loginUrl = `${apiUrl}/api/mobile/auth/google/start?redirectUri=${encodeURIComponent(
        redirectUri,
      )}`;
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        redirectUri,
      );

      if (result.type !== "success") {
        setError("Sign-in was cancelled. You can try again.");
        return;
      }
      await completeLogin(result.url);
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Google sign-in failed.";
      setError(message);
    } finally {
      signingIn.current = false;
      setIsSigningIn(false);
    }
  }

  return (
    <Screen maxWidth={520} insetTop>
      <View style={styles.wrap}>
        <VibeLogo />
        <View style={styles.panel}>
          <Text style={styles.title}>VIBE</Text>
          <Text style={styles.subtitle}>
            Sign in to see your feed, messages and profile.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={isSigningIn}
            onPress={() => void startGoogleLogin()}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.pressed,
              isSigningIn && styles.disabledButton,
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="logo-google" color={colors.white} size={20} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  disabledButton: {
    opacity: 0.45,
  },
  error: {
    color: "#fecaca",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  googleButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  panel: {
    alignSelf: "stretch",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
  },
  pressed: {
    opacity: 0.85,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  wrap: {
    alignItems: "center",
    flex: 1,
    gap: 26,
    justifyContent: "center",
    paddingBottom: 20,
  },
});
