import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: "mobile",
      name: "VIBE mobile",
      credentials: { token: { label: "token", type: "text" } },
      async authorize(credentials) {
        const token = typeof credentials?.token === "string" ? credentials.token : "";
        const { verifyMobileToken } = await import("@/mobile-auth");
        const payload = verifyMobileToken(token);
        if (!payload) return null;

        return { id: payload.sub, email: payload.email };
      },
    }),
  ],
  trustHost: true,
});
