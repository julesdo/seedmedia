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

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seed.media"),
  title: {
    default: "Seed - Le média social de la résilience technologique",
    template: "%s | Seed",
  },
  description: "Plateforme d'information et d'utilité publique où la communauté publie, organise, vérifie et fait évoluer les contenus sur les technologies résilientes et l'IA éthique. Gouvernance partagée, pas d'algos opaques.",
  keywords: [
    "technologies résilientes",
    "IA éthique",
    "média communautaire",
    "gouvernance partagée",
    "vérification collaborative",
    "information publique",
    "développement durable",
    "innovation responsable",
  ],
  authors: [{ name: "Seed Community" }],
  creator: "Seed by Laiyr",
  publisher: "Seed by Laiyr",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Seed",
    title: "Seed - Le média social de la résilience technologique",
    description: "Plateforme d'information et d'utilité publique où la communauté publie, organise, vérifie et fait évoluer les contenus sur les technologies résilientes et l'IA éthique.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Seed - Le média social de la résilience technologique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seed - Le média social de la résilience technologique",
    description: "Plateforme d'information et d'utilité publique où la communauté publie, organise, vérifie et fait évoluer les contenus.",
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
