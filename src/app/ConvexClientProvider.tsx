"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

// ✅ Protection : utiliser une URL par défaut si NEXT_PUBLIC_CONVEX_URL n'est pas défini
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(convexUrl, {
  verbose: true, // Activé pour le debugging en production
});

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // ✅ Si l'URL Convex n'est pas définie, on retourne les children sans le provider
  // Cela évite les erreurs 404 si Convex n'est pas configuré
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.warn("NEXT_PUBLIC_CONVEX_URL is not defined. Convex features will be disabled.");
    return <>{children}</>;
  }

  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
