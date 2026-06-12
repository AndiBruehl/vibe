import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ActivityScreen from "@/screens/ActivityScreen";
import BrowseScreen from "@/screens/BrowseScreen";
import CreateScreen from "@/screens/CreateScreen";
import HomeScreen from "@/screens/HomeScreen";
import MessagesScreen from "@/screens/MessagesScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import SearchScreen from "@/screens/SearchScreen";
import PostDetailScreen from "@/screens/PostDetailScreen";
import ConversationScreen from "@/screens/ConversationScreen";
import { colors } from "@/theme";

export type RootStackParamList = {
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => {
          const iconByRoute: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Activity: "notifications-outline",
            Search: "search-outline",
            Create: "camera-outline",
            Browse: "grid-outline",
            Messages: "chatbubble-ellipses-outline",
            Profile: "person-outline",
          };

          return <Ionicons name={iconByRoute[route.name]} color={color} size={size} />;
        },
      })}
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

export default function App() {
  return (
    <SafeAreaProvider>
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
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: "Post" }} />
          <Stack.Screen
            name="Conversation"
            component={ConversationScreen}
            options={({ route }) => ({ title: route.params.title || "Messages" })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
