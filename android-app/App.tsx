import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
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
import VibeTabBar from "@/components/VibeTabBar";
import { colors } from "@/theme";

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  PostDetail: { postId: string };
  Conversation: { conversationId: string; title?: string };
};

export type TabParamList = {
  Home: undefined;
  Activity: undefined;
  Search: undefined;
  Create: undefined;
  Browse: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <VibeTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isReady, isSignedIn } = useAuth();

  if (!isReady) {
    return (
      <Screen>
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
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="Conversation" component={ConversationScreen} />
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
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: colors.background,
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
