import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/auth/AuthContext";
import ActivityScreen from "@/screens/ActivityScreen";
import BrowseScreen from "@/screens/BrowseScreen";
import CreateScreen from "@/screens/CreateScreen";
import HomeScreen from "@/screens/HomeScreen";
import LoadingState from "@/components/LoadingState";
import LoginScreen from "@/screens/LoginScreen";
import MessagesScreen from "@/screens/MessagesScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import SearchScreen from "@/screens/SearchScreen";
import PostDetailScreen from "@/screens/PostDetailScreen";
import ConversationScreen from "@/screens/ConversationScreen";
import Screen from "@/components/Screen";
import { colors } from "@/theme";
import ProfilesScreen, { PublicProfileScreen } from "@/screens/ProfilesScreen";
import type { Profile } from "@/lib/api";

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  PostDetail: { postId: string };
  Conversation: { conversationId: string; title?: string };
  Activity: undefined;
  Browse: undefined;
  Profiles: undefined;
  PublicProfile: { profile: Profile };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Create: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const tabIcons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline", Search: "search-outline", Create: "add-circle-outline",
  Messages: "chatbubble-ellipses-outline", Profile: "person-outline",
};

function Tabs({ navigation }: { navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<RootStackParamList, "Tabs"> }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 22, fontWeight: "700" },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => <Ionicons name={tabIcons[route.name]} color={color} size={size} />,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerTitle: "VIBE", headerRight: () => (
        <Pressable accessibilityRole="button" accessibilityLabel="Activity" onPress={() => navigation.navigate("Activity")} style={{ padding: 12, marginRight: 4 }}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </Pressable>
      ) }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ headerRight: () => (
        <Pressable accessibilityRole="button" accessibilityLabel="Browse posts" onPress={() => navigation.navigate("Browse")} style={{ padding: 12, marginRight: 4 }}>
          <Ionicons name="grid-outline" size={24} color={colors.text} />
        </Pressable>
      ) }} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isReady, isSignedIn } = useAuth();

  if (!isReady) {
    return (
      <Screen insetTop>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitle: "",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitle: "",
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {isSignedIn ? (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerTitle: "Post" }} />
          <Stack.Screen name="Conversation" component={ConversationScreen} options={({ route }) => ({ headerTitle: route.params.title || "Conversation" })} />
          <Stack.Screen name="Activity" component={ActivityScreen} options={{ headerTitle: "Activity" }} />
          <Stack.Screen name="Browse" component={BrowseScreen} options={{ headerTitle: "Browse" }} />
          <Stack.Screen name="Profiles" component={ProfilesScreen} options={{ headerTitle: "Profiles" }} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ headerTitle: "Profile" }} />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: colors.background,
              card: colors.surface,
              text: colors.text,
              border: colors.border,
              primary: colors.red,
              notification: colors.red,
            },
          }}
        >
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
