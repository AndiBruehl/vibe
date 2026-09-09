import Constants from "expo-constants";

export type Profile = {
  id: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  subtitle?: string | null;
  bio?: string | null;
  isFollowing?: boolean;
  isSelf?: boolean;
};

export type Post = {
  id: string;
  image: string;
  images?: string[];
  liked?: boolean;
  description: string;
  likesCount: number;
  createdAt: string;
  author: Profile;
};

export type ActivityItem = {
  id: string;
  type: "follow" | "like" | "comment" | "message";
  title: string;
  body: string;
  createdAt: string;
  image?: string | null;
  avatar?: string | null;
  postId?: string;
  conversationId?: string;
  conversationTitle?: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  avatar?: string | null;
  latestMessage?: string | null;
  updatedAt: string;
  unread: boolean;
  unreadCount: number;
};

export type Message = {
  id: string;
  body: string;
  createdAt: string;
  isOwnMessage: boolean;
};

export type AuthResponse = {
  profile: Profile;
  token: string;
};

export type UploadUrlResponse = {
  gatewayBaseUrl: string;
  url: string;
};

const expoExtra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  expoExtra?.apiUrl ||
  "https://vibe-social-network.vercel.app";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const sessionExpiredListeners = new Set<(token: string) => void>();
export function onSessionExpired(listener: (token: string) => void) {
  sessionExpiredListeners.add(listener);
  return () => { sessionExpiredListeners.delete(listener); };
}

async function request<T>(path: string, init?: RequestInit, sessionToken?: string): Promise<T> {
  const { getStoredToken } = await import("@/lib/sessionStore");
  const token = sessionToken ?? await getStoredToken();
  const headers = new Headers(init?.headers);

  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
    ...init, headers, signal: controller.signal,
  });

  if (!response.ok) {
    if (response.status === 401 && token && !sessionToken) {
      sessionExpiredListeners.forEach(listener => listener(token));
    }
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Request failed: ${response.status}`;

    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, controller.signal.aborted
      ? "The server took too long to respond. Please try again."
      : "Could not connect to VIBE. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  updateProfile: (input: Pick<Profile, "name" | "username" | "avatar" | "subtitle" | "bio">) => request<Profile>("/api/mobile/profile", {
    method: "PATCH", body: JSON.stringify(input),
  }),
  setProfileFollowing: (profileId: string, following: boolean) => request<{ following: boolean; followers: number; followingCount: number }>(`/api/mobile/profiles/${profileId}/follow`, {
    method: "PUT", body: JSON.stringify({ following }),
  }),
  getProfiles: (query: string, sort: string) => request<Profile[]>(`/api/mobile/profiles?q=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}`),
  setPostLiked: (postId: string, liked: boolean) => request<{ liked: boolean; likes: number }>(`/api/mobile/posts/${postId}/like`, {
    method: "PUT", body: JSON.stringify({ liked }),
  }),
  createPost: (input: { description: string; image: string; topics?: string }) =>
    request<Post>("/api/mobile/posts", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getHomePosts: () => request<Post[]>("/api/mobile/posts"),
  getBrowsePosts: () => request<Post[]>("/api/mobile/posts?mode=browse"),
  getPost: (postId: string) => request<Post>(`/api/mobile/posts/${postId}`),
  search: (query: string) =>
    request<{ users: Profile[]; posts: Post[] }>(
      `/api/mobile/search?q=${encodeURIComponent(query)}`,
    ),
  getActivity: () => request<ActivityItem[]>("/api/mobile/activity"),
  getConversations: () =>
    request<ConversationSummary[]>("/api/mobile/messages"),
  getConversation: (conversationId: string) =>
    request<{ messages: Message[] }>(
      `/api/mobile/messages/${conversationId}`,
    ),
  sendMessage: (conversationId: string, body: string) =>
    request<Message>(`/api/mobile/messages/${conversationId}`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  getProfile: (token?: string) => request<Profile>("/api/mobile/profile", undefined, token),
  getUploadUrl: () => request<UploadUrlResponse>("/api/mobile/upload/url"),
  loginWithGoogle: (idToken: string) =>
    request<AuthResponse>("/api/mobile/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),
};

export { apiUrl };
