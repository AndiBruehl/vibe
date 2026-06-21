import Constants from "expo-constants";

export type Profile = {
  id: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  subtitle?: string | null;
  bio?: string | null;
};

export type Post = {
  id: string;
  image: string;
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
};

export type ConversationSummary = {
  id: string;
  title: string;
  avatar?: string | null;
  latestMessage?: string | null;
  updatedAt: string;
  unread: boolean;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { getStoredToken } = await import("@/lib/sessionStore");
  const token = await getStoredToken();
  const headers = new Headers(init?.headers);

  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Request failed: ${response.status}`;

    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export const api = {
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
  getProfile: () => request<Profile>("/api/mobile/profile"),
  getUploadUrl: () => request<UploadUrlResponse>("/api/mobile/upload/url"),
  loginWithGoogle: (idToken: string) =>
    request<AuthResponse>("/api/mobile/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),
};

export { apiUrl };
