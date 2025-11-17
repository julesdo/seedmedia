import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/next-theme/theme-provider";
import { Footer } from "@/components/footer";

import { ConvexClientProvider } from "./ConvexClientProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Seed by Laiyr",
  description: "Média + directory communautaire dédié aux technologies résilientes et à l'IA éthique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} min-h-[calc(100vh-2rem)] flex flex-col gap-4 antialiased font-sans`}
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
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ConvexClientProvider>
            <main className="grow flex flex-col">
            
              {children}
            </main>
            <Footer />
            </ConvexClientProvider>
            
          </ThemeProvider>
      </body>
    </html>
  );
}
