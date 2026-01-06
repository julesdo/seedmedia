import { Metadata } from "next";
import { AnticipationsClient } from "./AnticipationsClient";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const metadata: Metadata = {
  title: "Mes Anticipations | Seed",
  description:
    "Consultez toutes vos anticipations et suivez leur résolution sur Seed",
  openGraph: {
    title: "Mes Anticipations | Seed",
    description: "Consultez toutes vos anticipations et suivez leur résolution",
    type: "website",
  },
};

export default async function AnticipationsPage() {
  // Précharger les anticipations (sera utilisé côté client avec auth)
  return <AnticipationsClient />;
}

