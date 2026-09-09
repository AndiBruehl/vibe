import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, BackHandler, Easing, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { colors } from "@/theme";
import { parseLoginCallback, type PendingLogin } from "@/lib/loginCallback";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
const vibeUrl = (process.env.EXPO_PUBLIC_API_URL || extra?.apiUrl || "https://vibe-social-network.vercel.app").replace(/\/$/, "");
const appVersion = Constants.expoConfig?.version || "0.1.34";
const mobileTokenKey = "vibe.webMobileToken";
const pendingLoginKey = "vibe.pendingLogin";
const releaseManifestUrl = "https://raw.githubusercontent.com/AndiBruehl/vibe/main/public/releases/latest.json";

type UpdateRelease = { version: string; downloadUrl: string };

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

async function getLatestAndroidRelease(): Promise<UpdateRelease | null> {
  try {
    const response = await fetch(`${releaseManifestUrl}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    const manifest = await response.json() as { android?: UpdateRelease };
    return typeof manifest.android?.version === "string" && typeof manifest.android?.downloadUrl === "string"
      ? manifest.android
      : null;
  } catch {
    return null;
  }
}

WebBrowser.maybeCompleteAuthSession();

// Retained for the legacy native screens that remain in the repository while the
// app uses the responsive VIBE experience directly.
export type RootStackParamList = {
  Login: undefined; Tabs: undefined; PostDetail: { postId: string };
  Conversation: { conversationId: string; title?: string }; Activity: undefined;
  Browse: undefined; Profiles: undefined; PublicProfile: { profile: import("@/lib/api").Profile };
  EditProfile: { profile: import("@/lib/api").Profile };
};

export default function App() {
  const browser = useRef<WebView>(null);
  const initialDocumentLoaded = useRef(false);
  const navigationProgress = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [mobileToken, setMobileToken] = useState<string | null | undefined>(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [update, setUpdate] = useState<UpdateRelease | null>(null);
  const [webDarkMode, setWebDarkMode] = useState(true);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    void SecureStore.getItemAsync(mobileTokenKey)
      .then(setMobileToken)
      .catch(() => setMobileToken(null));
  }, []);

  useEffect(() => {
    if (!mobileToken) return;
    void getLatestAndroidRelease().then((release) => {
      if (release && compareVersions(release.version, appVersion) > 0) setUpdate(release);
    });
  }, [mobileToken]);

  const finishLogin = useCallback(async (url: string) => {
    const stored = await SecureStore.getItemAsync(pendingLoginKey);
    const pending = stored ? JSON.parse(stored) as PendingLogin : null;
    const token = parseLoginCallback(url, pending);
    await SecureStore.setItemAsync(mobileTokenKey, token);
    await SecureStore.deleteItemAsync(pendingLoginKey);
    setMobileToken(token);
  }, []);

  const startLogin = useCallback(async () => {
    setSigningIn(true); setLoginError(null);
    try {
      const state = Crypto.randomUUID();
      await SecureStore.setItemAsync(pendingLoginKey, JSON.stringify({ state, startedAt: Date.now() }));
      const redirectUri = `vibe://auth?state=${encodeURIComponent(state)}`;
      const url = `${vibeUrl}/api/mobile/auth/google/start?redirectUri=${encodeURIComponent(redirectUri)}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") throw new Error("Sign-in was cancelled. Please try again.");
      await finishLogin(result.url);
    } catch (cause) {
      setLoginError(cause instanceof Error ? cause.message : "Google sign-in failed.");
    } finally { setSigningIn(false); }
  }, [finishLogin]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith("vibe://auth")) void finishLogin(url).catch(cause => setLoginError(cause instanceof Error ? cause.message : "Google sign-in failed."));
    });
    return () => subscription.remove();
  }, [finishLogin]);

  const handleNavigation = useCallback((state: WebViewNavigation) => setCanGoBack(state.canGoBack), []);
  const beginNavigation = useCallback(() => {
    navigationProgress.stopAnimation();
    navigationProgress.setValue(0);
    setNavigating(true);
    Animated.timing(navigationProgress, { toValue: 0.78, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [navigationProgress]);
  const completeNavigation = useCallback(() => {
    Animated.timing(navigationProgress, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(() => {
      setNavigating(false);
      navigationProgress.setValue(0);
    });
  }, [navigationProgress]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      browser.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const source = useMemo(() => mobileToken ? {
    html: `<!doctype html><html><body><form id="login" method="post" action="${vibeUrl}/api/mobile/auth/web"><input type="hidden" name="token" value="${mobileToken.replace(/&/g, "&amp;").replace(/\"/g, "&quot;")}"></form><script>document.getElementById('login').submit()</script></body></html>`,
    baseUrl: vibeUrl,
  } : { uri: vibeUrl }, [mobileToken]);
  const themeBridge = useMemo(() => `
    (function () {
      var sendTheme = function () {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: "vibe-theme", dark: document.documentElement.classList.contains("dark") }));
      };
      sendTheme();
      new MutationObserver(sendTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    })(); true;
  `, []);
  const downloadUpdate = useCallback(async () => {
    if (!update || downloadingUpdate) return;
    if (Platform.OS !== "android") {
      await Linking.openURL(update.downloadUrl);
      return;
    }
    setDownloadingUpdate(true);
    setUpdateError(null);
    try {
      const destination = `${FileSystem.cacheDirectory}Vibe-${update.version}.apk`;
      const result = await FileSystem.downloadAsync(update.downloadUrl, destination);
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        flags: 1,
        type: "application/vnd.android.package-archive",
      });
    } catch {
      setUpdateError("The update could not be downloaded. Please try again.");
    } finally {
      setDownloadingUpdate(false);
    }
  }, [downloadingUpdate, update]);

  if (mobileToken === undefined) return <SafeAreaProvider><SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator color={colors.red} size="large" /></View></SafeAreaView></SafeAreaProvider>;

  return <SafeAreaProvider><SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
    <StatusBar style="light" />
    {mobileToken ? <WebView ref={browser} source={source} style={styles.web} userAgent={`VibeAndroid/${appVersion}`}
      sharedCookiesEnabled thirdPartyCookiesEnabled domStorageEnabled javaScriptEnabled
      setSupportMultipleWindows={false} onNavigationStateChange={handleNavigation}
      injectedJavaScript={themeBridge}
      onMessage={({ nativeEvent }) => {
        try {
          const data = JSON.parse(nativeEvent.data) as { type?: string; dark?: boolean };
          if (data.type === "vibe-theme") setWebDarkMode(Boolean(data.dark));
        } catch { /* Ignore messages not emitted by the VIBE theme bridge. */ }
      }}
      onLoadStart={() => {
        if (!initialDocumentLoaded.current) { setLoading(true); setError(false); }
        else beginNavigation();
      }}
      onLoadEnd={() => {
        initialDocumentLoaded.current = true;
        setLoading(false);
        completeNavigation();
      }}
      onError={() => { setLoading(false); setError(true); }}
      onShouldStartLoadWithRequest={request => {
        if (/^https?:\/\//i.test(request.url)) return true;
        void Linking.openURL(request.url);
        return false;
      }}
    /> : <View style={styles.login}><Text style={styles.loginTitle}>VIBE</Text><Text style={styles.loginSubtitle}>Sign in to open VIBE.</Text><Pressable style={styles.loginButton} disabled={signingIn} onPress={() => void startLogin()}>{signingIn ? <ActivityIndicator color={colors.white} /> : <Text style={styles.loginButtonText}>Continue with Google</Text>}</Pressable>{loginError ? <Text style={styles.loginError}>{loginError}</Text> : null}</View>}
    {mobileToken && loading && <View pointerEvents="none" style={styles.loading}><ActivityIndicator color={colors.red} size="large" /></View>}
    {mobileToken && navigating && <View pointerEvents="none" style={styles.navigationFeedback}>
      <Animated.View style={[styles.navigationProgress, { width: navigationProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
      <View style={styles.navigationSpinner}><ActivityIndicator color={colors.white} size="small" /></View>
    </View>}
    {mobileToken && update && <View style={[styles.updateBanner, webDarkMode ? styles.updateBannerDark : styles.updateBannerLight]}>
      <View style={styles.updateTextWrap}>
        <Text style={styles.updateEyebrow}>VIBE UPDATE</Text>
        <Text style={[styles.updateTitle, webDarkMode ? styles.updateTitleDark : styles.updateTitleLight]}>Update available</Text>
        <Text style={[styles.updateText, webDarkMode ? styles.updateTextDark : styles.updateTextLight]}>{updateError ?? `VIBE ${update.version} is ready to download.`}</Text>
      </View>
      <Pressable accessibilityRole="button" disabled={downloadingUpdate} style={[styles.updateButton, downloadingUpdate && styles.updateButtonDisabled]} onPress={() => void downloadUpdate()}>
        {downloadingUpdate ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.updateButtonText}>Download</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setUpdate(null)}>
        <Text style={[styles.updateDismiss, webDarkMode ? styles.updateTextDark : styles.updateTextLight]}>×</Text>
      </Pressable>
    </View>}
    {error && <View style={styles.error}><Text style={styles.errorTitle}>VIBE could not connect</Text><Text style={styles.errorText}>Check your connection and try again.</Text><Pressable accessibilityRole="button" style={styles.retry} onPress={() => { setError(false); browser.current?.reload(); }}><Text style={styles.retryText}>Try again</Text></Pressable></View>}
  </SafeAreaView></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  web: { flex: 1, backgroundColor: colors.background },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  navigationFeedback: { position: "absolute", top: 0, left: 0, right: 0, height: 4, zIndex: 20 },
  navigationProgress: { height: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.red },
  navigationSpinner: { position: "absolute", right: 14, top: 12, width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "rgba(15, 23, 42, 0.72)" },
  updateBanner: { position: "absolute", left: 12, right: 12, top: 12, zIndex: 30, alignItems: "center", flexDirection: "row", gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, elevation: 8, shadowColor: "#0f172a", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  updateBannerDark: { backgroundColor: "#162137", borderColor: "#34445e" },
  updateBannerLight: { backgroundColor: "#ffffff", borderColor: "#d8e2ef" },
  updateTextWrap: { flex: 1 },
  updateEyebrow: { color: colors.orange, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  updateTitle: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  updateTitleDark: { color: "#f8fafc" },
  updateTitleLight: { color: "#24456b" },
  updateText: { fontSize: 12, marginTop: 2 },
  updateTextDark: { color: "#b4c2d9" },
  updateTextLight: { color: "#54779a" },
  updateButton: { borderRadius: 10, backgroundColor: colors.red, paddingHorizontal: 11, paddingVertical: 8 },
  updateButtonDisabled: { opacity: 0.7 },
  updateButtonText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  updateDismiss: { fontSize: 24, lineHeight: 24 },
  error: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 12, padding: 28, backgroundColor: colors.background },
  errorTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  errorText: { color: colors.textSoft, textAlign: "center" },
  retry: { minHeight: 48, justifyContent: "center", borderRadius: 14, paddingHorizontal: 22, backgroundColor: colors.red },
  retryText: { color: colors.white, fontWeight: "800" },
  login: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 14 },
  loginTitle: { color: colors.text, fontSize: 40, fontWeight: "900" },
  loginSubtitle: { color: colors.textSoft, fontSize: 16 },
  loginButton: { alignItems: "center", backgroundColor: colors.red, borderRadius: 16, justifyContent: "center", marginTop: 10, minHeight: 54, paddingHorizontal: 24, alignSelf: "stretch" },
  loginButtonText: { color: colors.white, fontWeight: "800", fontSize: 16 },
  loginError: { color: "#fecaca", textAlign: "center" },
});
