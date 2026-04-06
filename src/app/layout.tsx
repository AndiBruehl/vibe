import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import Script from "next/script";
import ThemeObserver from "@/app/components/ThemeObserver";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIBE",
  description: "VIBE social app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="disable-right-click" strategy="afterInteractive">
          {`
            document.addEventListener("contextmenu", function (e) {
              e.preventDefault();
            });
          `}
        </Script>

        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              const savedTheme = localStorage.getItem("theme");
              const theme = savedTheme || "dark";
              const html = document.documentElement;

              html.classList.remove("light", "dark");
              html.classList.add(theme);
              html.dataset.theme = theme;
            } catch (e) {}
          `}
        </Script>

        <Theme
          appearance="inherit"
          accentColor="gray"
          grayColor="gray"
          radius="large"
          scaling="100%"
        >
          <ThemeObserver />
          <div className="min-h-screen bg-ig-surface">{children}</div>
        </Theme>
      </body>
    </html>
  );
}
