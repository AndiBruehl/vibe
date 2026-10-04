import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Apple from "next-auth/providers/apple";
import Discord from "next-auth/providers/discord";
import { cookies } from "next/headers";
import { availableLoginProviders, emailAuthAvailable } from "@/auth-options";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: { signIn: "/", error: "/" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),

    ...(availableLoginProviders().find((p) => p.id === "microsoft-entra-id")?.enabled ? [MicrosoftEntraID({ clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID, clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET, issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER || "https://login.microsoftonline.com/common/v2.0" })] : []),
    ...(availableLoginProviders().find((p) => p.id === "apple")?.enabled ? [Apple({ clientId: process.env.AUTH_APPLE_ID, clientSecret: process.env.AUTH_APPLE_SECRET })] : []),
    ...(availableLoginProviders().find((p) => p.id === "discord")?.enabled ? [Discord({ clientId: process.env.AUTH_DISCORD_ID, clientSecret: process.env.AUTH_DISCORD_SECRET })] : []),
    ...(emailAuthAvailable() ? [Credentials({
      id: "password", name: "Email and password", credentials: { email: {}, password: { type: "password" } },
      async authorize(credentials) {
        try { const { passwordLogin } = await import("@/login-store"); return await passwordLogin(credentials.email, credentials.password); }
        catch { return null; }
      },
    })] : []),

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

        const { prisma } = await import("@/db");
        const owner = await prisma.profile.findUnique({ where: { email: payload.email }, select: { id: true } });
        if (!owner || owner.id !== payload.sub) return null;

        return {
          id: payload.sub,
          email: payload.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Bind sessions to an immutable profile ID, not a reusable email address.
      // Legacy sessions must authenticate again to acquire this binding.
      if (!account && typeof token.profileId !== "string") return null;
      if (!token.email) return null;
      try {
        const { prisma } = await import("@/db");
        const owner = await prisma.profile.findUnique({ where: { email: token.email }, select: { id: true } });
        if (!owner || (!account && owner.id !== token.profileId)) return null;
        token.profileId = owner.id;
      } catch { return null; }
      if (account?.provider === "password" && user) {
        token.passwordVersion = (user as { authVersion?: number }).authVersion;
      }
      if (typeof token.passwordVersion === "number" && token.email) {
        try {
          const { prisma } = await import("@/db");
          const { credentialId } = await import("@/login-store");
          const credential = await prisma.loginCredential.findUnique({ where: { id: credentialId(token.email) }, select: { version: true } });
          if (credential?.version !== token.passwordVersion) return null;
        } catch { return null; }
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      if (account && ["google", "microsoft-entra-id", "apple", "discord"].includes(account.provider)) {
        try {
          const { resolveOAuth } = await import("@/login-oauth");
          const claims = profile as { email_verified?: unknown; verified?: unknown } | undefined;
          // Auth.js supplies the raw OAuth profile to this callback.
          const verified = account.provider === "discord" ? claims?.verified === true : account.provider !== "microsoft-entra-id" && (claims?.email_verified === true || claims?.email_verified === "true");
          // The one-time proof binds the additional provider to the signed-in
          // profile, including when the two providers use different emails.
          const cookieStore = await cookies();
          const linkToken = cookieStore.get("vibe-link")?.value;
          if (linkToken) cookieStore.set("vibe-link", "", { path: "/api/auth", maxAge: 0 });
          const resolved = await resolveOAuth(account.provider, account.providerAccountId, user.email, verified, linkToken, user.name);
          if (resolved.redirect) return resolved.redirect;
          user.email = resolved.email;
        } catch (error) {
          console.error("OAuth provider resolution failed", { provider: account.provider, error });
          return "/?notice=unavailable";
        }
      }
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
        const profile = await prisma.profile.create({
          data: {
            email: user.email,
            username: createUsername(),
            name: user.name || null,
          },
        });
        const { claimWelcomeAndSend } = await import("@/system-profile");
        await claimWelcomeAndSend(profile).catch(() => console.warn("Welcome delivery deferred after account creation"));
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

      if (existingProfile && !existingProfile.welcomeSentAt) {
        const { claimWelcomeAndSend } = await import("@/system-profile");
        await claimWelcomeAndSend(existingProfile).catch(() => console.warn("Welcome delivery deferred after sign-in"));
      }
      return true;
    },
  },

  trustHost: true,
});
