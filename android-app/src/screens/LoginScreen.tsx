import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Screen from "@/components/Screen";
import { useAuth } from "@/auth/AuthContext";
import { apiUrl } from "@/lib/api";
import { colors } from "@/theme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signInWithMobileToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function startGoogleLogin() {
    setError(null);
    setIsSigningIn(true);

    try {
      const redirectUri = "vibe://auth";
      const loginUrl = `${apiUrl}/api/mobile/auth/google/start?redirectUri=${encodeURIComponent(
        redirectUri,
      )}`;
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        redirectUri,
      );

      if (result.type !== "success") {
        return;
      }

      const callbackUrl = new URL(result.url);
      const token = callbackUrl.searchParams.get("token");
      const callbackError = callbackUrl.searchParams.get("error");

      if (callbackError) {
        setError(callbackError);
        return;
      }

      if (!token) {
        setError("Google did not return a mobile session.");
        return;
      }

      await signInWithMobileToken(token);
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Google sign-in failed.";
      setError(message);
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <Screen maxWidth={520}>
      <View style={styles.wrap}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>V</Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.title}>VIBE</Text>
          <Text style={styles.subtitle}>
            Sign in to see your feed, messages and profile.
          </Text>
          <Pressable
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
  logoMark: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    shadowColor: colors.red,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    width: 68,
  },
  logoMarkText: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
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
