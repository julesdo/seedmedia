import { Metadata } from "next";
import { StatsPageClient } from "./StatsPageClient";

// ISR: Régénérer toutes les 5 minutes (données qui changent peu)
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Stats | Seed",
  description: "Statistiques et widgets de Seed",
};

export default function StatsPage() {
  return <StatsPageClient />;
}

