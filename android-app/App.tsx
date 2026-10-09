import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, BackHandler, Easing, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
const appVersion = Constants.expoConfig?.version || "0.1.69.1";
const mobileTokenKey = "vibe.webMobileToken";
const pendingLoginKey = "vibe.pendingLogin";
const releaseManifestUrl = "https://raw.githubusercontent.com/AndiBruehl/vibe/main/public/releases/latest.json";

type UpdateRelease = { version: string; downloadUrl: string; sha256: string; sizeBytes: number };

function isYouTubeUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "youtu.be" || host.endsWith(".youtu.be") || host === "youtube.com" || host.endsWith(".youtube.com");
  } catch {
    return false;
  }
}

function isExternalHttpUrl(url: string) {
  try {
    const target = new URL(url);
    const appHost = new URL(vibeUrl).host;
    return (target.protocol === "https:" || target.protocol === "http:") && target.host !== appHost;
  } catch {
    return false;
  }
}

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
    return typeof manifest.android?.version === "string" && typeof manifest.android?.downloadUrl === "string" &&
      typeof manifest.android?.sha256 === "string" && typeof manifest.android?.sizeBytes === "number"
      ? manifest.android
      : null;
  } catch {
    return null;
  }
}

async function downloadAndInstallApk(release: Pick<UpdateRelease, "downloadUrl" | "sizeBytes"> | { downloadUrl: string; sizeBytes?: number }) {
  const destination = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}Vibe-update.apk`;
  const result = await FileSystem.downloadAsync(release.downloadUrl, destination, { headers: { Accept: "application/vnd.android.package-archive" } });
  if (result.status < 200 || result.status >= 300 || !result.uri.toLowerCase().endsWith(".apk")) throw new Error("APK download failed.");
  const info = await FileSystem.getInfoAsync(result.uri);
  if (typeof release.sizeBytes === "number" && info.exists && info.size !== release.sizeBytes) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    throw new Error("APK integrity check failed.");
  }
  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", { data: contentUri, flags: 1, type: "application/vnd.android.package-archive" });
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
  const loginInFlight = useRef(false);
  const completingLogin = useRef(false);
  const completedCallback = useRef<string | null>(null);
  const [lastProvider, setLastProvider] = useState<"google" | "discord">("google");
  const [acknowledged, setAcknowledged] = useState(false);
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
    if (completingLogin.current || completedCallback.current === url) return;
    completingLogin.current = true;
    try {
    const stored = await SecureStore.getItemAsync(pendingLoginKey);
    const pending = stored ? JSON.parse(stored) as PendingLogin : null;
    const token = parseLoginCallback(url, pending);
    if (token === "linked") {
      await SecureStore.deleteItemAsync(pendingLoginKey);
      completedCallback.current = url;
      browser.current?.reload();
      Alert.alert("VIBE", "Sign-in method linked. You can use either method next time.");
      return;
    }
    const response = await fetch(`${vibeUrl}/api/mobile/profile`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(response.status === 401 ? "This sign-in expired before VIBE could confirm it. Start again from this screen." : "VIBE is temporarily unavailable. Keep this screen open and try again in a moment.");
    const profile = await response.json();
    if (!profile?.id) throw new Error("VIBE could not validate this sign-in. No account was changed; start again from this screen.");
    await SecureStore.setItemAsync(mobileTokenKey, token);
    await SecureStore.deleteItemAsync(pendingLoginKey);
    setMobileToken(token);
    completedCallback.current = url;
    } finally { completingLogin.current = false; }
  }, []);

  const startLogin = useCallback(async (provider: "google" | "discord", linkToken?: string) => {
    if (loginInFlight.current) return;
    loginInFlight.current = true;
    setLastProvider(provider);
    setSigningIn(true); setLoginError(null);
    try {
      const state = Crypto.randomUUID();
      await SecureStore.setItemAsync(pendingLoginKey, JSON.stringify({ state, startedAt: Date.now(), linking: Boolean(linkToken) }));
      const redirectUri = `vibe://auth?state=${encodeURIComponent(state)}`;
      const url = `${vibeUrl}/api/mobile/auth/start?provider=${provider}&redirectUri=${encodeURIComponent(redirectUri)}${linkToken ? `&linkToken=${encodeURIComponent(linkToken)}` : ""}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") {
        await SecureStore.deleteItemAsync(pendingLoginKey);
        throw new Error("Sign-in was cancelled before anything changed. You can try again here.");
      }
      await finishLogin(result.url);
    } catch (cause) {
      setLoginError(cause instanceof Error ? cause.message : "Sign-in failed. Start again from this screen.");
      if (linkToken) Alert.alert("VIBE", cause instanceof Error ? cause.message : "Linking failed. Your current session is unchanged; try again from Settings.");
    } finally { loginInFlight.current = false; setSigningIn(false); }
  }, [finishLogin]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith("vibe://auth")) void finishLogin(url).catch(cause => setLoginError(cause instanceof Error ? cause.message : "Sign-in failed. Start again from this screen."));
    });
    void Linking.getInitialURL().then(url => {
      if (url?.startsWith("vibe://auth")) return finishLogin(url);
    }).catch(() => setLoginError("Could not resume sign-in. Start again from this screen."));
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
      await downloadAndInstallApk(update);
    } catch (cause) {
      setUpdateError(cause instanceof Error && cause.message.includes("integrity")
        ? "The update download did not match the release metadata. Opening the APK download instead."
        : "The update could not be installed. Opening the APK download instead.");
      try { await Linking.openURL(update.downloadUrl); } catch { /* Keep the clear in-app error visible. */ }
    } finally {
      setDownloadingUpdate(false);
    }
  }, [downloadingUpdate, update]);

  if (mobileToken === undefined) return <SafeAreaProvider><SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator color={colors.red} size="large" /></View></SafeAreaView></SafeAreaProvider>;

  return <SafeAreaProvider><SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
    <StatusBar style="light" />
    {mobileToken ? <WebView ref={browser} source={source} style={styles.web} applicationNameForUserAgent={` VibeAndroid/${appVersion}`}
      sharedCookiesEnabled thirdPartyCookiesEnabled domStorageEnabled javaScriptEnabled
      setSupportMultipleWindows={false} onNavigationStateChange={handleNavigation}
      injectedJavaScript={themeBridge}
      onMessage={({ nativeEvent }) => {
        try {
          if (new URL(nativeEvent.url).origin !== new URL(vibeUrl).origin) return;
          const data = JSON.parse(nativeEvent.data) as { type?: string; dark?: boolean; provider?: string; linkToken?: string };
          if (data.type === "vibe-link-provider" && (data.provider === "google" || data.provider === "discord") && typeof data.linkToken === "string" && /^[a-f0-9]{64}$/.test(data.linkToken)) void startLogin(data.provider, data.linkToken);
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
        if (isYouTubeUrl(request.url)) {
          void Linking.openURL(request.url);
          return false;
        }
        if (/\.apk(?:[?#].*)?$/i.test(request.url)) {
          void (async () => {
            try {
              await downloadAndInstallApk({ downloadUrl: request.url });
            } catch {
              Alert.alert("VIBE", "The APK could not be installed. The download will open in your browser.");
              try { await Linking.openURL(request.url); } catch { /* The alert already explains the recoverable failure. */ }
            }
          })();
          return false;
        }
        if (isExternalHttpUrl(request.url)) {
          void Linking.openURL(request.url);
          return false;
        }
        if (/^https?:\/\//i.test(request.url)) return true;
        void Linking.openURL(request.url);
        return false;
      }}
    /> : <ScrollView contentContainerStyle={styles.login}><Text style={styles.loginTitle}>VIBE</Text><Text style={styles.loginSubtitle}>Sign in to open VIBE.</Text>
      <Text style={styles.loginError}>Use your existing sign-in method. To keep Google and Discord on one profile, sign in first and link the other method in Settings. Cancelled or failed attempts do not change your account.</Text>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }} onPress={() => setAcknowledged(value => !value)}><Text style={styles.loginButtonText}>{acknowledged ? "☑" : "☐"} I have read and understood.</Text></Pressable>
      {(["google", "discord"] as const).map(provider => <Pressable key={provider} accessibilityRole="button" style={[styles.loginButton, (!acknowledged || signingIn) && styles.updateButtonDisabled]} disabled={signingIn || !acknowledged} onPress={() => void startLogin(provider)}>{signingIn && lastProvider === provider ? <ActivityIndicator color={colors.white} /> : <Text style={styles.loginButtonText}>Continue with {provider === "google" ? "Google" : "Discord"}</Text>}</Pressable>)}
      {loginError ? <><Text accessibilityRole="alert" style={styles.loginError}>{loginError}</Text><Pressable accessibilityRole="button" disabled={signingIn || !acknowledged} style={styles.retry} onPress={() => void startLogin(lastProvider)}><Text style={styles.retryText}>Try again</Text></Pressable></> : null}</ScrollView>}
    {mobileToken && loading && <View pointerEvents="none" style={styles.loading}><ActivityIndicator color={colors.red} size="large" /></View>}
    {mobileToken && navigating && <View pointerEvents="none" style={styles.navigationFeedback}>
      <Animated.View style={[styles.navigationProgress, { width: navigationProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
      <View style={styles.navigationSpinner}><ActivityIndicator color={colors.white} size="small" /></View>
    </View>}
    {mobileToken && update && <View style={[styles.updateOverlay, webDarkMode ? styles.updateOverlayDark : styles.updateOverlayLight]}>
      <View style={[styles.updateBanner, webDarkMode ? styles.updateBannerDark : styles.updateBannerLight]}>
      <View style={styles.updateTextWrap}>
        <Text style={styles.updateEyebrow}>VIBE UPDATE</Text>
        <Text style={[styles.updateTitle, webDarkMode ? styles.updateTitleDark : styles.updateTitleLight]}>Update available</Text>
        <Text style={[styles.updateText, webDarkMode ? styles.updateTextDark : styles.updateTextLight]}>{updateError ?? `VIBE BETA ${update.version} is ready to download. Metadata includes SHA-256 and byte-size checks.`}</Text>
      </View>
      <Pressable accessibilityRole="button" disabled={downloadingUpdate} style={[styles.updateButton, downloadingUpdate && styles.updateButtonDisabled]} onPress={() => void downloadUpdate()}>
        {downloadingUpdate ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.updateButtonText}>Download</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setUpdate(null)}>
        <Text style={[styles.updateDismiss, webDarkMode ? styles.updateTextDark : styles.updateTextLight]}>×</Text>
      </Pressable>
      </View>
    </View>}
    {error && <View style={styles.error}><Text style={styles.errorTitle}>VIBE could not connect</Text><Text style={styles.errorText}>Your session is kept on this device. Check your connection, then retry.</Text><Pressable accessibilityRole="button" style={styles.retry} onPress={() => { setError(false); browser.current?.reload(); }}><Text style={styles.retryText}>Retry connection</Text></Pressable></View>}
  </SafeAreaView></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  web: { flex: 1, backgroundColor: colors.background },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  navigationFeedback: { position: "absolute", top: 0, left: 0, right: 0, height: 4, zIndex: 20 },
  navigationProgress: { height: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.red },
  navigationSpinner: { position: "absolute", right: 14, top: 12, width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "rgba(15, 23, 42, 0.72)" },
  updateOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30, alignItems: "center", justifyContent: "center", padding: 24 },
  updateOverlayDark: { backgroundColor: "rgba(2, 6, 23, 0.56)" },
  updateOverlayLight: { backgroundColor: "rgba(15, 23, 42, 0.25)" },
  updateBanner: { width: "100%", maxWidth: 420, alignItems: "center", flexDirection: "row", gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, elevation: 8, shadowColor: "#0f172a", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
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
  login: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 14 },
  loginTitle: { color: colors.text, fontSize: 40, fontWeight: "900" },
  loginSubtitle: { color: colors.textSoft, fontSize: 16 },
  loginButton: { alignItems: "center", backgroundColor: colors.red, borderRadius: 16, justifyContent: "center", marginTop: 10, minHeight: 54, paddingHorizontal: 24, alignSelf: "stretch" },
  loginButtonText: { color: colors.white, fontWeight: "800", fontSize: 16 },
  loginError: { color: "#fecaca", textAlign: "center" },
});
