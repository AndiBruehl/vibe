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
      credentials: {
        token: {
          label: "token",
          type: "text",
        },
      },

      async authorize(credentials) {
        const token =
          typeof credentials?.token === "string" ? credentials.token : "";

        const { verifyMobileToken } = await import("@/mobile-auth");
        const payload = verifyMobileToken(token);

        if (!payload) {
          return null;
        }

        return {
          id: payload.sub,
          email: payload.email,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const { prisma } = await import("@/db");

      const existingProfile = await prisma.profile.findUnique({
        where: {
          email: user.email,
        },
      });

      const createUsername = () => {
        const emailBase =
          user.email!
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "")
            .slice(0, 20) || "user";

        return `${emailBase}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
      };

      if (!existingProfile) {
        await prisma.profile.create({
          data: {
            email: user.email,
            username: createUsername(),
            name: user.name || null,
          },
        });
      } else if (!existingProfile.username) {
        await prisma.profile.update({
          where: {
            email: user.email,
          },
          data: {
            username: createUsername(),
          },
        });
      }

      return true;
    },
  },

  trustHost: true,
});