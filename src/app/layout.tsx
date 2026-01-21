import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import { ThemeProvider } from "@/components/next-theme/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UserProvider } from "@/contexts/UserContext";
// Temporairement désactivé - à réactiver plus tard
// import { AutoTranslateProvider } from "@/components/translation/AutoTranslateProvider";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { getLocale, getMessages } from 'next-intl/server';
import { DynamicIntlProvider } from '@/components/providers/DynamicIntlProvider';
import { ServiceWorkerRegistration } from '@/components/service-worker/ServiceWorkerRegistration';
import { SeedsGainManager } from "@/components/seeds/SeedsGainManager";
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import NextTopLoader from 'nextjs-toploader';

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seed.media"),
  title: {
    default: "Seed - Anticipez les décisions importantes",
    template: "%s | Seed",
  },
  description: "Suivez les décisions qui façonnent notre monde et testez votre intuition en anticipant leur issue.",
  keywords: [
    "décisions importantes",
    "anticipation",
    "actualité",
    "prédiction",
    "intuition",
    "apprendre",
    "comprendre le monde",
    "seeds",
  ],
  authors: [{ name: "Seed Community" }],
  creator: "Seed by Laiyr",
  publisher: "Seed by Laiyr",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Seed",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Seed",
    title: "Seed - Anticipez les décisions importantes",
    description: "Suivez les décisions qui façonnent notre monde et testez votre intuition en anticipant leur issue.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Seed - Anticipez les décisions importantes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seed - Anticipez les décisions importantes",
    description: "Suivez les décisions qui façonnent notre monde et testez votre intuition en anticipant leur issue.",
    images: ["/og-image.png"],
    creator: "@seedmedia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "Technology",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "theme-color": "#246BFD",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Charger la locale et les messages pour next-intl
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ViewTransitions>
      <html lang={locale} suppressHydrationWarning>
        <body
          className={`${jetbrainsMono.variable} antialiased font-mono`}
        >
        <NextTopLoader
          color="#246BFD"
          showSpinner={false}
          height={3}
          shadow="0 0 10px #246BFD,0 0 5px #246BFD"
        />
        {/* SVG Gradients pour les icônes */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <defs>
            {/* Gradient light mode (noir) */}
            <linearGradient id="gradient-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0B1320" />
              <stop offset="100%" stopColor="rgba(11, 19, 32, 0.55)" />
            </linearGradient>
            {/* Gradient dark mode (blanc) */}
            <linearGradient id="gradient-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.60)" />
            </linearGradient>
            {/* Gradient actif (bleu) */}
            <linearGradient id="gradient-active" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#246BFD" />
              <stop offset="100%" stopColor="#1A5DE8" />
            </linearGradient>
          </defs>
        </svg>
         <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <NuqsAdapter>
              <ConvexClientProvider>
                <UserProvider>
                  <DynamicIntlProvider initialLocale={locale} initialMessages={messages}>
                    <LanguageProvider>
                      <ServiceWorkerRegistration />
                      <SeedsGainManager />
                      <InstallPrompt />
                      <main>
                        {children}
                      </main>
                      <Toaster />
                    </LanguageProvider>
                  </DynamicIntlProvider>
                </UserProvider>
              </ConvexClientProvider>
            </NuqsAdapter>
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
