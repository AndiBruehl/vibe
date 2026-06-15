export type Profile = {
  id: string;
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

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL || "https://vibe-social-network.vercel.app";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  getHomePosts: () => request<Post[]>("/api/mobile/posts"),
  getBrowsePosts: () => request<Post[]>("/api/mobile/posts?mode=browse"),
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
};

export { apiUrl };
