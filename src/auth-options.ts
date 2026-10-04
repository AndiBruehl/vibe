export function emailAuthAvailable() {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM && process.env.AUTH_URL);
}

export function availableLoginProviders() {
  return [
    { id: "google", name: "Google", enabled: Boolean((process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) && (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET)) },
    { id: "microsoft-entra-id", name: "Microsoft", enabled: Boolean(process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) },
    { id: "apple", name: "Apple", enabled: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET && process.env.AUTH_URL?.startsWith("https://")) },
    { id: "discord", name: "Discord", enabled: Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) },
  ];
}
